import type {
  LessonContentVariant,
  RecommendedRemediation,
} from "@/types/lessons";

type RemediationAttempt = {
  attemptNumber: number;
  score: number;
  passed: boolean;
  exam: {
    passingScore: number;
  };
};

type GetLessonRemediationParams = {
  latestAttempt: RemediationAttempt | null;
  contentVariants: LessonContentVariant[];
};

export function getLessonRemediation({
  latestAttempt,
  contentVariants,
}: GetLessonRemediationParams): RecommendedRemediation | null {
  // الطالب لم يدخل الاختبار بعد
  if (!latestAttempt) {
    return null;
  }

  // الطالب نجح بالفعل
  if (latestAttempt.passed) {
    return null;
  }

  // بعد الرسوب: اعرض Presentation
  const presentationVariant = contentVariants.find(
    (variant) => variant.type === "VIDEO",
  );

  if (!presentationVariant) {
    return null;
  }

  return {
    variant: presentationVariant,
    reason: "LOW_SCORE",
    score: latestAttempt.score,
    attemptNumber: latestAttempt.attemptNumber,
  };
}