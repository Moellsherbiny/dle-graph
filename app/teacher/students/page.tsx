
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Magnifier,
  Persons,
  BookOpen,
  ChartColumn,
  CircleCheck,
  CircleExclamation,
  ArrowRotateRight,
  Envelope,
  Calendar,
} from "@gravity-ui/icons";

import { Avatar, Button } from "@heroui/react";

import {
  getTeacherStudentsAction,
  type TeacherStudent,
} from "@/actions/teacher/get-teacher-students";

type StatusFilter = "ALL" | "ACTIVE" | "COMPLETED" | "AT_RISK";

const statusConfig = {
  ACTIVE: {
    label: "نشط",
    className: "bg-success/10 text-success",
  },
  COMPLETED: {
    label: "مكتمل",
    className: "bg-primary/10 text-primary",
  },
  AT_RISK: {
    label: "يحتاج متابعة",
    className: "bg-warning/10 text-warning",
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students
  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTeacherStudentsAction();

      if (!result.success) {
        setError(result.error ?? "تعذر تحميل بيانات الطلاب");
        return;
      }

      setStudents(result.data);
    } catch (err) {
      console.error("Failed to load teacher students:", err);
      setError("حدث خطأ أثناء تحميل بيانات الطلاب");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  // Search and filter
  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        student.courses.some((course) =>
          course.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        student.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  // Statistics
  const stats = useMemo(
    () => [
      {
        label: "إجمالي الطلاب",
        value: students.length,
        icon: Persons,
        color: "bg-primary/10 text-primary",
      },
      {
        label: "الطلاب النشطون",
        value: students.filter((s) => s.status === "ACTIVE").length,
        icon: ChartColumn,
        color: "bg-success/10 text-success",
      },
      {
        label: "أكملوا التعلم",
        value: students.filter((s) => s.status === "COMPLETED").length,
        icon: CircleCheck,
        color: "bg-primary/10 text-primary",
      },
      {
        label: "يحتاجون متابعة",
        value: students.filter((s) => s.status === "AT_RISK").length,
        icon: CircleExclamation,
        color: "bg-warning/10 text-warning",
      },
    ],
    [students],
  );

  return (
    <div dir="rtl" className="space-y-7">

      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              الطلاب
            </h1>

            {!loading && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {students.length}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-default-500">
            إدارة الطلاب المسجلين في دوراتك التعليمية ومتابعة تقدمهم
            ومستواهم التعليمي.
          </p>
        </div>

        <Button
          variant="outline"
          onPress={loadStudents}
          isDisabled={loading}
          className="w-fit"
        >
          <ArrowRotateRight
            width={17}
            height={17}
            className={loading ? "animate-spin" : ""}
          />
          تحديث البيانات
        </Button>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-xl border border-divider bg-content1 p-5 transition-colors hover:border-default-300"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${stat.color}`}
                >
                  <Icon width={22} height={22} />
                </div>

                {loading ? (
                  <div className="h-8 w-12 animate-pulse rounded-md bg-default-100" />
                ) : (
                  <span className="text-2xl font-bold tabular-nums">
                    {stat.value}
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm font-medium text-default-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </section>

      {/* Students Section */}
      <section className="overflow-hidden rounded-xl border border-divider bg-content1">

        {/* Section Header */}
        <div className="flex flex-col gap-4 border-b border-divider p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold">
              قائمة الطلاب
            </h2>

            <p className="mt-1 text-xs text-default-500">
              عرض ومتابعة جميع الطلاب المسجلين في دوراتك التعليمية
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* Search */}
            <div className="relative min-w-0 sm:w-72">
              <Magnifier
                width={18}
                height={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-default-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن طالب..."
                className="h-10 w-full rounded-lg border border-divider bg-default-50 pr-10 pl-3 text-sm outline-none transition-colors placeholder:text-default-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="h-10 rounded-lg border border-divider bg-default-50 px-3 text-sm outline-none transition-colors focus:border-primary"
              aria-label="فلترة حسب حالة الطالب"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="AT_RISK">يحتاج متابعة</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between border-b border-divider bg-default-50/50 px-5 py-3">
          <p className="text-xs text-default-500">
            {loading
              ? "جاري تحميل البيانات..."
              : `عرض ${filteredStudents.length} من ${students.length} طالب`}
          </p>

          {(search || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        {/* Error State */}
        {!loading && error && (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
              <CircleExclamation width={27} height={27} />
            </div>

            <h3 className="mt-4 font-semibold">
              تعذر تحميل الطلاب
            </h3>

            <p className="mt-2 text-sm text-default-500">
              {error}
            </p>

            <Button
              className="mt-5"
              variant="primary"
              onPress={loadStudents}
            >
              <ArrowRotateRight width={16} height={16} />
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-4 py-3"
              >
                <div className="size-10 shrink-0 rounded-full bg-default-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 rounded bg-default-100" />
                  <div className="h-3 w-48 max-w-full rounded bg-default-100" />
                </div>
                <div className="hidden h-3 w-20 rounded bg-default-100 sm:block" />
                <div className="hidden h-3 w-16 rounded bg-default-100 md:block" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredStudents.length === 0 && (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-default-100 text-default-400">
              {students.length === 0 ? (
                <Persons width={30} height={30} />
              ) : (
                <Magnifier width={28} height={28} />
              )}
            </div>

            <h3 className="mt-4 font-semibold">
              {students.length === 0
                ? "لا يوجد طلاب حتى الآن"
                : "لم يتم العثور على نتائج"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-default-500">
              {students.length === 0
                ? "سيظهر هنا الطلاب المسجلون في الدورات التعليمية الخاصة بك بمجرد انضمامهم."
                : "جرب تغيير كلمات البحث أو إزالة الفلاتر الحالية."}
            </p>

            {students.length > 0 && (
              <Button
                className="mt-4"
                variant="outline"
                onPress={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                }}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        )}

        {/* Students Table */}
        {!loading && !error && filteredStudents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead>
                <tr className="border-b border-divider bg-default-50/70 text-default-500">
                  <th className="px-5 py-4 font-medium">
                    الطالب
                  </th>

                  <th className="px-5 py-4 font-medium">
                    الدورات التعليمية
                  </th>

                  <th className="px-5 py-4 font-medium">
                    التقدم
                  </th>

                  <th className="px-5 py-4 font-medium">
                    متوسط الدرجات
                  </th>

                  <th className="px-5 py-4 font-medium">
                    الحالة
                  </th>

                  <th className="px-5 py-4 font-medium">
                    تاريخ التسجيل
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-divider">
                {filteredStudents.map((student) => {
                  const config = statusConfig[student.status];

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-default-50/70"
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 shrink-0">
                            <Avatar.Image
                              src={student.image ?? ""}
                              alt={student.name}
                            />
                            <Avatar.Fallback className="bg-primary/10 font-semibold text-primary">
                              {student.name.trim().charAt(0) || "؟"}
                            </Avatar.Fallback>
                          </Avatar>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {student.name}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 text-xs text-default-500">
                              <Envelope
                                width={13}
                                height={13}
                                className="shrink-0"
                              />
                              <span className="truncate" dir="ltr">
                                {student.email}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Courses */}
                      <td className="px-5 py-4">
                        <div className="flex max-w-56 flex-wrap gap-1.5">
                          {student.courses.map((course) => (
                            <span
                              key={course}
                              className="inline-flex items-center gap-1 rounded-md bg-default-100 px-2 py-1 text-xs text-default-600"
                            >
                              <BookOpen
                                width={13}
                                height={13}
                              />
                              {course}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-4">
                        <div className="w-36 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold tabular-nums">
                              {student.progress}%
                            </span>

                            <span className="text-xs text-default-400 tabular-nums">
                              {student.completedLessons}/
                              {student.totalLessons}
                            </span>
                          </div>

                          <div
                            className="h-1.5 overflow-hidden rounded-full bg-default-200"
                            role="progressbar"
                            aria-valuenow={student.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`تقدم ${student.name}`}
                          >
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{
                                width: `${Math.min(100, Math.max(0, student.progress))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Average Score */}
                      <td className="px-5 py-4">
                        <span className="font-semibold tabular-nums">
                          {student.averageScore}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
                        >
                          {config.label}
                        </span>
                      </td>

                      {/* Joined At */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-default-500">
                          <Calendar
                            width={14}
                            height={14}
                          />
                          {formatDate(student.joinedAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer Info */}
      {!loading && !error && students.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-default-400">
          <CircleCheck width={15} height={15} />
          <span>
            يتم عرض الطلاب المسجلين في الدورات التعليمية التابعة لحسابك فقط.
          </span>
        </div>
      )}
    </div>
  );
}
