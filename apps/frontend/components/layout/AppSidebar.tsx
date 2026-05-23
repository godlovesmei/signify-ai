"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Target, History, BookOpen, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  isWorkspaceNavActive,
} from "./mobile-nav/workspaceNavConfig";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ICON_MAP: Record<string, React.ReactNode> = {
  translate: <Camera className="h-[18px] w-[18px]" />,
  practice: <Target className="h-[18px] w-[18px]" />,
  history: <History className="h-[18px] w-[18px]" />,
  reference: <BookOpen className="h-[18px] w-[18px]" />,
};

interface AppSidebarProps {
  pathname: string;
  onSettingsClick: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavContent({
  pathname,
  onSettingsClick,
}: {
  pathname: string;
  onSettingsClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = isWorkspaceNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-white/60 dark:bg-zinc-800/60 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md"
                  : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center transition-colors relative z-10",
                  isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--glow-primary),0.8)]" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {ICON_MAP[item.icon]}
              </span>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-3 space-y-1 mb-2">
        <button
          onClick={onSettingsClick}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
            "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          )}
        >
          <Settings className="h-[18px] w-[18px] text-muted-foreground/70 group-hover:text-foreground transition-colors" />
          <span>Settings</span>
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/40 dark:bg-zinc-800/40 px-3 py-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md transition-all hover:bg-white/60 dark:hover:bg-zinc-800/60 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-[11px] font-bold text-primary-foreground shadow-sm">
            N
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">Nama User</p>
            <p className="truncate text-[10px] text-muted-foreground">
              user@signify.ai
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-50 dark:ring-zinc-950 shadow-sm" />
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar({
  pathname,
  onSettingsClick,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] shrink-0 flex-col bg-transparent pb-2">
        <NavContent pathname={pathname} onSettingsClick={onSettingsClick} />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={(v) => !v && onMobileClose()}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between border-b border-black/5 dark:border-white/10 px-5">
            <span className="text-sm font-semibold tracking-tight">Menu Navigation</span>
            <button
              onClick={onMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavContent pathname={pathname} onSettingsClick={onSettingsClick} />
        </SheetContent>
      </Sheet>
    </>
  );
}