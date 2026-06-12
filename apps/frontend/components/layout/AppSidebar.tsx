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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  isWorkspaceNavActive,
} from "./mobile-nav/workspaceNavConfig";
import { motion } from "motion/react";
import { Logo } from "@/components/ui/Logo";
import { AutoAvatar } from "@/components/ui/AutoAvatar";

const ICON_MAP: Record<string, ReactNode> = {
  translate: <Camera className="size-4" />,
  practice: <Target className="size-4" />,
  history: <History className="size-4" />,
  reference: <BookOpen className="size-4" />,
};

const SIDEBAR_NAV_ITEMS = WORKSPACE_NAV_ITEMS.filter(
  (item) => item.key !== "profile"
);

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
  user?: SidebarUser | null;
}

const FALLBACK_USER: SidebarUser = {
  name: "User Account",
  email: "account@signify.ai",
};

function UserAvatar({
  user,
  className,
}: {
  user: SidebarUser;
  className?: string;
}) {
  return (
    <AutoAvatar
      name={user.name}
      email={user.email}
      avatarUrl={user.avatarUrl}
      className={cn("rounded-sm text-[10px]", className)}
    />
  );
}

export default function AppSidebar({
  pathname,
  onSettingsClick,
  onLogout,
  user = FALLBACK_USER,
}: AppSidebarProps) {
  const activeUser = user || FALLBACK_USER;
  const profileActive = isWorkspaceNavActive("/profile", pathname);

  const SidebarContent = (
    <div className="flex h-full w-56 flex-col bg-cohere-canvas">
      {/* Brand header */}
      <div className="flex h-12 shrink-0 items-center border-b border-cohere-hairline px-4">
        <Logo href="/translate" size="sm" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Workspace navigation">
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const active = isWorkspaceNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative isolate flex items-center gap-2.5 overflow-hidden rounded-sm px-3 py-2.5 transition-colors duration-200",
                active
                  ? "text-cohere-body-muted dark:text-cohere-body-muted"
                  : "text-cohere-muted hover:bg-cohere-stone hover:text-cohere-ink"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 z-0 rounded-sm border border-cohere-hairline/80 bg-cohere-stone/80 dark:border-white/8 dark:bg-white/[0.07]"
                  transition={APPLE_SPRING}
                />
              )}
              <span
                className={cn(
                  "relative z-10 shrink-0 transition-colors duration-200",
                  active
                    ? "text-cohere-slate dark:text-cohere-body-muted"
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
          type="button"
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
            aria-current={profileActive ? "page" : undefined}
            className={cn(
              "group flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-transparent px-1.5 py-1 transition-colors",
              profileActive &&
                "border-cohere-hairline/80 bg-cohere-stone/80 text-cohere-body-muted dark:border-white/8 dark:bg-white/[0.07] dark:text-cohere-body-muted"
            )}
          >
            <UserAvatar
              user={activeUser}
              className={cn(
                "size-7 shrink-0",
                profileActive && "border-cohere-hairline dark:border-white/12"
              )}
            />
            <div className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "truncate text-xs font-medium leading-tight text-cohere-ink",
                  profileActive && "text-cohere-body-muted"
                )}
              >
                {activeUser.name}
              </span>
              <span
                className={cn(
                  "truncate font-mono text-[10px] lowercase leading-tight text-cohere-muted",
                  profileActive && "text-cohere-slate dark:text-cohere-muted"
                )}
              >
                {activeUser.email.split("@")[0]}
              </span>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Sign out"
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
    <aside
      className="hidden h-full shrink-0 border-r border-cohere-hairline lg:block"
      aria-label="Sidebar"
    >
      {SidebarContent}
    </aside>
  );
}
