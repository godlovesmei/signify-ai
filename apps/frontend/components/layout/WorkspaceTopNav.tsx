"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import {
  isWorkspaceNavActive,
  WORKSPACE_NAV_ITEMS,
} from "@/components/layout/mobile-nav/workspaceNavConfig";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface WorkspaceTopNavProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showLegacyMobileNav?: boolean;
  onPreferencesClick?: () => void;
}

export default function WorkspaceTopNav({
  title,
  subtitle,
  actions,
  showLegacyMobileNav = false,
  onPreferencesClick,
}: WorkspaceTopNavProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasActions = Boolean(actions);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  function handlePreferencesClick() {
    setProfileOpen(false);
    onPreferencesClick?.();
  }

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border/50 dark:border-white/[0.06] shadow-depth-1">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        {/* ═══════════════════════════════════════════════════════════
            LEFT — Brand & Context
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 min-w-0">
          <Logo
            size="sm"
            className="shrink-0 transition-opacity duration-200 hover:opacity-90"
          />

          {(title || subtitle) && (
            <div className="hidden sm:flex flex-col justify-center pl-3 ml-0.5 border-l border-border/40 dark:border-white/[0.08]">
              {title && (
                <p className="text-[13px] font-display font-semibold leading-none text-foreground/85 truncate max-w-[180px]">
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="text-[11px] font-sans text-muted-foreground/55 leading-none mt-1 truncate max-w-[180px]">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CENTER — Workspace Navigation (Floating Dock)
            ═══════════════════════════════════════════════════════════ */}
        <nav
          aria-label="Workspace navigation"
          className="hidden md:flex items-center"
        >
          <div className="relative flex items-center p-1 rounded-xl bg-muted/30 dark:bg-white/[0.025] border border-border/30 dark:border-white/[0.05] shadow-[inset_0_1px_2px_rgba(var(--shadow-color),0.04)]">
            {WORKSPACE_NAV_ITEMS.map((item) => {
              const isActive = isWorkspaceNavActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-[7px] text-[13px] font-medium rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground/50 hover:text-foreground/70"
                  )}
                >
                  {isActive && (
                    <>
                      {/* Active background pill */}
                      <span className="absolute inset-0 rounded-lg bg-primary/[0.08] dark:bg-primary/[0.11] ring-1 ring-primary/15 dark:ring-primary/25 shadow-[0_0_20px_-6px_rgba(var(--glow-primary),0.18)]" />
                      {/* Top accent line */}
                      <span className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-5 bg-primary/70 rounded-full shadow-[0_0_8px_rgba(var(--glow-primary),0.45)]" />
                    </>
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT — Actions & Profile
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasActions && (
            <>
              <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-muted/30 p-1 shadow-[inset_0_1px_2px_rgba(var(--shadow-color),0.04)] dark:border-white/[0.06] dark:bg-white/[0.02]">
                {actions}
              </div>
              <div className="h-5 w-px bg-border/50 dark:bg-white/10 mx-1 hidden sm:block" />
            </>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={cn(
                "flex items-center gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                profileOpen
                  ? "bg-primary/[0.07] dark:bg-primary/[0.11] ring-1 ring-primary/20 dark:ring-primary/30 shadow-[0_0_20px_-8px_rgba(var(--glow-primary),0.2)]"
                  : "hover:bg-muted/50 dark:hover:bg-white/[0.04]"
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    "h-7.5 w-7.5 rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground",
                    "bg-gradient-to-br from-primary to-primary-600 shadow-[0_0_12px_-4px_rgba(var(--glow-primary),0.35)]"
                  )}
                >
                  N
                </div>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-[2.5px] border-background dark:border-[oklch(12%_0.0081_310.40)]" />
              </div>

              <span className="hidden lg:block text-[13px] font-medium text-foreground/80">
                Nama User
              </span>
              <ChevronDown
                size={13}
                className={cn(
                  "text-muted-foreground/40 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hidden lg:block",
                  profileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Panel */}
            {profileOpen && (
              <div
                className="absolute right-0 mt-2.5 w-60 glass-panel rounded-xl border border-border/50 dark:border-white/[0.08] shadow-depth-4 p-1.5 animate-enter origin-top-right"
                style={{
                  animation: "enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
              >
                {/* User Identity */}
                <div className="px-3 py-2.5 mb-0.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-glow-primary">
                      N
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        Nama User
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                        user@signify.ai
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50 dark:bg-white/[0.08] my-1" />

                {/* Menu Items */}
                <div className="flex flex-col gap-0.5">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground/75 hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.04] rounded-lg transition-colors duration-200 text-left">
                    <User size={14} className="text-muted-foreground/40" />
                    <span>Profile</span>
                  </button>

                  <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground/75 hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.04] rounded-lg transition-colors duration-200 text-left">
                    <Sparkles
                      size={14}
                      className="text-muted-foreground/40"
                    />
                    <span>My Progress</span>
                  </button>

                  {onPreferencesClick && (
                    <button
                      type="button"
                      onClick={handlePreferencesClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground/75 hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/[0.04] rounded-lg transition-colors duration-200 text-left"
                    >
                      <Settings
                        size={14}
                        className="text-muted-foreground/40"
                      />
                      <span>Preferences</span>
                    </button>
                  )}
                </div>

                <div className="h-px bg-border/50 dark:bg-white/[0.08] my-1" />

                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-error/70 hover:text-error hover:bg-error/[0.06] rounded-lg transition-colors duration-200 text-left">
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — Bottom Tab Bar
          ═══════════════════════════════════════════════════════════════ */}
      {showLegacyMobileNav && (
        <nav
          aria-label="Workspace navigation (mobile)"
          className="grid grid-cols-4 border-t border-border/40 dark:border-white/[0.06] md:hidden glass"
        >
          {WORKSPACE_NAV_ITEMS.map((item) => {
            const isActive = isWorkspaceNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium tracking-wide uppercase transition-all duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/40 hover:text-foreground/60"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--glow-primary),0.5)]" />
                )}
                <span className={cn(
                  "relative z-10",
                  isActive && "drop-shadow-[0_0_8px_rgba(var(--glow-primary),0.35)]"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
