"use client";

import { useEffect } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  Button,
  ScrollShadow,
  Separator,
  Tooltip,
} from "@heroui/react";
import clsx from "clsx";
import {
  ArrowRightFromSquare,
  ChevronLeft,
  Xmark,
} from "@gravity-ui/icons";

import { ThemeSwitch } from "@/components/theme-switch";
import {
  getNavItems,
  type NavItem,
} from "./nav-config";

interface DashboardSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <NextLink
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary/10 text-primary"
          : "text-default-500 hover:bg-default-100 hover:text-foreground",
      )}
    >
      {/* Active indicator */}
      <span
        className={clsx(
          "absolute right-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-all duration-200",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      <Icon width={19} height={19} className="shrink-0" />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </NextLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip >
      <Tooltip.Content>
        <Tooltip.Arrow/>
        {item.label}
      </Tooltip.Content>
      <Tooltip.Trigger>
        <Tooltip.Arrow/>
      {link}
      </Tooltip.Trigger>
    </Tooltip>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      {!collapsed && (
        <p className="mb-2 px-3 text-xs font-medium text-default-400">
          {title}
        </p>
      )}

      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href)}
            collapsed={collapsed}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

export function DashboardSidebar({
  open,
  onOpenChange,
  collapsed,
  onCollapsedChange,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role;
  const userName = session?.user?.name ?? "مستخدم";
  const userInitial = userName.trim().charAt(0) || "؟";

  const nav = getNavItems(
  role === "TEACHER"
    ? "TEACHER"
    : role === "ADMIN"
      ? "ADMIN"
      : "STUDENT",
);

  const handleNavigate = () => {
    onOpenChange(false);
  };

  const handleLogout = () => {
    signOut({
      callbackUrl: "/",
    });
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const sidebarContent = (isRail: boolean) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={clsx(
          "flex h-16 shrink-0 items-center px-5",
          isRail ? "justify-center px-0" : "justify-between",
        )}
      >
        <NextLink
          href="/dashboard"
          onClick={handleNavigate}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
  src="/favicon.ico"
  alt="DLE Graph-AI"
  width={30}
  height={30}
  priority
  className="size-[30px]"
/>

{!isRail && (
  <div className="flex flex-col leading-none">
    <span className="text-base font-bold tracking-tight">
      DLE Graph-AI
    </span>

    <span className="mt-1 text-[9px] font-medium text-default-400">
      بيئة التعلم بالإنفوجرافيك الذكي
    </span>
  </div>
)}
        </NextLink>

        {!isRail && (
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => onOpenChange(false)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-foreground lg:hidden"
          >
            <Xmark width={19} height={19} />
          </button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollShadow
        className="sidebar-scroll flex-1 px-3 py-5"
        size={24}
        offset={4}
      >
        <div className="space-y-5">
          <SidebarSection
            title="الرئيسية"
            items={nav.main}
            pathname={pathname}
            collapsed={isRail}
            onNavigate={handleNavigate}
          />

          {nav.communication.length > 0 && (
            <>
              <Separator />

              <SidebarSection
                title="التواصل"
                items={nav.communication}
                pathname={pathname}
                collapsed={isRail}
                onNavigate={handleNavigate}
              />
            </>
          )}

          <Separator />

          <SidebarSection
            title="الحساب"
            items={nav.account}
            pathname={pathname}
            collapsed={isRail}
            onNavigate={handleNavigate}
          />
        </div>
      </ScrollShadow>

      {/* Footer */}
      <div className="shrink-0 border-t border-divider p-3">
        {/* Profile */}
        <div
          className={clsx(
            "mb-2 flex items-center gap-2.5 rounded-lg px-2 py-2",
            isRail && "justify-center px-0",
          )}
        >
          <Avatar
        
            size="sm"
            className="shrink-0 bg-primary/10 text-primary"
          >
            <Avatar.Image src={session?.user.image ?? ""}/>
            <Avatar.Fallback >
              {userInitial}
              </Avatar.Fallback> 
            </Avatar>
          {!isRail && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="text-xs text-default-400">
                {role === "TEACHER" ? "معلم" : "طالب"}
              </p>
            </div>
          )}
        </div>

        {!isRail && (
          <div className="mb-1 flex items-center justify-between rounded-lg px-2 py-2">
            <span className="text-sm text-default-500">المظهر</span>
            <ThemeSwitch />
          </div>
        )}

        {isRail ? (
          <Tooltip >
            <Tooltip.Content>
              تسجيل الخروج
              <Tooltip.Arrow/>
            </Tooltip.Content>
            <Tooltip.Trigger className="w-full">

            <Button
              isIconOnly
              fullWidth
              variant="danger-soft"
              onPress={handleLogout}
              className="h-10"
            >
              <ArrowRightFromSquare width={19} height={19} />
            </Button>
            </Tooltip.Trigger>

          </Tooltip>
        ) : (
          <Button
            fullWidth
            variant="danger-soft"
            onPress={handleLogout}
            className="h-10 justify-start gap-3 px-3 text-sm font-medium"
          >
            <ArrowRightFromSquare width={19} height={19} />
            <span>تسجيل الخروج</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        dir="rtl"
        className={clsx(
          "fixed inset-y-0 right-0 z-40 hidden border-l border-divider bg-background transition-[width] duration-200 ease-out lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {sidebarContent(collapsed)}

        {/* Collapse toggle */}
        <button
          type="button"
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          onClick={() => onCollapsedChange(!collapsed)}
          className="absolute top-[27px] -left-3 hidden size-6 items-center justify-center rounded-full border border-divider bg-background text-default-500 shadow-sm transition-colors hover:text-foreground lg:flex"
        >
          <ChevronLeft
            width={13}
            height={13}
            className={clsx(
              "transition-transform duration-200",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Mobile sidebar (never collapsed to a rail) */}
      <aside
        dir="rtl"
        aria-hidden={!open}
        className={clsx(
          "fixed inset-y-0 right-0 z-50 w-64 border-l border-divider bg-background shadow-xl transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {sidebarContent(false)}
      </aside>

      <style jsx global>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--heroui-default-300)) transparent;
        }
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background-color: hsl(var(--heroui-default-300));
          border-radius: 9999px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background-color: hsl(var(--heroui-default-400));
        }
      `}</style>
    </>
  );
}