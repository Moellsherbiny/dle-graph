
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChartColumn,
  Users,
  BookOpen,
  ClipboardList,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
  Filter,
  CircleAlert,
} from "lucide-react";

import {
  getTeacherProgressAction,
  type TeacherProgressData,
  type TeacherProgressStudent,
} from "@/actions/teacher/get-teacher-progress";

type StudentStatus = "ALL" | "ACTIVE" | "COMPLETED" | "AT_RISK";

export default function TeacherProgressPage() {
  const [data, setData] = useState<TeacherProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedStatus, setSelectedStatus] =
    useState<StudentStatus>("ALL");

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getTeacherProgressAction();

      if (!result.success || !result.data) {
        throw new Error(result.error || "تعذر تحميل بيانات التقدم");
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = search.trim().toLowerCase();

    return data.students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        (student.name ?? "").toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        student.courses.some((course) =>
          course.toLowerCase().includes(normalizedSearch),
        );

      const matchesCourse =
        selectedCourse === "ALL" ||
        student.courses.some(
          (course) =>
            data.courses.find((item) => item.id === selectedCourse)
              ?.title === course,
        );

      const matchesStatus =
        selectedStatus === "ALL" ||
        student.status === selectedStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [data, search, selectedCourse, selectedStatus]);

  return (
    <main dir="rtl" className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            التقدم والنتائج
          </h1>

          <p className="mt-2 text-sm text-default-500">
            تابع أداء الطلاب ومستوى تقدمهم في الدورات التعليمية والدروس التعليمية.
          </p>
        </div>

        <button
          type="button"
          onClick={loadProgress}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-default-200 bg-content1 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-default-100 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          تحديث البيانات
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-5 dark:bg-danger-950/20">
          <AlertCircle size={22} className="shrink-0 text-danger" />

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-danger">
              تعذر تحميل تقارير التقدم
            </p>
            <p className="mt-1 text-sm text-default-500">{error}</p>
          </div>

          <button
            type="button"
            onClick={loadProgress}
            className="text-sm font-semibold text-danger hover:underline"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="font-bold text-foreground">ملخص الأداء</h2>
          <p className="mt-1 text-xs text-default-500">
            المؤشرات الإجمالية لجميع الدورات التعليمية المسندة إليك.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="الطلاب"
            value={data?.stats.totalStudents ?? 0}
            description="إجمالي الطلاب المسجلين"
            icon={Users}
          />

          <StatCard
            title="متوسط الدرجات"
            value={`${data?.stats.averageScore ?? 0}%`}
            description="متوسط درجات الاختبارات المكتملة"
            icon={ChartColumn}
          />

          <StatCard
            title="نسبة إكمال الدروس"
            value={`${data?.stats.completionRate ?? 0}%`}
            description={`${(data?.stats.completedLessons ?? 0).toLocaleString("ar-EG")} درس مكتمل`}
            icon={TrendingUp}
          />

          <StatCard
            title="محاولات الاختبارات"
            value={data?.stats.totalAttempts ?? 0}
            description="المحاولات التي تم تسليمها"
            icon={ClipboardList}
          />
        </div>
      </section>

      {/* Additional Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="الدورات التعليمية"
          value={data?.stats.totalCourses ?? 0}
          icon={BookOpen}
        />

        <SummaryCard
          title="الطلاب المكتملون"
          value={data?.stats.studentsCompleted ?? 0}
          icon={CheckCircle2}
          color="success"
        />

        <SummaryCard
          title="طلاب يحتاجون للمتابعة"
          value={data?.stats.studentsAtRisk ?? 0}
          icon={CircleAlert}
          color="warning"
        />
      </section>

      {/* Course Progress */}
      <section className="space-y-4">
        <div>
          <h2 className="font-bold text-foreground">
            تقدم الدورات التعليمية
          </h2>
          <p className="mt-1 text-xs text-default-500">
            مقارنة مستوى إكمال الدروس ومتوسط درجات الطلاب في كل دورة تعليمية.
          </p>
        </div>

        {loading ? (
          <LoadingCards count={2} />
        ) : data && data.courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {data.courses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border border-default-200 bg-content1 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen size={21} />
                    </div>

                    <div>
                      <h3 className="font-bold text-foreground">
                        {course.title}
                      </h3>
                      <p className="mt-1 text-xs text-default-500">
                        {course.totalStudents.toLocaleString("ar-EG")} طالب
                        {" · "}
                        {course.totalLessons.toLocaleString("ar-EG")} درس
                      </p>
                    </div>
                  </div>

                  <span className="text-xl font-bold text-primary">
                    {course.completionRate}%
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-default-500">
                      نسبة إكمال الدروس
                    </span>
                    <span className="font-semibold text-foreground">
                      {course.completionRate}%
                    </span>
                  </div>

                  <ProgressBar value={course.completionRate} />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-default-200 pt-5">
                  <SmallMetric
                    label="الدرجات"
                    value={`${course.averageScore}%`}
                  />

                  <SmallMetric
                    label="الدروس المكتملة"
                    value={course.completedLessons}
                  />

                  <SmallMetric
                    label="المحاولات"
                    value={course.totalAttempts}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading && (
            <EmptyState message="لا توجد دورة تعليميةات أو بيانات تقدم حتى الآن." />
          )
        )}
      </section>

      {/* Students Table */}
      <section className="space-y-4">
        <div>
          <h2 className="font-bold text-foreground">
            أداء الطلاب
          </h2>
          <p className="mt-1 text-xs text-default-500">
            تفاصيل تقدم كل طالب ونتائجه في الدورات التعليمية المسجل بها.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-default-200 bg-content1 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-default-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الطالب أو البريد أو الدورة تعليمية..."
                className="h-11 w-full rounded-xl border border-default-200 bg-default-50 pr-10 pl-3 text-sm text-foreground outline-none placeholder:text-default-400 focus:border-primary dark:bg-default-100/5"
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
              className="h-11 rounded-xl border border-default-200 bg-content1 px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">جميع الدورات التعليمية</option>

              {data?.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as StudentStatus)
              }
              className="h-11 rounded-xl border border-default-200 bg-content1 px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="AT_RISK">يحتاج للمتابعة</option>
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-default-500">
            <span>
              {filteredStudents.length.toLocaleString("ar-EG")} طالب
            </span>

            {(search ||
              selectedCourse !== "ALL" ||
              selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCourse("ALL");
                  setSelectedStatus("ALL");
                }}
                className="font-semibold text-primary hover:underline"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-default-200 bg-content1">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-xl bg-default-100 dark:bg-default-100/5"
                />
              ))}
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-right text-sm">
                <thead className="bg-default-50 text-xs text-default-500 dark:bg-default-100/5">
                  <tr>
                    <th className="px-5 py-4 font-medium">الطالب</th>
                    <th className="px-5 py-4 font-medium">الدورات التعليمية</th>
                    <th className="px-5 py-4 font-medium">التقدم</th>
                    <th className="px-5 py-4 font-medium">متوسط الدرجات</th>
                    <th className="px-5 py-4 font-medium">المحاولات</th>
                    <th className="px-5 py-4 font-medium">الحالة</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-default-200">
                  {filteredStudents.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="لا توجد نتائج مطابقة للفلاتر المحددة." />
          )}
        </div>
      </section>
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
  value: number | string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-default-200 bg-content1 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-default-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-foreground">
            {typeof value === "number"
              ? value.toLocaleString("ar-EG")
              : value}
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

/* Summary Card */
function SummaryCard({
  title,
  value,
  icon: Icon,
  color = "primary",
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: "primary" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success-50 text-success dark:bg-success-950/20",
    warning: "bg-warning-50 text-warning dark:bg-warning-950/20",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-default-200 bg-content1 p-5">
      <div className={`flex size-12 items-center justify-center rounded-xl ${colorClasses[color]}`}>
        <Icon size={22} />
      </div>

      <div>
        <p className="text-sm text-default-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {value.toLocaleString("ar-EG")}
        </p>
      </div>
    </div>
  );
}

/* Small Metric */
function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-xs text-default-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-foreground">
        {typeof value === "number"
          ? value.toLocaleString("ar-EG")
          : value}
      </p>
    </div>
  );
}

/* Progress Bar */
function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(value, 100));

  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-default-100 dark:bg-default-100/10"
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

/* Student Row */
function StudentRow({
  student,
}: {
  student: TeacherProgressStudent;
}) {
  return (
    <tr className="transition hover:bg-default-50 dark:hover:bg-default-100/5">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-default-100 text-default-500">
            {student.image ? (
              <img
                src={student.image}
                alt={student.name || "الطالب"}
                className="size-full object-cover"
              />
            ) : (
              <Users size={18} />
            )}
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-foreground">
              {student.name || "طالب"}
            </p>
            <p className="mt-1 text-xs text-default-400">
              {student.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex max-w-52 flex-wrap gap-1.5">
          {student.courses.map((course) => (
            <span
              key={course}
              className="rounded-md bg-default-100 px-2 py-1 text-xs text-default-600 dark:bg-default-100/10"
            >
              {course}
            </span>
          ))}
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="min-w-32">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              {student.progressPercent}%
            </span>

            <span className="text-[11px] text-default-400">
              {student.completedLessons}/{student.totalLessons}
            </span>
          </div>

          <ProgressBar value={student.progressPercent} />
        </div>
      </td>

      <td className="px-5 py-4">
        <span className="font-semibold text-foreground">
          {student.averageScore}%
        </span>
      </td>

      <td className="px-5 py-4 text-default-600">
        {student.totalAttempts.toLocaleString("ar-EG")}
      </td>

      <td className="px-5 py-4">
        <StudentStatus status={student.status} />
      </td>
    </tr>
  );
}

/* Student Status */
function StudentStatus({
  status,
}: {
  status: TeacherProgressStudent["status"];
}) {
  const config = {
    ACTIVE: {
      label: "نشط",
      className: "bg-primary/10 text-primary",
    },
    COMPLETED: {
      label: "مكتمل",
      className: "bg-success-50 text-success dark:bg-success-950/20",
    },
    AT_RISK: {
      label: "يحتاج للمتابعة",
      className: "bg-warning-50 text-warning dark:bg-warning-950/20",
    },
  };

  const item = config[status];

  return (
    <span className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  );
}

/* Empty State */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-default-100 text-default-400">
        <Filter size={25} />
      </div>

      <p className="text-sm text-default-500">{message}</p>
    </div>
  );
}

/* Loading Cards */
function LoadingCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-48 animate-pulse rounded-2xl border border-default-200 bg-content1"
        />
      ))}
    </div>
  );
}
