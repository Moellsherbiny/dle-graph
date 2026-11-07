
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ClipboardList,
  FileQuestion,
  GraduationCap,
  Layers,
  ArrowUpLeft,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  BookMarked,
} from "lucide-react";

import {
  getTeacherLessonsAction,
  type TeacherLesson,
} from "@/actions/teacher/get-teacher-lessons";

type LessonsStats = {
  totalLessons: number;
  totalCourses: number;
  totalExams: number;
  totalQuestions: number;
};

export default function TeacherLessonsPage() {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [stats, setStats] = useState<LessonsStats>({
    totalLessons: 0,
    totalCourses: 0,
    totalExams: 0,
    totalQuestions: 0,
  });

  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLessons() {
    try {
      setLoading(true);
      setError(null);

      const result = await getTeacherLessonsAction();

      if (!result.success || !result.data) {
        throw new Error(result.error || "تعذر تحميل الدروس");
      }

      setLessons(result.data.lessons);
      setStats(result.data.stats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الدروس",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLessons();
  }, []);

  const courses = useMemo(() => {
    return Array.from(
      new Map(
        lessons.map((lesson) => [
          lesson.courseId,
          {
            id: lesson.courseId,
            title: lesson.courseTitle,
          },
        ]),
      ).values(),
    );
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return lessons.filter((lesson) => {
      const matchesSearch =
        !normalizedSearch ||
        lesson.title.toLowerCase().includes(normalizedSearch) ||
        lesson.courseTitle.toLowerCase().includes(normalizedSearch);

      const matchesCourse =
        selectedCourse === "ALL" ||
        lesson.courseId === selectedCourse;

      return matchesSearch && matchesCourse;
    });
  }, [lessons, search, selectedCourse]);

  return (
    <main dir="rtl" className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            إدارة الدروس
          </h1>

          <p className="mt-2 text-sm text-default-500">
            استعرض الدروس التعليمية وتابع محتواها والاختبارات المرتبطة بها.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLessons}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-default-200 bg-content1 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-default-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          تحديث البيانات
        </button>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الدروس"
          value={stats.totalLessons}
          description="عدد الدروس التعليمية"
          icon={BookOpen}
        />

        <StatCard
          title="الدورات التعليمية"
          value={stats.totalCourses}
          description="الدورات التعليمية التي تحتوي على دروس"
          icon={Layers}
        />

        <StatCard
          title="الاختبارات"
          value={stats.totalExams}
          description="الاختبارات المرتبطة بالدروس"
          icon={ClipboardList}
        />

        <StatCard
          title="الأسئلة"
          value={stats.totalQuestions}
          description="إجمالي أسئلة الدروس"
          icon={FileQuestion}
        />
      </section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-default-200 bg-content1 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-default-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن درس أو دورة تعليمية..."
              className="h-12 w-full rounded-xl border border-default-200 bg-default-50 pr-11 pl-4 text-sm text-foreground outline-none transition placeholder:text-default-400 focus:border-primary dark:bg-default-100/5"
            />
          </div>

          <select
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
            className="h-12 min-w-52 rounded-xl border border-default-200 bg-content1 px-4 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="ALL">جميع الدورات التعليمية</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-default-500">
          <span>
            عدد النتائج: {filteredLessons.length.toLocaleString("ar-EG")}
          </span>

          {(search || selectedCourse !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCourse("ALL");
              }}
              className="font-medium text-primary hover:underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-5 dark:bg-danger-950/20">
          <AlertCircle size={21} className="mt-0.5 shrink-0 text-danger" />

          <div className="flex-1">
            <p className="font-semibold text-danger">
              تعذر تحميل الدروس
            </p>
            <p className="mt-1 text-sm text-default-500">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadLessons}
            className="text-sm font-semibold text-danger hover:underline"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-default-200 bg-content1 p-5"
            >
              <div className="h-12 w-12 rounded-xl bg-default-200" />
              <div className="mt-5 h-5 w-3/4 rounded bg-default-200" />
              <div className="mt-3 h-4 w-1/2 rounded bg-default-100" />
              <div className="mt-6 h-20 rounded-xl bg-default-100" />
            </div>
          ))}
        </div>
      ) : !error && filteredLessons.length > 0 ? (
        /* Lessons Grid */
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredLessons.map((lesson) => (
            <article
              key={lesson.id}
              className="group flex flex-col rounded-2xl border border-default-200 bg-content1 p-5 transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={23} />
                </div>

                <span className="rounded-lg bg-default-100 px-3 py-1.5 text-xs font-medium text-default-600 dark:bg-default-100/10">
                  الدرس {lesson.order.toLocaleString("ar-EG")}
                </span>
              </div>

              <div className="mt-5">
                <h2 className="line-clamp-2 text-lg font-bold text-foreground">
                  {lesson.title}
                </h2>

                <p className="mt-2 flex items-center gap-2 text-sm text-default-500">
                  <BookMarked size={15} />
                  {lesson.courseTitle}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat
                  icon={ClipboardList}
                  label="الاختبارات"
                  value={lesson.stats.exams}
                />

                <MiniStat
                  icon={FileQuestion}
                  label="الأسئلة"
                  value={lesson.stats.questions}
                />

                <MiniStat
                  icon={GraduationCap}
                  label="سجلات التقدم"
                  value={lesson.stats.students}
                />

                <MiniStat
                  icon={Layers}
                  label="نسخ المحتوى"
                  value={lesson.stats.contentVariants}
                />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-default-200 pt-4">
                <span className="flex items-center gap-1.5 text-xs text-default-400">
                  <CalendarDays size={14} />
                  {new Intl.DateTimeFormat("ar-EG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(lesson.createdAt))}
                </span>

                <Link
                  href={`/teacher/lessons/${lesson.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
                >
                  عرض التفاصيل
                  <ArrowUpLeft size={16} />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : !error ? (
        /* Empty State */
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-default-300 bg-content1 px-6 py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-default-100 text-default-400">
            <BookOpen size={30} />
          </div>

          <h2 className="text-lg font-bold text-foreground">
            {lessons.length === 0
              ? "لا توجد دروس حتى الآن"
              : "لا توجد نتائج مطابقة"}
          </h2>

          <p className="mt-2 max-w-md text-sm text-default-500">
            {lessons.length === 0
              ? "لا توجد دروس مرتبطة بالدورات التعليمية المسندة إليك حاليًا."
              : "جرب تغيير كلمات البحث أو اختيار دورة تعليمية آخر."}
          </p>

          {(search || selectedCourse !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCourse("ALL");
              }}
              className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              عرض جميع الدروس
            </button>
          )}
        </section>
      ) : null}
    </main>
  );
}

/* Statistics Card */
function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-default-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-foreground">
            {value.toLocaleString("ar-EG")}
          </h3>
          <p className="mt-2 text-xs text-default-400">{description}</p>
        </div>

        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

/* Small Lesson Statistics */
function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-default-50 p-3 dark:bg-default-100/5">
      <Icon size={17} className="shrink-0 text-default-400" />

      <div className="min-w-0">
        <p className="text-xs text-default-400">{label}</p>
        <p className="mt-1 text-sm font-bold text-foreground">
          {value.toLocaleString("ar-EG")}
        </p>
      </div>
    </div>
  );
}
