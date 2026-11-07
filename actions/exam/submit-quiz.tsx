"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type SubmittedAnswer = {
  questionId: string;
  selectedOptionIds: string[];
};

type SubmitQuizInput = {
  attemptId: string;
  answers: SubmittedAnswer[];
};

type SubmitQuizResult =
  | {
      success: true;
      result: {
        attemptId: string;
        attemptNumber: number;
        score: number;
        correctAnswers: number;
        wrongAnswers: number;
        unansweredQuestions: number;
        totalQuestions: number;
        passed: boolean;
        passingScore: number;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Normalize an array of IDs:
 * - Remove empty/invalid values.
 * - Remove duplicates.
 * - Sort IDs so selections can be compared as sets.
 */
function normalizeIds(ids: string[]) {
  return [
    ...new Set(
      ids.filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0,
      ),
    ),
  ].sort();
}

/** Compare two arrays as sets, regardless of their original order. */
function sameIds(a: string[], b: string[]) {
  const normalizedA = normalizeIds(a);
  const normalizedB = normalizeIds(b);

  if (normalizedA.length !== normalizedB.length) {
    return false;
  }

  return normalizedA.every((id, index) => id === normalizedB[index]);
}

export async function submitQuizAction(
  input: SubmitQuizInput,
): Promise<SubmitQuizResult> {
  try {
    // 1. Authentication
    const session = await auth();

    if (!session?.user?.id) {
      return {
        success: false,
        error: "يجب تسجيل الدخول أولاً.",
      };
    }

    const studentId = session.user.id;

    // 2. Validate input
    if (!input?.attemptId || typeof input.attemptId !== "string") {
      return {
        success: false,
        error: "معرّف المحاولة غير صالح.",
      };
    }

    if (!Array.isArray(input.answers)) {
      return {
        success: false,
        error: "الإجابات المرسلة غير صالحة.",
      };
    }

    // 3. Get the attempt and the server-side correct answers.
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: input.attemptId,
      },
      include: {
        exam: {
          include: {
            lesson: {
              select: {
                id: true,
                courseId: true,
              },
            },
            course: {
              select: {
                id: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: {
                  select: {
                    id: true,
                    isCorrect: true,
                  },
                },
              },
            },
            selectedOptions: {
              select: {
                optionId: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return {
        success: false,
        error: "لم يتم العثور على محاولة الاختبار.",
      };
    }

    // 4. Security checks
    if (attempt.studentId !== studentId) {
      return {
        success: false,
        error: "غير مسموح لك بتسليم هذه المحاولة.",
      };
    }

    if (attempt.submittedAt) {
      return {
        success: false,
        error: "تم تسليم هذا الاختبار بالفعل.",
      };
    }

    if (attempt.exam.type !== "LESSON_QUIZ") {
      return {
        success: false,
        error: "نوع الاختبار غير صحيح.",
      };
    }

    // 5. Resolve course
    const courseId =
      attempt.exam.courseId ?? attempt.exam.lesson?.courseId ?? null;

    if (!courseId) {
      return {
        success: false,
        error: "لم يتم العثور على الكورس المرتبط بالاختبار.",
      };
    }

    // 6. Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!enrollment) {
      return {
        success: false,
        error: "أنت غير مسجل في هذا الكورس.",
      };
    }

    // 7. Validate attempt questions
    const attemptAnswers = attempt.answers;

    if (attemptAnswers.length === 0) {
      return {
        success: false,
        error: "لا توجد أسئلة مرتبطة بهذه المحاولة.",
      };
    }

    // Build questionId -> selected option IDs.
    const submittedMap = new Map<string, string[]>();

    for (const submittedAnswer of input.answers) {
      if (
        !submittedAnswer ||
        typeof submittedAnswer.questionId !== "string" ||
        submittedAnswer.questionId.length === 0
      ) {
        continue;
      }

      const optionIds = Array.isArray(submittedAnswer.selectedOptionIds)
        ? submittedAnswer.selectedOptionIds
        : [];

      // If a question is submitted more than once, keep the last value.
      submittedMap.set(
        submittedAnswer.questionId,
        normalizeIds(optionIds),
      );
    }

    // 8. Reject answers for questions outside this attempt.
    const attemptQuestionIds = new Set(
      attemptAnswers.map((answer) => answer.questionId),
    );

    for (const submittedAnswer of input.answers) {
      if (
        submittedAnswer?.questionId &&
        !attemptQuestionIds.has(submittedAnswer.questionId)
      ) {
        return {
          success: false,
          error: "تم إرسال سؤال غير مرتبط بهذه المحاولة.",
        };
      }
    }

    // 9. Evaluate answers on the server.
    let correctAnswers = 0;
    let unansweredQuestions = 0;

    const evaluatedAnswers: {
      answerId: string;
      questionId: string;
      selectedOptionIds: string[];
      isCorrect: boolean;
    }[] = [];

    for (const attemptAnswer of attemptAnswers) {
      const questionId = attemptAnswer.questionId;
      const selectedOptionIds = submittedMap.get(questionId) ?? [];

      const correctOptionIds = normalizeIds(
        attemptAnswer.question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.id),
      );

      if (selectedOptionIds.length === 0) {
        unansweredQuestions++;

        evaluatedAnswers.push({
          answerId: attemptAnswer.id,
          questionId,
          selectedOptionIds: [],
          isCorrect: false,
        });

        continue;
      }

      // Every selected option must belong to this question.
      const validOptionIds = new Set(
        attemptAnswer.question.options.map((option) => option.id),
      );

      const hasInvalidOption = selectedOptionIds.some(
        (optionId) => !validOptionIds.has(optionId),
      );

      if (hasInvalidOption) {
        return {
          success: false,
          error: "تم إرسال اختيار غير صالح لأحد الأسئلة.",
        };
      }

      // The answer is correct only if the selected and correct sets match.
      const isCorrect = sameIds(selectedOptionIds, correctOptionIds);

      if (isCorrect) {
        correctAnswers++;
      }

      evaluatedAnswers.push({
        answerId: attemptAnswer.id,
        questionId,
        selectedOptionIds,
        isCorrect,
      });
    }

    // 10. Calculate score
    const totalQuestions = attemptAnswers.length;
    const wrongAnswers =
      totalQuestions - correctAnswers - unansweredQuestions;

    const score =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    const passed = score >= attempt.exam.passingScore;
    const submittedAt = new Date();

    // Prepare batch data outside the transaction.
    const answerIds = evaluatedAnswers.map((answer) => answer.answerId);

    const correctAnswerIds = evaluatedAnswers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.answerId);

    const incorrectAnswerIds = evaluatedAnswers
      .filter((answer) => !answer.isCorrect)
      .map((answer) => answer.answerId);

    const selectedOptionsData = evaluatedAnswers.flatMap((answer) =>
      answer.selectedOptionIds.map((optionId) => ({
        answerId: answer.answerId,
        optionId,
      })),
    );

    // 11. Transaction
    // Claim the attempt first. This conditional update prevents two
    // simultaneous submissions from processing the same attempt twice.
    const submissionCompleted = await prisma.$transaction(
      async (tx) => {
        const claim = await tx.examAttempt.updateMany({
          where: {
            id: attempt.id,
            studentId,
            submittedAt: null,
          },
          data: {
            score,
            passed,
            submittedAt,
          },
        });

        // Another request already submitted this attempt.
        if (claim.count !== 1) {
          return false;
        }

        // A. Batch update answer correctness.
        if (correctAnswerIds.length > 0) {
          await tx.answer.updateMany({
            where: {
              id: {
                in: correctAnswerIds,
              },
            },
            data: {
              isCorrect: true,
            },
          });
        }

        if (incorrectAnswerIds.length > 0) {
          await tx.answer.updateMany({
            where: {
              id: {
                in: incorrectAnswerIds,
              },
            },
            data: {
              isCorrect: false,
            },
          });
        }

        // Replace stored selected options for this attempt in one delete.
        if (answerIds.length > 0) {
          await tx.answerOption.deleteMany({
            where: {
              answerId: {
                in: answerIds,
              },
            },
          });
        }

        // Insert all selected options in one createMany.
        if (selectedOptionsData.length > 0) {
          await tx.answerOption.createMany({
            data: selectedOptionsData,
            skipDuplicates: true,
          });
        }

        // B. Update lesson progress.
        if (attempt.exam.lessonId) {
          const lessonId = attempt.exam.lessonId;

          const existingProgress = await tx.lessonProgress.findUnique({
            where: {
              studentId_lessonId: {
                studentId,
                lessonId,
              },
            },
            select: {
              id: true,
              status: true,
              bestScore: true,
              attemptsCount: true,
              unlockedAt: true,
              completedAt: true,
            },
          });

          const previousBestScore = existingProgress?.bestScore ?? 0;
          const bestScore = Math.max(previousBestScore, score);

          if (passed) {
            await tx.lessonProgress.upsert({
              where: {
                studentId_lessonId: {
                  studentId,
                  lessonId,
                },
              },
              create: {
                studentId,
                lessonId,
                status: "PASSED",
                bestScore,
                attemptsCount: 1,
                unlockedAt: existingProgress?.unlockedAt ?? submittedAt,
                completedAt: submittedAt,
              },
              update: {
                status: "PASSED",
                bestScore,
                attemptsCount: {
                  increment: 1,
                },
                completedAt: existingProgress?.completedAt ?? submittedAt,
              },
            });
          } else {
            await tx.lessonProgress.upsert({
              where: {
                studentId_lessonId: {
                  studentId,
                  lessonId,
                },
              },
              create: {
                studentId,
                lessonId,
                status: "IN_PROGRESS",
                bestScore,
                attemptsCount: 1,
                unlockedAt: submittedAt,
              },
              update: {
                bestScore,
                attemptsCount: {
                  increment: 1,
                },
              },
            });
          }
        }

        // C. Calculate student statistics in the database.
        // The aggregate includes this transaction's newly submitted attempt.
        const submittedAttempts = await tx.examAttempt.aggregate({
          where: {
            studentId,
            submittedAt: {
              not: null,
            },
          },
          _avg: {
            score: true,
          },
          _count: {
            _all: true,
          },
        });

        const totalAttempts = submittedAttempts._count._all;
        const overallAverageScore = submittedAttempts._avg.score ?? 0;
        const strugglingFlag = overallAverageScore < 50;

        // D. Update student profile.
        await tx.studentProfile.upsert({
          where: {
            userId: studentId,
          },
          create: {
            userId: studentId,
            overallAverageScore,
            totalAttempts,
            strugglingFlag,
          },
          update: {
            overallAverageScore,
            totalAttempts,
            strugglingFlag,
          },
        });

        return true;
      },
      {
        maxWait: 10000,
        timeout: 15000,
      },
    );

    if (!submissionCompleted) {
      return {
        success: false,
        error: "تم تسليم هذا الاختبار بالفعل.",
      };
    }

    // 12. Revalidate affected pages after the transaction commits.
    if (attempt.exam.lessonId) {
      revalidatePath(`/dashboard/lessons/${attempt.exam.lessonId}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/lessons");
    revalidatePath("/dashboard/quizzes");

    // 13. Return result.
    return {
      success: true,
      result: {
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        score,
        correctAnswers,
        wrongAnswers,
        unansweredQuestions,
        totalQuestions,
        passed,
        passingScore: attempt.exam.passingScore,
      },
    };
  } catch (error) {
    console.error("[submitQuizAction]", error);

    return {
      success: false,
      error: "حدث خطأ أثناء تسليم الاختبار. حاول مرة أخرى.",
    };
  }
}
