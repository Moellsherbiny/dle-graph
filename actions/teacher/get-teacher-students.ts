
"use server";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { prisma } from "@/lib/prisma";

export type TeacherStudentStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "AT_RISK";

export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  image: string | null;
  course: string;
  courses: string[];
  progress: number;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  status: TeacherStudentStatus;
  joinedAt: string;
}

export interface GetTeacherStudentsResult {
  success: boolean;
  data: TeacherStudent[];
  total: number;
  error?: string;
}

export async function getTeacherStudentsAction(): Promise<GetTeacherStudentsResult> {
  try {
    // 1. Authentication & Authorization
    const { user } = await getProfileStatus();

    if (!user) {
      return {
        success: false,
        data: [],
        total: 0,
        error: "يجب تسجيل الدخول أولاً",
      };
    }

    if (user.role !== "TEACHER") {
      return {
        success: false,
        data: [],
        total: 0,
        error: "غير مصرح لك بالوصول إلى هذه البيانات",
      };
    }

    const teacherId = user.id;

    // 2. Get courses assigned to this teacher
    const courses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
        lessons: {
          select: {
            id: true,
          },
        },
      },
    });

    if (courses.length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
      };
    }

    const courseIds = courses.map((course) => course.id);

    // Map every lesson to its course
    const lessonToCourse = new Map<string, string>();

    for (const course of courses) {
      for (const lesson of course.lessons) {
        lessonToCourse.set(lesson.id, course.id);
      }
    }

    const lessonIds = Array.from(lessonToCourse.keys());

    // 3. Get enrollments for teacher courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
      },
      orderBy: {
        enrolledAt: "asc",
      },
      select: {
        studentId: true,
        courseId: true,
        enrolledAt: true,
        course: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            studentProfile: {
              select: {
                strugglingFlag: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
      };
    }

    // 4. Group students and their enrolled courses
    const studentsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        image: string | null;
        enrolledAt: Date;
        strugglingFlag: boolean;
        courses: Map<string, string>;
      }
    >();

    for (const enrollment of enrollments) {
      const student = enrollment.student;

      let record = studentsMap.get(student.id);

      if (!record) {
        record = {
          id: student.id,
          name: student.name ?? "طالب بدون اسم",
          email: student.email,
          image: student.image,
          enrolledAt: enrollment.enrolledAt,
          strugglingFlag:
            student.studentProfile?.strugglingFlag ?? false,
          courses: new Map(),
        };

        studentsMap.set(student.id, record);
      }

      // Keep unique courses for each student
      record.courses.set(
        enrollment.courseId,
        enrollment.course.title,
      );

      // Keep the earliest enrollment date
      if (enrollment.enrolledAt < record.enrolledAt) {
        record.enrolledAt = enrollment.enrolledAt;
      }
    }

    const studentIds = Array.from(studentsMap.keys());

    // 5. Fetch lesson progress and exam attempts in parallel
    const [lessonProgress, examAttempts] = await Promise.all([
      // Progress only for lessons belonging to teacher courses
      lessonIds.length > 0
        ? prisma.lessonProgress.findMany({
            where: {
              studentId: {
                in: studentIds,
              },
              lessonId: {
                in: lessonIds,
              },
            },
            select: {
              studentId: true,
              lessonId: true,
              status: true,
              bestScore: true,
            },
          })
        : Promise.resolve([]),

      // Attempts for course exams and lesson exams
      prisma.examAttempt.findMany({
        where: {
          studentId: {
            in: studentIds,
          },
          exam: {
            OR: [
              {
                courseId: {
                  in: courseIds,
                },
              },
              {
                lesson: {
                  is: {
                    courseId: {
                      in: courseIds,
                    },
                  },
                },
              },
            ],
          },
        },
        select: {
          id: true,
          studentId: true,
          score: true,
          exam: {
            select: {
              courseId: true,
              lesson: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // 6. Aggregate lesson progress per student
    const progressMap = new Map<
      string,
      Set<string>
    >();

    for (const progress of lessonProgress) {
      const student = studentsMap.get(progress.studentId);

      if (!student) continue;

      const courseId = lessonToCourse.get(progress.lessonId);

      // Ignore courses the student is not enrolled in
      if (!courseId || !student.courses.has(courseId)) {
        continue;
      }

      if (!progressMap.has(progress.studentId)) {
        progressMap.set(progress.studentId, new Set());
      }

      if (progress.status === "PASSED") {
        progressMap.get(progress.studentId)!.add(
          progress.lessonId,
        );
      }
    }

    // 7. Aggregate exam scores per student
    const scoresMap = new Map<
      string,
      number[]
    >();

    for (const attempt of examAttempts) {
      const student = studentsMap.get(attempt.studentId);

      if (!student) continue;

      // Resolve the course associated with this exam
      const attemptCourseId =
        attempt.exam.courseId ??
        attempt.exam.lesson?.courseId;

      if (
        !attemptCourseId ||
        !student.courses.has(attemptCourseId)
      ) {
        continue;
      }

      if (!scoresMap.has(attempt.studentId)) {
        scoresMap.set(attempt.studentId, []);
      }

      scoresMap.get(attempt.studentId)!.push(
        attempt.score,
      );
    }

    // 8. Build final student list
    const data: TeacherStudent[] = Array.from(
      studentsMap.values(),
    ).map((student) => {
      // Only count lessons in courses this student is enrolled in
      const enrolledCourseIds = new Set(
        student.courses.keys(),
      );

      const totalLessons = courses.reduce(
        (total, course) => {
          if (!enrolledCourseIds.has(course.id)) {
            return total;
          }

          return total + course.lessons.length;
        },
        0,
      );

      const completedLessonIds =
        progressMap.get(student.id) ?? new Set<string>();

      const completedLessons = completedLessonIds.size;

      const progress =
        totalLessons > 0
          ? Math.round(
              (completedLessons / totalLessons) * 100,
            )
          : 0;

      const scores = scoresMap.get(student.id) ?? [];

      const averageScore =
        scores.length > 0
          ? Math.round(
              scores.reduce((sum, score) => sum + score, 0) /
                scores.length,
            )
          : 0;

      // Determine student status
      let status: TeacherStudentStatus = "ACTIVE";

      if (student.strugglingFlag) {
        status = "AT_RISK";
      } else if (
        totalLessons > 0 &&
        completedLessons === totalLessons
      ) {
        status = "COMPLETED";
      }

      const courseTitles = Array.from(
        student.courses.values(),
      );

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        course: courseTitles.join("، "),
        courses: courseTitles,
        progress,
        completedLessons,
        totalLessons,
        averageScore,
        status,
        joinedAt: student.enrolledAt.toISOString(),
      };
    });

    // 9. Return result
    return {
      success: true,
      data,
      total: data.length,
    };
  } catch (error) {
    console.error(
      "[GET_TEACHER_STUDENTS_ACTION]",
      error,
    );

    return {
      success: false,
      data: [],
      total: 0,
      error: "حدث خطأ أثناء تحميل بيانات الطلاب",
    };
  }
}
