
"use server";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { prisma } from "@/lib/prisma";

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalLessons: number;
  totalExams: number;
}

export interface TeacherRecentActivity {
  id: string;
  studentName: string;
  studentImage: string | null;
  activity: string;
  examTitle: string;
  score: number;
  passed: boolean;
  createdAt: string;
}

export interface TeacherStudentAttention {
  id: string;
  name: string;
  email: string;
  image: string | null;
  averageScore: number;
  totalAttempts: number;
  updatedAt: string;
}

export interface TeacherDashboardData {
  stats: TeacherDashboardStats;
  recentActivities: TeacherRecentActivity[];
  studentsNeedingAttention: TeacherStudentAttention[];
}

export interface GetTeacherDashboardResult {
  success: boolean;
  data: TeacherDashboardData | null;
  error?: string;
}

const emptyDashboardData: TeacherDashboardData = {
  stats: {
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalExams: 0,
  },
  recentActivities: [],
  studentsNeedingAttention: [],
};

export async function getTeacherDashboardAction(): Promise<GetTeacherDashboardResult> {
  try {
    // 1. Authentication & Authorization
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
        error: "غير مصرح لك بالوصول إلى هذه البيانات",
      };
    }

    const teacherId = user.id;

    // 2. Get teacher courses
    const courses = await prisma.course.findMany({
      where: {
        teacherId,
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });

    if (courses.length === 0) {
      return {
        success: true,
        data: emptyDashboardData,
      };
    }

    const courseIds = courses.map((course) => course.id);

    // 3. Get dashboard data in parallel
    const [
      enrolledStudents,
      totalExams,
      recentAttempts,
    ] = await Promise.all([
      // Unique students enrolled in teacher courses
      prisma.enrollment.findMany({
        where: {
          courseId: {
            in: courseIds,
          },
        },
        select: {
          studentId: true,
        },
        distinct: ["studentId"],
      }),

      // Total exams belonging to teacher courses
      prisma.exam.count({
        where: {
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
      }),

      // Latest student exam attempts
      prisma.examAttempt.findMany({
        where: {
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
        orderBy: {
          startedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          score: true,
          passed: true,
          startedAt: true,
          submittedAt: true,

          student: {
            select: {
              name: true,
              image: true,
            },
          },

          exam: {
            select: {
              type: true,
              course: {
                select: {
                  title: true,
                },
              },
              lesson: {
                select: {
                  title: true,
                  course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // 4. Get students who need attention
    const studentIds = enrolledStudents.map(
      (student) => student.studentId,
    );

    const studentsNeedingAttention =
      studentIds.length > 0
        ? await prisma.studentProfile.findMany({
            where: {
              userId: {
                in: studentIds,
              },
              strugglingFlag: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 5,
            select: {
              userId: true,
              overallAverageScore: true,
              totalAttempts: true,
              updatedAt: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          })
        : [];

    // 5. Calculate statistics
    const totalLessons = courses.reduce(
      (total, course) => total + course._count.lessons,
      0,
    );

    const stats: TeacherDashboardStats = {
      totalCourses: courses.length,
      totalStudents: enrolledStudents.length,
      totalLessons,
      totalExams,
    };

    // 6. Format recent activities
    const recentActivities: TeacherRecentActivity[] =
      recentAttempts.map((attempt) => {
        const examTitle =
          attempt.exam.lesson?.title ??
          attempt.exam.course?.title ??
          "اختبار";

        return {
          id: attempt.id,
          studentName:
            attempt.student.name ?? "طالب بدون اسم",
          studentImage: attempt.student.image,
          activity: attempt.submittedAt
            ? "أكمل اختبارًا"
            : "بدأ اختبارًا",
          examTitle,
          score: attempt.score,
          passed: attempt.passed,
          createdAt: (
            attempt.submittedAt ?? attempt.startedAt
          ).toISOString(),
        };
      });

    // 7. Format students needing attention
    const attentionStudents: TeacherStudentAttention[] =
      studentsNeedingAttention.map((profile) => ({
        id: profile.userId,
        name: profile.user.name ?? "طالب بدون اسم",
        email: profile.user.email,
        image: profile.user.image,
        averageScore: profile.overallAverageScore,
        totalAttempts: profile.totalAttempts,
        updatedAt: profile.updatedAt.toISOString(),
      }));

    // 8. Return dashboard data
    return {
      success: true,
      data: {
        stats,
        recentActivities,
        studentsNeedingAttention: attentionStudents,
      },
    };
  } catch (error) {
    console.error(
      "[GET_TEACHER_DASHBOARD_ACTION]",
      error,
    );

    return {
      success: false,
      data: null,
      error: "حدث خطأ أثناء تحميل لوحة تحكم المدرس",
    };
  }
}
