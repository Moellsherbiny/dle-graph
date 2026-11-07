
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileQuestion,
  Layers,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Sparkles,
  AlertCircle,
  Users,
} from "lucide-react";

import { getTeacherLessonDetailsAction } from "@/actions/teacher/get-teacher-lesson-details";

interface TeacherLessonDetailsPageProps {
  params: Promise<{
    lessonId: string;
  }>;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getExamTypeLabel(type: string) {
  switch (type) {
    case "LESSON_QUIZ":
      return "اختبار الدرس";
    case "FINAL_EXAM":
      return "اختبار نهائي";
    default:
      return type;
  }
}

function getContentTypeLabel(type: string) {
  switch (type) {
    case "INFOGRAPHIC":
      return "إنفوجرافيك";
    case "VIDEO":
      return "فيديو";
    case "INTERACTIVE":
      return "محتوى تفاعلي";
    default:
      return type;
  }
}

function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case "EASY":
      return "سهل";
    case "MEDIUM":
      return "متوسط";
    case "HARD":
      return "صعب";
    default:
      return difficulty;
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-default-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-foreground">
            {value.toLocaleString("ar-EG")}
          </p>
        </div>

        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

export default async function TeacherLessonDetailsPage({
  params,
}: TeacherLessonDetailsPageProps) {
  const { lessonId } = await params;

  const result = await getTeacherLessonDetailsAction(lessonId);

  if (!result.success || !result.data) {
    return (
      <main dir="rtl" className="p-4 md:p-8">
        <Link
          href="/teacher/lessons"
          className="mb-6 inline-flex items-center gap-2 text-sm text-default-500 transition hover:text-primary"
        >
          <ArrowRight size={17} />
          العودة إلى الدروس
        </Link>

        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 dark:bg-danger-950/20">
          <div className="flex items-center gap-3 text-danger">
            <AlertCircle size={22} />
            <h2 className="font-bold">
              تعذر تحميل تفاصيل الدرس
            </h2>
          </div>

          <p className="mt-2 text-sm text-default-500">
            {result.error || "حدث خطأ غير متوقع"}
          </p>
        </div>
      </main>
    );
  }

  const lesson = result.data;

  return (
    <main dir="rtl" className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-default-500">
        <Link
          href="/teacher"
          className="transition hover:text-primary"
        >
          لوحة التحكم
        </Link>

        <span>/</span>

        <Link
          href="/teacher/lessons"
          className="transition hover:text-primary"
        >
          الدروس
        </Link>

        <span>/</span>

        <span className="font-medium text-foreground">
          تفاصيل الدرس
        </span>
      </div>

      {/* Lesson Header */}
      <section className="rounded-2xl border border-default-200 bg-content1 p-5 md:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="flex gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen size={28} />
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  الدرس {lesson.order.toLocaleString("ar-EG")}
                </span>

                <span className="rounded-lg bg-default-100 px-3 py-1 text-xs text-default-500 dark:bg-default-100/10">
                  {lesson.course.title}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {lesson.title}
              </h1>

              {lesson.course.description && (
                <p className="mt-2 max-w-2xl text-sm leading-7 text-default-500">
                  {lesson.course.description}
                </p>
              )}

              <p className="mt-3 flex items-center gap-2 text-xs text-default-400">
                <CalendarDays size={15} />
                تاريخ الإنشاء: {formatDate(lesson.createdAt)}
              </p>
            </div>
          </div>

          <Link
            href="/teacher/lessons"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-default-200 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-default-100"
          >
            <ArrowRight size={17} />
            العودة للدروس
          </Link>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="الأسئلة"
          value={lesson.stats.totalQuestions}
          icon={FileQuestion}
        />

        <StatCard
          title="الاختبارات"
          value={lesson.stats.totalExams}
          icon={ClipboardList}
        />

        <StatCard
          title="محاولات الاختبارات"
          value={lesson.stats.totalExamAttempts}
          icon={Clock}
        />

        <StatCard
          title="نسخ المحتوى"
          value={lesson.stats.totalContentVariants}
          icon={Layers}
        />

        <StatCard
          title="المصادر الخارجية"
          value={lesson.stats.totalResources}
          icon={ExternalLink}
        />

        <StatCard
          title="سجلات تقدم الطلاب"
          value={lesson.stats.totalProgressRecords}
          icon={GraduationCap}
        />
      </section>

      {/* Source Content */}
      <section className="rounded-2xl border border-default-200 bg-content1">
        <div className="flex items-center gap-3 border-b border-default-200 p-5">
          <BookOpen size={21} className="text-primary" />

          <div>
            <h2 className="font-bold text-foreground">
              المحتوى الأصلي للدرس
            </h2>
            <p className="mt-1 text-xs text-default-500">
              المحتوى الأساسي المستخدم في بناء الدرس.
            </p>
          </div>
        </div>

        <div className="p-5">
          {lesson.sourceContent ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-8 text-default-600">
              {lesson.sourceContent}
            </div>
          ) : (
            <EmptyMessage message="لا يوجد محتوى أصلي لهذا الدرس." />
          )}
        </div>
      </section>

      {/* Content Variants */}
      <section className="space-y-4">
        <SectionHeader
          title="نسخ المحتوى التعليمية"
          description="المحتويات المختلفة التي تم إنشاؤها للدرس حسب تفضيلات التعلم."
          icon={Layers}
          count={lesson.contentVariants.length}
        />

        {lesson.contentVariants.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {lesson.contentVariants.map((variant) => (
              <article
                key={variant.id}
                className="rounded-2xl border border-default-200 bg-content1 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-foreground">
                      نسخة المحتوى {variant.variantOrder}
                    </h3>

                    <p className="mt-1 text-sm text-default-500">
                      {getContentTypeLabel(variant.type)}
                    </p>
                  </div>

                  {variant.generatedByAI && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      <Sparkles size={14} />
                      تم إنشاؤها بالذكاء الاصطناعي
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {variant.isSimplified && (
                    <Tag>محتوى مبسط</Tag>
                  )}

                  {variant.isSplitIntoParts && (
                    <Tag>مقسم إلى أجزاء</Tag>
                  )}

                  {variant.hasGraphics && (
                    <Tag>يحتوي على رسومات</Tag>
                  )}

                  {variant.interactiveType && (
                    <Tag>{variant.interactiveType}</Tag>
                  )}
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-default-500">
                    بيانات المحتوى
                  </p>

                  <pre className="max-h-72 overflow-auto rounded-xl bg-default-100 p-4 text-xs leading-6 text-default-600 dark:bg-default-100/10">
                    {JSON.stringify(variant.data, null, 2)}
                  </pre>
                </div>

                <p className="mt-4 text-xs text-default-400">
                  تاريخ الإنشاء: {formatDate(variant.createdAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage message="لا توجد نسخ محتوى مرتبطة بهذا الدرس." />
        )}
      </section>

      {/* Questions */}
      <section className="space-y-4">
        <SectionHeader
          title="أسئلة الدرس"
          description="الأسئلة والاختيارات والإجابات الصحيحة."
          icon={FileQuestion}
          count={lesson.questions.length}
        />

        {lesson.questions.length > 0 ? (
          <div className="space-y-4">
            {lesson.questions.map((question, index) => (
              <article
                key={question.id}
                className="rounded-2xl border border-default-200 bg-content1 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-bold text-foreground">
                    السؤال {index + 1}
                  </span>

                  <div className="flex items-center gap-2">
                    <Tag>
                      {getDifficultyLabel(question.difficulty)}
                    </Tag>

                    {question.generatedByAI && (
                      <Tag>مولد بالذكاء الاصطناعي</Tag>
                    )}
                  </div>
                </div>

                <h3 className="mt-4 text-base font-semibold leading-7 text-foreground">
                  {question.text}
                </h3>

                {question.options.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                          option.isCorrect
                            ? "border-success-300 bg-success-50 text-success dark:bg-success-950/20"
                            : "border-default-200 bg-default-50 text-default-600 dark:bg-default-100/5"
                        }`}
                      >
                        {option.isCorrect ? (
                          <CheckCircle2
                            size={17}
                            className="shrink-0"
                          />
                        ) : (
                          <span className="size-[17px] shrink-0 rounded-full border border-default-300" />
                        )}

                        <span>{option.text}</span>

                        {option.isCorrect && (
                          <span className="mr-auto text-xs font-medium">
                            الإجابة الصحيحة
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-default-400">
                    لا توجد اختيارات لهذا السؤال.
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage message="لا توجد أسئلة مرتبطة بهذا الدرس." />
        )}
      </section>

      {/* Exams */}
      <section className="space-y-4">
        <SectionHeader
          title="اختبارات الدرس"
          description="الاختبارات المرتبطة بالدرس وآخر محاولات الطلاب."
          icon={ClipboardList}
          count={lesson.exams.length}
        />

        {lesson.exams.length > 0 ? (
          <div className="space-y-4">
            {lesson.exams.map((exam) => (
              <article
                key={exam.id}
                className="overflow-hidden rounded-2xl border border-default-200 bg-content1"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-default-200 p-5">
                  <div>
                    <h3 className="font-bold text-foreground">
                      {getExamTypeLabel(exam.type)}
                    </h3>

                    <p className="mt-2 text-xs text-default-500">
                      درجة النجاح: {exam.passingScore}%
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-xl font-bold text-foreground">
                      {exam.totalAttempts.toLocaleString("ar-EG")}
                    </p>
                    <p className="text-xs text-default-400">
                      إجمالي المحاولات
                    </p>
                  </div>
                </div>

                {exam.recentAttempts.length > 0 ? (
                  <div className="divide-y divide-default-200">
                    {exam.recentAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex flex-wrap items-center gap-3 p-4"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-default-100 text-default-500">
                          <Users size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {attempt.student.name || "طالب"}
                          </p>

                          <p className="mt-1 text-xs text-default-400">
                            المحاولة رقم{" "}
                            {attempt.attemptNumber.toLocaleString("ar-EG")}
                            {" · "}
                            {formatDate(attempt.submittedAt ?? attempt.startedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">
                            {attempt.score}%
                          </span>

                          {attempt.submittedAt ? (
                            attempt.passed ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-success-50 px-2.5 py-1.5 text-xs font-medium text-success dark:bg-success-950/20">
                                <CheckCircle2 size={14} />
                                اجتاز
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-danger-50 px-2.5 py-1.5 text-xs font-medium text-danger dark:bg-danger-950/20">
                                <XCircle size={14} />
                                لم يجتز
                              </span>
                            )
                          ) : (
                            <span className="rounded-lg bg-warning-50 px-2.5 py-1.5 text-xs font-medium text-warning dark:bg-warning-950/20">
                              لم يكتمل
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5">
                    <EmptyMessage message="لا توجد محاولات لهذا الاختبار حتى الآن." />
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyMessage message="لا توجد اختبارات مرتبطة بهذا الدرس." />
        )}
      </section>

      {/* External Resources */}
      <section className="space-y-4">
        <SectionHeader
          title="المصادر التعليمية"
          description="المصادر والروابط الخارجية المرتبطة بالدرس."
          icon={ExternalLink}
          count={lesson.externalResources.length}
        />

        {lesson.externalResources.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {lesson.externalResources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-default-200 bg-content1 p-4 transition hover:border-primary/40 hover:bg-default-50 dark:hover:bg-default-100/5"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ExternalLink size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {resource.title}
                  </p>
                  <p className="mt-1 text-xs text-default-500">
                    {resource.source}
                  </p>
                </div>

                <ExternalLink
                  size={17}
                  className="shrink-0 text-default-400"
                />
              </a>
            ))}
          </div>
        ) : (
          <EmptyMessage message="لا توجد مصادر خارجية لهذا الدرس." />
        )}
      </section>

      {/* Student Progress */}
      <section className="space-y-4">
        <SectionHeader
          title="تقدم الطلاب"
          description="آخر سجلات تقدم الطلاب في هذا الدرس."
          icon={GraduationCap}
          count={lesson.stats.totalProgressRecords}
        />

        {lesson.progress.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-sm">
                <thead className="bg-default-50 text-xs text-default-500 dark:bg-default-100/5">
                  <tr>
                    <th className="px-5 py-4 font-medium">الطالب</th>
                    <th className="px-5 py-4 font-medium">الحالة</th>
                    <th className="px-5 py-4 font-medium">أفضل درجة</th>
                    <th className="px-5 py-4 font-medium">المحاولات</th>
                    <th className="px-5 py-4 font-medium">تاريخ الإكمال</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-default-200">
                  {lesson.progress.map((record) => (
                    <tr key={record.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-foreground">
                          {record.student.name || "طالب"}
                        </p>
                        <p className="mt-1 text-xs text-default-400">
                          {record.student.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>

                      <td className="px-5 py-4 font-semibold text-foreground">
                        {record.bestScore}%
                      </td>

                      <td className="px-5 py-4 text-default-500">
                        {record.attemptsCount.toLocaleString("ar-EG")}
                      </td>

                      <td className="px-5 py-4 text-xs text-default-500">
                        {record.completedAt
                          ? formatDate(record.completedAt)
                          : "لم يكتمل بعد"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {lesson.stats.totalProgressRecords > lesson.progress.length && (
              <p className="border-t border-default-200 px-5 py-3 text-xs text-default-400">
                يتم عرض آخر {lesson.progress.length} سجلات من أصل{" "}
                {lesson.stats.totalProgressRecords} سجل.
              </p>
            )}
          </div>
        ) : (
          <EmptyMessage message="لا توجد سجلات تقدم للطلاب في هذا الدرس حتى الآن." />
        )}
      </section>
    </main>
  );
}

/* Section Header */
function SectionHeader({
  title,
  description,
  icon: Icon,
  count,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={21} />
        </div>

        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-xs text-default-500">{description}</p>
        </div>
      </div>

      <span className="rounded-lg bg-default-100 px-3 py-1.5 text-xs font-semibold text-default-600 dark:bg-default-100/10">
        {count.toLocaleString("ar-EG")}
      </span>
    </div>
  );
}

/* Tag */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-lg bg-default-100 px-2.5 py-1.5 text-xs text-default-600 dark:bg-default-100/10">
      {children}
    </span>
  );
}

/* Empty State */
function EmptyMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-default-300 bg-content1 px-5 py-10 text-center">
      <p className="text-sm text-default-400">{message}</p>
    </div>
  );
}

/* Progress Status */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    LOCKED: {
      label: "مقفل",
      className: "bg-default-100 text-default-500",
    },
    AVAILABLE: {
      label: "متاح",
      className: "bg-primary/10 text-primary",
    },
    IN_PROGRESS: {
      label: "قيد التقدم",
      className: "bg-warning-50 text-warning dark:bg-warning-950/20",
    },
    PASSED: {
      label: "مكتمل",
      className: "bg-success-50 text-success dark:bg-success-950/20",
    },
  };

  const item = config[status] ?? {
    label: status,
    className: "bg-default-100 text-default-500",
  };

  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  );
}
