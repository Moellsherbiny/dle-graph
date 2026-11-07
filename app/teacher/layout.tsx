
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProfileStatus } from "@/actions/auth/get-profile-status";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "لوحة المدرس | DLE Graph-AI",
};

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getProfileStatus();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "TEACHER") {
    if (user.role === "STUDENT") {
      redirect("/dashboard");
    }

    redirect("/admin");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
