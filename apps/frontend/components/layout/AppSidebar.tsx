"use client";

import Link from "next/link";
import {
  type ReactNode,
} from "react";
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

const ICON_MAP: Record<string, ReactNode> = {
  translate: <Camera className="size-[18px]" />,
  practice: <Target className="size-[18px]" />,
  history: <History className="size-[18px]" />,
  reference: <BookOpen className="size-[18px]" />,
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
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function UserAvatar({ user, className }: { user: SidebarUser; className?: string }) {
  return (
    <div className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-cohere-ink text-cohere-canvas font-bold text-xs border border-cohere-hairline",
      className
    )}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
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
    <div className="flex flex-col h-full bg-cohere-canvas border-r border-cohere-hairline w-72">
      {/* Header Space */}
      <div className="h-14 flex items-center px-6 border-b border-cohere-hairline">
         <span className="text-mono-label !text-[10px] text-cohere-muted">Workspace</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const active = isWorkspaceNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group relative flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200",
                active
                  ? "text-cohere-canvas"
                  : "text-cohere-muted hover:bg-cohere-stone hover:text-cohere-ink"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-cohere-ink rounded-md -z-10"
                  transition={APPLE_SPRING}
                />
              )}
              <span className={cn(
                "transition-colors duration-200 relative z-10",
                active ? "text-cohere-canvas" : "text-cohere-muted group-hover:text-cohere-ink"
              )}>
                {ICON_MAP[item.key]}
              </span>
              <span className="text-sm font-medium tracking-normal relative z-10 text-unica-ui">{item.label}</span>
              {active && <ChevronRight className="ml-auto size-4 opacity-50 relative z-10" />}
            </Link>
          );
        })}
      </nav>

      {/* User & Actions */}
      <div className="p-4 mt-auto space-y-2">
        <button
          onClick={onSettingsClick}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-cohere-muted hover:bg-cohere-stone hover:text-cohere-ink transition-colors group"
        >
          <div className="size-9 rounded-md bg-cohere-stone flex items-center justify-center group-hover:bg-cohere-hairline transition-colors border border-cohere-hairline">
            <Settings className="size-[18px]" />
          </div>
          <span className="text-sm font-medium tracking-normal text-unica-ui">Settings</span>
        </button>

        <div className="h-px bg-cohere-hairline mx-2" />

        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",
            pathname.startsWith("/profile") 
              ? "bg-cohere-stone text-cohere-ink" 
              : "text-cohere-muted"
          )}
        >
          <Link href="/profile" onClick={onMobileClose} className="flex items-center gap-3 flex-1 min-w-0">
            <UserAvatar user={activeUser} className="size-10" />
            <div className="flex flex-col min-w-0">
               <span className="text-sm font-medium tracking-normal truncate text-cohere-ink">{activeUser.name}</span>
               <span className="text-[10px] text-cohere-muted truncate lowercase font-mono">{activeUser.email.split('@')[0]}</span>
            </div>
          </Link>
          <button 
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="size-9 rounded-md flex items-center justify-center text-cohere-muted hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
            title="Logout"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose()}>
        <SheetContent side="left" className="p-0 w-80 border-r border-cohere-hairline bg-cohere-canvas">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          {SidebarContent}
          <button
            onClick={onMobileClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-cohere-stone text-cohere-muted hover:text-cohere-ink border border-cohere-hairline"
          >
            <X className="size-5" />
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
