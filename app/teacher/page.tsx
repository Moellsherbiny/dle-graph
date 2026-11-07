
import Link from "next/link";
import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardList,
  Clock,
  ArrowUpRight,
  AlertCircle,
  ChartColumn,
  CircleCheck,
  FileQuestion,
} from "lucide-react";

import { getTeacherDashboardAction } from "@/actions/teacher/get-teacher-dashboard";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

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

export default async function TeacherPage() {
  const result = await getTeacherDashboardAction();

  if (!result.success || !result.data) {
    return (
      <div dir="rtl" className="p-6">
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-6 dark:bg-danger-950/20">
          <div className="flex items-center gap-3 text-danger">
            <AlertCircle size={22} />
            <h2 className="font-semibold">حدث خطأ أثناء تحميل لوحة التحكم</h2>
          </div>

          <p className="mt-2 text-sm text-default-500">
            {result.error || "تعذر تحميل البيانات، حاول مرة أخرى."}
          </p>
        </div>
      </div>
    );
  }

  const { stats, recentActivities, studentsNeedingAttention } = result.data;

  return (
    <main dir="rtl" className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            لوحة تحكم المدرس
          </h1>
          <p className="mt-2 text-sm text-default-500">
            تابع أداء الدورات التعليمية والطلاب والأنشطة التعليمية من مكان واحد.
          </p>
        </div>

        <Link
          href="/teacher/students"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Users size={18} />
          عرض الطلاب
          <ArrowUpRight size={16} />
        </Link>
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">
            نظرة عامة
          </h2>
          <p className="mt-1 text-sm text-default-500">
            ملخص شامل لإحصائياتك التعليمية.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="الدورات التعليمية"
            value={stats.totalCourses}
            description="إجمالي الدورات التعليمية المسندة إليك"
            icon={BookOpen}
          />

          <StatCard
            title="الطلاب"
            value={stats.totalStudents}
            description="عدد الطلاب المسجلين في دورة تعليميةاتك"
            icon={GraduationCap}
          />

          <StatCard
            title="الدروس"
            value={stats.totalLessons}
            description="إجمالي الدروس في دورة تعليميةاتك"
            icon={ChartColumn}
          />

          <StatCard
            title="الاختبارات"
            value={stats.totalExams}
            description="إجمالي الاختبارات المتاحة"
            icon={ClipboardList}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Activities */}
        <div className="rounded-2xl border border-default-200 bg-content1 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-default-200 p-5">
            <div>
              <h2 className="font-bold text-foreground">
                آخر الأنشطة
              </h2>
              <p className="mt-1 text-xs text-default-500">
                أحدث أنشطة الطلاب في الاختبارات.
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock size={20} />
            </div>
          </div>

          {recentActivities.length > 0 ? (
            <div className="divide-y divide-default-200">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-5 transition hover:bg-default-50 dark:hover:bg-default-100/5"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-default-100">
                    {activity.studentImage ? (
                      <img
                        src={activity.studentImage}
                        alt={activity.studentName || "الطالب"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Users size={20} className="text-default-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {activity.studentName || "طالب"}
                    </p>

                    <p className="mt-1 text-xs text-default-500">
                      {activity.activity} — {activity.examTitle}
                    </p>

                    <p className="mt-1 text-xs text-default-400">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>

                  {activity.passed ? (
                    <span className="shrink-0 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success dark:bg-success-950/30">
                      اجتاز
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-warning-50 px-3 py-1.5 text-xs font-medium text-warning dark:bg-warning-950/30">
                      لم يجتز
                    </span>
                  )}

                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {activity.score}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-default-100 text-default-400">
                <FileQuestion size={26} />
              </div>
              <p className="font-semibold text-foreground">
                لا توجد أنشطة حتى الآن
              </p>
              <p className="mt-1 text-sm text-default-500">
                ستظهر أنشطة الطلاب هنا بمجرد بدء استخدام الاختبارات.
              </p>
            </div>
          )}
        </div>

        {/* Students Needing Attention */}
        <div className="rounded-2xl border border-default-200 bg-content1">
          <div className="flex items-center justify-between border-b border-default-200 p-5">
            <div>
              <h2 className="font-bold text-foreground">
                طلاب يحتاجون للمتابعة
              </h2>
              <p className="mt-1 text-xs text-default-500">
                الطلاب الذين تم تحديدهم كطلاب متعثرين.
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-xl bg-warning-50 text-warning dark:bg-warning-950/30">
              <AlertCircle size={20} />
            </div>
          </div>

          {studentsNeedingAttention.length > 0 ? (
            <div className="divide-y divide-default-200">
              {studentsNeedingAttention.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-default-100">
                    {student.image ? (
                      <img
                        src={student.image}
                        alt={student.name || "الطالب"}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Users size={18} className="text-default-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {student.name || "طالب"}
                    </p>
                    <p className="truncate text-xs text-default-400">
                      {student.email}
                    </p>
                    <p className="mt-1 text-xs text-default-500">
                      {student.totalAttempts} محاولة اختبار
                    </p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-bold text-warning">
                      {Math.round(student.averageScore)}%
                    </p>
                    <p className="text-[11px] text-default-400">
                      متوسط الدرجات
                    </p>
                  </div>
                </div>
              ))}

              <div className="p-4">
                <Link
                  href="/teacher/students"
                  className="flex items-center justify-center gap-2 rounded-xl border border-default-200 py-3 text-sm font-semibold text-foreground transition hover:bg-default-100"
                >
                  عرض جميع الطلاب
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-success-50 text-success dark:bg-success-950/30">
                <CircleCheck size={24} />
              </div>
              <p className="font-semibold text-foreground">
                لا يوجد طلاب متعثرون
              </p>
              <p className="mt-1 text-xs text-default-500">
                لا توجد حالات تحتاج إلى متابعة حاليًا.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-foreground">
          الوصول السريع
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/teacher/students"
            className="group flex items-center gap-4 rounded-2xl border border-default-200 bg-content1 p-5 transition hover:border-primary/40 hover:bg-default-50 dark:hover:bg-default-100/5"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                إدارة الطلاب
              </h3>
              <p className="mt-1 text-xs text-default-500">
                عرض الطلاب ومتابعة أدائهم.
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="text-default-400 transition group-hover:text-primary"
            />
          </Link>

          <Link
            href="/teacher/lessons"
            className="group flex items-center gap-4 rounded-2xl border border-default-200 bg-content1 p-5 transition hover:border-primary/40 hover:bg-default-50 dark:hover:bg-default-100/5"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-success/10 text-success">
              <BookOpen size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                إدارة الدروس
              </h3>
              <p className="mt-1 text-xs text-default-500">
                متابعة محتوى الدروس التعليمية.
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="text-default-400 transition group-hover:text-primary"
            />
          </Link>

          <Link
            href="/teacher/progress"
            className="group flex items-center gap-4 rounded-2xl border border-default-200 bg-content1 p-5 transition hover:border-primary/40 hover:bg-default-50 dark:hover:bg-default-100/5"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <ChartColumn size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                تقارير الأداء
              </h3>
              <p className="mt-1 text-xs text-default-500">
                تحليل تقدم الطلاب ونتائجهم.
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="text-default-400 transition group-hover:text-primary"
            />
          </Link>
        </div>
      </section>
    </main>
  );
}
