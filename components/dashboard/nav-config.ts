import {
  House,
  BookOpen,
  ChartColumn,
  Person,
  Gear,
  Persons,
  Comment,
} from "@gravity-ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof House;
  description?: string;
}

export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

/* =========================================
   Student
========================================= */

export const studentMainNavItems: NavItem[] = [
  {
    label: "لوحة التحكم",
    href: "/dashboard",
    icon: House,
    description: "نظرة عامة على نشاطك وتقدمك",
  },
  {
    label: "الدروس",
    href: "/dashboard/lessons",
    icon: BookOpen,
    description: "الوصول إلى الدروس ومتابعة مسار التعلم",
  },
  {
    label: "تقدمي",
    href: "/dashboard/progress",
    icon: ChartColumn,
    description: "متابعة تقدمك ونتائجك التعليمية",
  },
];

/* =========================================
   Teacher
========================================= */

export const teacherMainNavItems: NavItem[] = [
  {
    label: "لوحة التحكم",
    href: "/teacher",
    icon: House,
    description: "نظرة عامة على المقرر وأداء الطلاب",
  },
  {
    label: "الدروس",
    href: "/teacher/lessons",
    icon: BookOpen,
    description: "إدارة محتوى الدروس",
  },
  {
    label: "الطلاب",
    href: "/teacher/students",
    icon: Persons,
    description: "متابعة الطلاب المسجلين وأدائهم",
  },
  {
    label: "التقدم والنتائج",
    href: "/teacher/progress",
    icon: ChartColumn,
    description: "تحليل تقدم الطلاب ونتائجهم",
  },
];
/* =========================================
   Communication
========================================= */

export const communicationNavItems: NavItem[] = [
  {
    label: "التواصل",
    href: "/dashboard/communication",
    icon: Persons,
    description: "التواصل والتعاون مع الطلاب والمعلمين",
  },
  {
    label: "الرسائل",
    href: "/dashboard/messages",
    icon: Comment,
    description: "عرض وإدارة جميع محادثاتك",
  },
];

/* =========================================
   Shared Account
========================================= */

export const accountNavItems: NavItem[] = [
  {
    label: "الملف الشخصي",
    href: "/dashboard/profile",
    icon: Person,
    description: "عرض وتعديل بياناتك الشخصية",
  },
  {
    label: "الإعدادات",
    href: "/dashboard/settings",
    icon: Gear,
    description: "إدارة تفضيلات التطبيق والحساب",
  },
];

/* =========================================
   Navigation by role
========================================= */

export function getNavItems(role: UserRole) {
  switch (role) {
    case "TEACHER":
      return {
        main: teacherMainNavItems,
        communication: communicationNavItems,
        account: accountNavItems,
      };

    case "ADMIN":
      return {
        main: teacherMainNavItems,
        communication: communicationNavItems,
        account: accountNavItems,
      };

    case "STUDENT":
    default:
      return {
        main: studentMainNavItems,
        communication: communicationNavItems,
        account: accountNavItems,
      };
  }
}

/* =========================================
   Page Meta
========================================= */

const allNavItems = [
  ...studentMainNavItems,
  ...teacherMainNavItems,
  ...communicationNavItems,
  ...accountNavItems,
];

export function getPageMeta(
  pathname: string,
): { title: string; description?: string } {
  const sortedByHrefLength = [...allNavItems].sort(
    (a, b) => b.href.length - a.href.length,
  );

  const match = sortedByHrefLength.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`),
  );

  return match
    ? {
        title: match.label,
        description: match.description,
      }
    : {
        title: "لوحة التحكم",
      };
}