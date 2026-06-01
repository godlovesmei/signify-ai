"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import {
  BookOpen,
  Camera,
  ChevronRight,
  History,
  LogOut,
  Settings,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  isWorkspaceNavActive,
} from "./mobile-nav/workspaceNavConfig";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";

const ICON_MAP: Record<string, ReactNode> = {
  translate: <Camera className="size-4" />,
  practice: <Target className="size-4" />,
  history: <History className="size-4" />,
  reference: <BookOpen className="size-4" />,
};

const APPLE_SPRING = { stiffness: 400, damping: 40 };

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface AppSidebarProps {
  pathname: string;
  onSettingsClick: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  user?: SidebarUser | null;
}

const FALLBACK_USER: SidebarUser = {
  name: "User Account",
  email: "account@signify.ai",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar({
  user,
  className,
}: {
  user: SidebarUser;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-cohere-ink text-cohere-canvas font-bold text-[10px] border border-cohere-hairline",
        className
      )}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="size-full object-cover"
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}

export default function AppSidebar({
  pathname,
  onSettingsClick,
  onLogout,
  mobileOpen,
  onMobileClose,
  user = FALLBACK_USER,
}: AppSidebarProps) {
  const activeUser = user || FALLBACK_USER;

  const SidebarContent = (
    <div className="flex h-full w-56 flex-col bg-cohere-canvas">
      {/* Brand header */}
      <div className="flex h-12 shrink-0 items-center border-b border-cohere-hairline px-4">
        <Logo href="/translate" size="sm" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Workspace navigation">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const active = isWorkspaceNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-sm px-3 py-2.5 transition-colors duration-200",
                active
                  ? "text-white dark:text-cohere-canvas"
                  : "text-cohere-muted hover:bg-cohere-stone hover:text-cohere-ink"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-10 rounded-sm bg-cohere-primary dark:bg-cohere-ink"
                  transition={APPLE_SPRING}
                />
              )}
              <span
                className={cn(
                  "relative z-10 shrink-0 transition-colors duration-200",
                  active
                    ? "text-white dark:text-cohere-canvas"
                    : "text-cohere-muted group-hover:text-cohere-ink"
                )}
              >
                {ICON_MAP[item.key]}
              </span>
              <span className="relative z-10 truncate text-sm font-medium text-unica-ui">
                {item.label}
              </span>
              {active && (
                <ChevronRight className="relative z-10 ml-auto size-3.5 shrink-0 opacity-40" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User and actions */}
      <div className="mt-auto shrink-0 space-y-1 p-3">
        <button
          onClick={onSettingsClick}
          className="group flex w-full items-center gap-2.5 rounded-sm px-3 py-2.5 text-cohere-muted transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
        >
          <Settings className="size-4 shrink-0" />
          <span className="text-sm font-medium text-unica-ui">Settings</span>
        </button>

        <div className="h-px bg-cohere-hairline" />

        <div className="flex items-center gap-2 rounded-sm px-2 py-2">
          <Link
            href="/profile"
            onClick={onMobileClose}
            className="group flex min-w-0 flex-1 items-center gap-2"
          >
            <UserAvatar user={activeUser} className="size-7 shrink-0" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium leading-tight text-cohere-ink">
                {activeUser.name}
              </span>
              <span className="truncate font-mono text-[10px] lowercase leading-tight text-cohere-muted">
                {activeUser.email.split("@")[0]}
              </span>
            </div>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-cohere-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden h-full shrink-0 border-r border-cohere-hairline lg:block"
        aria-label="Sidebar"
      >
        {SidebarContent}
      </aside>

      {/* Mobile and tablet drawer */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 border-r border-cohere-hairline bg-cohere-canvas p-0 shadow-none sm:w-72"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {SidebarContent}
          <button
            onClick={onMobileClose}
            className="absolute right-3 top-3 rounded-sm border border-cohere-hairline bg-cohere-stone p-1.5 text-cohere-muted transition-colors hover:text-cohere-ink"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
