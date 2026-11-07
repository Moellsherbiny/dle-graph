"use server";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { prisma } from "@/lib/prisma";

export interface TeacherLesson {
  id: string;
  title: string;
  order: number;
  sourceContent: string;
  courseId: string;
  courseTitle: string;
  createdAt: Date;
  stats: {
    exams: number;
    questions: number;
    students: number;
    contentVariants: number;
  };
}

export interface TeacherLessonsData {
  lessons: TeacherLesson[];
  stats: {
    totalLessons: number;
    totalCourses: number;
    totalExams: number;
    totalQuestions: number;
  };
}

export async function getTeacherLessonsAction(): Promise<{
  success: boolean;
  data: TeacherLessonsData | null;
  error?: string;
}> {
  try {
    // Authenticate teacher
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

    // Get all lessons belonging to this teacher
    const lessons = await prisma.lesson.findMany({
      where: {
        course: {
          teacherId: user.id,
        },
      },
      orderBy: [
        {
          course: {
            title: "asc",
          },
        },
        {
          order: "asc",
        },
      ],
      select: {
        id: true,
        title: true,
        order: true,
        sourceContent: true,
        courseId: true,
        createdAt: true,

        course: {
          select: {
            title: true,
          },
        },

        _count: {
          select: {
            exams: true,
            questions: true,
            progress: true,
            contentVariants: true,
          },
        },
      },
    });

    // Map lessons into a simpler structure
    const formattedLessons: TeacherLesson[] = lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      sourceContent: lesson.sourceContent,
      courseId: lesson.courseId,
      courseTitle: lesson.course.title,
      createdAt: lesson.createdAt,

      stats: {
        exams: lesson._count.exams,
        questions: lesson._count.questions,
        students: lesson._count.progress,
        contentVariants: lesson._count.contentVariants,
      },
    }));

    // Calculate dashboard statistics
    const courseIds = new Set(lessons.map((lesson) => lesson.courseId));

    const stats = {
      totalLessons: lessons.length,
      totalCourses: courseIds.size,
      totalExams: lessons.reduce(
        (total, lesson) => total + lesson._count.exams,
        0,
      ),
      totalQuestions: lessons.reduce(
        (total, lesson) => total + lesson._count.questions,
        0,
      ),
    };

    return {
      success: true,
      data: {
        lessons: formattedLessons,
        stats,
      },
    };
  } catch (error) {
    console.error("[GET_TEACHER_LESSONS_ERROR]", error);

    return {
      success: false,
      data: null,
      error: "حدث خطأ أثناء تحميل الدروس",
    };
  }
}