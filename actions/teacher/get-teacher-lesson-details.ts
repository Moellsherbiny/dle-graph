
"use server";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { prisma } from "@/lib/prisma";

export interface TeacherLessonDetails {
  id: string;
  title: string;
  order: number;
  sourceContent: string;
  createdAt: Date;

  course: {
    id: string;
    title: string;
    description: string | null;
  };

  stats: {
    totalQuestions: number;
    totalExams: number;
    totalContentVariants: number;
    totalResources: number;
    totalProgressRecords: number;
    totalExamAttempts: number;
  };

  questions: {
    id: string;
    text: string;
    difficulty: string;
    generatedByAI: boolean;
    createdAt: Date;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  }[];

  exams: {
    id: string;
    type: string;
    passingScore: number;
    createdAt: Date;
    totalAttempts: number;
    recentAttempts: {
      id: string;
      score: number;
      passed: boolean;
      attemptNumber: number;
      startedAt: Date;
      submittedAt: Date | null;
      student: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }[];
  }[];

  contentVariants: {
    id: string;
    type: string;
    interactiveType: string | null;
    isSimplified: boolean;
    isSplitIntoParts: boolean;
    hasGraphics: boolean;
    data: unknown;
    variantOrder: number;
    generatedByAI: boolean;
    createdAt: Date;
  }[];

  externalResources: {
    id: string;
    title: string;
    url: string;
    source: string;
    createdAt: Date;
  }[];

  progress: {
    id: string;
    status: string;
    bestScore: number;
    attemptsCount: number;
    completedAt: Date | null;
    student: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
}

export async function getTeacherLessonDetailsAction(
  lessonId: string,
): Promise<{
  success: boolean;
  data: TeacherLessonDetails | null;
  error?: string;
}> {
  try {
    if (!lessonId?.trim()) {
      return {
        success: false,
        data: null,
        error: "معرّف الدرس غير صالح",
      };
    }

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

    // Verify lesson ownership through its course.
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          teacherId: user.id,
        },
      },

      select: {
        id: true,
        title: true,
        order: true,
        sourceContent: true,
        createdAt: true,

        course: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },

        questions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            text: true,
            difficulty: true,
            generatedByAI: true,
            createdAt: true,

            options: {
              select: {
                id: true,
                text: true,
                isCorrect: true,
              },
            },
          },
        },

        exams: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            type: true,
            passingScore: true,
            createdAt: true,

            _count: {
              select: {
                attempts: true,
              },
            },

            attempts: {
              orderBy: {
                startedAt: "desc",
              },
              take: 5,
              select: {
                id: true,
                score: true,
                passed: true,
                attemptNumber: true,
                startedAt: true,
                submittedAt: true,

                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            },
          },
        },

        contentVariants: {
          orderBy: {
            variantOrder: "asc",
          },
          select: {
            id: true,
            type: true,
            interactiveType: true,
            isSimplified: true,
            isSplitIntoParts: true,
            hasGraphics: true,
            data: true,
            variantOrder: true,
            generatedByAI: true,
            createdAt: true,
          },
        },

        externalResources: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            url: true,
            source: true,
            createdAt: true,
          },
        },

        progress: {
          orderBy: {
            completedAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            status: true,
            bestScore: true,
            attemptsCount: true,
            completedAt: true,

            student: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },

        _count: {
          select: {
            questions: true,
            exams: true,
            contentVariants: true,
            externalResources: true,
            progress: true,
          },
        },
      },
    });

    if (!lesson) {
      return {
        success: false,
        data: null,
        error: "الدرس غير موجود أو لا تملك صلاحية الوصول إليه",
      };
    }

    const totalExamAttempts = lesson.exams.reduce(
      (total, exam) => total + exam._count.attempts,
      0,
    );

    const data: TeacherLessonDetails = {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      sourceContent: lesson.sourceContent,
      createdAt: lesson.createdAt,

      course: lesson.course,

      stats: {
        totalQuestions: lesson._count.questions,
        totalExams: lesson._count.exams,
        totalContentVariants: lesson._count.contentVariants,
        totalResources: lesson._count.externalResources,
        totalProgressRecords: lesson._count.progress,
        totalExamAttempts,
      },

      questions: lesson.questions,

      exams: lesson.exams.map((exam) => ({
        id: exam.id,
        type: exam.type,
        passingScore: exam.passingScore,
        createdAt: exam.createdAt,
        totalAttempts: exam._count.attempts,
        recentAttempts: exam.attempts,
      })),

      contentVariants: lesson.contentVariants,

      externalResources: lesson.externalResources,

      progress: lesson.progress,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[GET_TEACHER_LESSON_DETAILS_ERROR]", error);

    return {
      success: false,
      data: null,
      error: "حدث خطأ أثناء تحميل تفاصيل الدرس",
    };
  }
}
