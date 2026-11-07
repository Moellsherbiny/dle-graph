
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProfileStatus } from "@/actions/auth/get-profile-status";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isProfileComplete } = await getProfileStatus();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "STUDENT" && !isProfileComplete) {
    redirect("/complete-profile");
  }

  if (user.role === "TEACHER") {
    redirect("/teacher");
  }
  return <DashboardShell>{children}</DashboardShell>;
}
