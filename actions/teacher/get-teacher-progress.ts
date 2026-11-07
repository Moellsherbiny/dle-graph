
"use server";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { prisma } from "@/lib/prisma";

export interface TeacherProgressStudent {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  courses: string[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  averageScore: number;
  totalAttempts: number;
  status: "AT_RISK" | "COMPLETED" | "ACTIVE";
}

export interface TeacherCourseProgress {
  id: string;
  title: string;
  totalStudents: number;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  averageScore: number;
  totalAttempts: number;
}

export interface TeacherProgressData {
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
    averageScore: number;
    totalAttempts: number;
    studentsAtRisk: number;
    studentsCompleted: number;
  };
  courses: TeacherCourseProgress[];
  students: TeacherProgressStudent[];
}

export async function getTeacherProgressAction(): Promise<{
  success: boolean;
  data: TeacherProgressData | null;
  error?: string;
}> {
  try {
    const { user } = await getProfileStatus();

    if (!user) {
      return {
        success: false,
        data: null,
        error: "يجب تسجيل الدخول أولاً",
      };
    }

    if (user.role !== "TEACHER") {
      return {
        success: false,
        data: null,
        error: "غير مسموح لك بالوصول إلى هذه البيانات",
      };
    }

    const courses = await prisma.course.findMany({
      where: {
        teacherId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        enrollments: {
          select: {
            studentId: true,
            enrolledAt: true,
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
        },
      },
    });

    const courseIds = courses.map((course) => course.id);
    const lessonIds = courses.flatMap((course) =>
      course.lessons.map((lesson) => lesson.id),
    );

    const studentMap = new Map<
      string,
      {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        strugglingFlag: boolean;
        courses: Map<
          string,
          {
            title: string;
            lessonIds: string[];
          }
        >;
      }
    >();

    for (const course of courses) {
      for (const enrollment of course.enrollments) {
        const student = enrollment.student;

        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            id: student.id,
            name: student.name,
            email: student.email,
            image: student.image,
            strugglingFlag:
              student.studentProfile?.strugglingFlag ?? false,
            courses: new Map(),
          });
        }

        const studentData = studentMap.get(student.id)!;

        studentData.courses.set(course.id, {
          title: course.title,
          lessonIds: course.lessons.map((lesson) => lesson.id),
        });
      }
    }

    const studentIds = Array.from(studentMap.keys());

    if (studentIds.length === 0 || courseIds.length === 0) {
      return {
        success: true,
        data: {
          stats: {
            totalCourses: courses.length,
            totalStudents: 0,
            totalLessons: lessonIds.length,
            completedLessons: 0,
            completionRate: 0,
            averageScore: 0,
            totalAttempts: 0,
            studentsAtRisk: 0,
            studentsCompleted: 0,
          },
          courses: courses.map((course) => ({
            id: course.id,
            title: course.title,
            totalStudents: 0,
            totalLessons: course.lessons.length,
            completedLessons: 0,
            completionRate: 0,
            averageScore: 0,
            totalAttempts: 0,
          })),
          students: [],
        },
      };
    }

    const [progressRecords, attempts] = await Promise.all([
      prisma.lessonProgress.findMany({
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
          attemptsCount: true,
        },
      }),

      prisma.examAttempt.findMany({
        where: {
          studentId: {
            in: studentIds,
          },
          submittedAt: {
            not: null,
          },
          exam: {
            OR: [
              {
                courseId: {
                  in: courseIds,
                },
              },
              {
                lessonId: {
                  in: lessonIds,
                },
              },
            ],
          },
        },
        select: {
          studentId: true,
          score: true,
          exam: {
            select: {
              courseId: true,
              lessonId: true,
            },
          },
        },
      }),
    ]);

    const lessonCourseMap = new Map<string, string>();

    for (const course of courses) {
      for (const lesson of course.lessons) {
        lessonCourseMap.set(lesson.id, course.id);
      }
    }

    const progressMap = new Map<string, typeof progressRecords>();

    for (const record of progressRecords) {
      const current = progressMap.get(record.studentId) ?? [];
      current.push(record);
      progressMap.set(record.studentId, current);
    }

    const attemptsByStudent = new Map<string, typeof attempts>();

    for (const attempt of attempts) {
      const current = attemptsByStudent.get(attempt.studentId) ?? [];
      current.push(attempt);
      attemptsByStudent.set(attempt.studentId, current);
    }

    const students: TeacherProgressStudent[] = [];

    for (const student of studentMap.values()) {
      const enrolledCourses = Array.from(student.courses.entries());

      const enrolledLessonIds = enrolledCourses.flatMap(
        ([, course]) => course.lessonIds,
      );

      const studentProgress = progressMap.get(student.id) ?? [];
      const studentAttempts = attemptsByStudent.get(student.id) ?? [];

      const completedLessonIds = new Set(
        studentProgress
          .filter((record) => record.status === "PASSED")
          .map((record) => record.lessonId),
      );

      const completedLessons = enrolledLessonIds.filter((id) =>
        completedLessonIds.has(id),
      ).length;

      const totalLessons = enrolledLessonIds.length;

      const averageScore =
        studentAttempts.length > 0
          ? studentAttempts.reduce(
              (total, attempt) => total + attempt.score,
              0,
            ) / studentAttempts.length
          : 0;

      const progressPercent =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      let status: TeacherProgressStudent["status"] = "ACTIVE";

      if (student.strugglingFlag) {
        status = "AT_RISK";
      } else if (totalLessons > 0 && completedLessons === totalLessons) {
        status = "COMPLETED";
      }

      students.push({
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        courses: enrolledCourses.map(([, course]) => course.title),
        totalLessons,
        completedLessons,
        progressPercent,
        averageScore: Math.round(averageScore),
        totalAttempts: studentAttempts.length,
        status,
      });
    }

    students.sort((a, b) => b.progressPercent - a.progressPercent);

    const courseProgress: TeacherCourseProgress[] = courses.map(
      (course) => {
        const enrolledStudentIds = course.enrollments.map(
          (enrollment) => enrollment.studentId,
        );

        const courseLessonIds = course.lessons.map(
          (lesson) => lesson.id,
        );

        const courseProgressRecords = progressRecords.filter(
          (record) =>
            enrolledStudentIds.includes(record.studentId) &&
            courseLessonIds.includes(record.lessonId),
        );

        const completedLessons = courseProgressRecords.filter(
          (record) => record.status === "PASSED",
        ).length;

        const possibleCompletions =
          enrolledStudentIds.length * courseLessonIds.length;

        const completionRate =
          possibleCompletions > 0
            ? Math.round(
                (completedLessons / possibleCompletions) * 100,
              )
            : 0;

        const courseAttempts = attempts.filter((attempt) => {
          const attemptCourseId =
            attempt.exam.courseId ??
            (attempt.exam.lessonId
              ? lessonCourseMap.get(attempt.exam.lessonId)
              : undefined);

          return (
            attemptCourseId === course.id &&
            enrolledStudentIds.includes(attempt.studentId)
          );
        });

        const averageScore =
          courseAttempts.length > 0
            ? courseAttempts.reduce(
                (total, attempt) => total + attempt.score,
                0,
              ) / courseAttempts.length
            : 0;

        return {
          id: course.id,
          title: course.title,
          totalStudents: enrolledStudentIds.length,
          totalLessons: course.lessons.length,
          completedLessons,
          completionRate,
          averageScore: Math.round(averageScore),
          totalAttempts: courseAttempts.length,
        };
      },
    );

    const totalPossibleCompletions = students.reduce(
      (total, student) => total + student.totalLessons,
      0,
    );

    const totalCompletedLessons = students.reduce(
      (total, student) => total + student.completedLessons,
      0,
    );

    const totalAttempts = attempts.length;

    const averageScore =
      totalAttempts > 0
        ? attempts.reduce((total, attempt) => total + attempt.score, 0) /
          totalAttempts
        : 0;

    return {
      success: true,
      data: {
        stats: {
          totalCourses: courses.length,
          totalStudents: students.length,
          totalLessons: lessonIds.length,
          completedLessons: totalCompletedLessons,
          completionRate:
            totalPossibleCompletions > 0
              ? Math.round(
                  (totalCompletedLessons / totalPossibleCompletions) *
                    100,
                )
              : 0,
          averageScore: Math.round(averageScore),
          totalAttempts,
          studentsAtRisk: students.filter(
            (student) => student.status === "AT_RISK",
          ).length,
          studentsCompleted: students.filter(
            (student) => student.status === "COMPLETED",
          ).length,
        },
        courses: courseProgress,
        students,
      },
    };
  } catch (error) {
    console.error("[GET_TEACHER_PROGRESS_ERROR]", error);

    return {
      success: false,
      data: null,
      error: "حدث خطأ أثناء تحميل تقارير التقدم",
    };
  }
}
