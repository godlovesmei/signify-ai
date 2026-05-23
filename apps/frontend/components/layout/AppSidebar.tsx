"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
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
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_NAV_ITEMS,
  isWorkspaceNavActive,
} from "./mobile-nav/workspaceNavConfig";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ICON_MAP: Record<string, ReactNode> = {
  translate: <Camera className="h-[18px] w-[18px]" />,
  practice: <Target className="h-[18px] w-[18px]" />,
  history: <History className="h-[18px] w-[18px]" />,
  reference: <BookOpen className="h-[18px] w-[18px]" />,
};

interface AppSidebarProps {
  pathname: string;
  onSettingsClick: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  user?: SidebarUser | null;
}

export interface SidebarUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

const FALLBACK_USER: SidebarUser = {
  name: "Nama User",
  email: "user@signify.ai",
};

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "U";
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
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-700 font-bold text-primary-foreground shadow-sm ring-1 ring-primary/20",
        className
      )}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}

function UserAccountMenu({
  user,
  onSettingsClick,
  onLogout,
  onAfterAction,
}: {
  user: SidebarUser;
  onSettingsClick: () => void;
  onLogout: () => void;
  onAfterAction?: () => void;
}) {
  const itemClassName = cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-popover-foreground outline-none transition-colors",
    "focus:bg-muted hover:bg-muted"
  );
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setRendered(true);
    setOpen(true);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setRendered(false);
      closeTimerRef.current = null;
    }, 170);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!rendered) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, rendered]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-state={open ? "open" : "closed"}
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cn(
          "group mt-2 flex w-full items-center gap-3 rounded-2xl border border-border/65 bg-card/90 px-3 py-2.5 text-left shadow-[0_8px_24px_-20px_rgba(var(--shadow-color),0.45)] backdrop-blur-md transition-all",
          "hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        )}
        aria-label="Open user menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={rendered ? menuId : undefined}
      >
        <UserAvatar user={user} className="size-8 text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {user.email}
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-data-[state=open]:rotate-90"
          aria-hidden="true"
        />
      </button>

      {rendered && (
        <div
          id={menuId}
          role="menu"
          aria-hidden={!open}
          data-state={open ? "open" : "closed"}
          className={cn(
            "account-menu-popover absolute bottom-[calc(100%+0.375rem)] left-0 z-[70] w-[calc(100vw-24px)] max-w-[292px] rounded-2xl border border-border/70 bg-popover/98 p-2 text-popover-foreground shadow-[0_24px_70px_-28px_rgba(var(--shadow-color),0.45),0_8px_22px_-18px_rgba(var(--shadow-color),0.35)] backdrop-blur-xl"
          )}
        >
          <div className="flex items-center gap-3 rounded-xl px-3 py-3">
            <UserAvatar user={user} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-popover-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-border/65" />

          <Link
            href="/profile"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onAfterAction?.();
            }}
            className={itemClassName}
          >
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Profile</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onSettingsClick();
              onAfterAction?.();
            }}
            className={itemClassName}
          >
            <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>Settings</span>
          </button>

          <div className="my-1 h-px bg-border/65" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu();
              onAfterAction?.();
              onLogout();
            }}
            className={cn(
              itemClassName,
              "text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function NavContent({
  pathname,
  onSettingsClick,
  onLogout,
  user,
  onAfterAction,
}: {
  pathname: string;
  onSettingsClick: () => void;
  onLogout: () => void;
  user: SidebarUser;
  onAfterAction?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 py-4 pl-2 pr-3">
        {WORKSPACE_NAV_ITEMS.map((item) => {
          const isActive = isWorkspaceNavActive(item.href, pathname);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onAfterAction}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-card/95 text-foreground shadow-sm ring-1 ring-border/70 backdrop-blur-md"
                  : "text-muted-foreground hover:bg-muted/75 hover:text-foreground"
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
      <div className="mt-auto pb-3 pl-2 pr-3 pt-3">
        <UserAccountMenu
          user={user}
          onSettingsClick={onSettingsClick}
          onLogout={onLogout}
          onAfterAction={onAfterAction}
        />
      </div>
    </div>
  );
}

export default function AppSidebar({
  pathname,
  onSettingsClick,
  onLogout,
  mobileOpen,
  onMobileClose,
  user,
}: AppSidebarProps) {
  const displayUser = user ?? FALLBACK_USER;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-[260px] shrink-0 flex-col bg-transparent pb-2 md:flex">
        <NavContent
          pathname={pathname}
          onSettingsClick={onSettingsClick}
          onLogout={onLogout}
          user={displayUser}
        />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={(v) => !v && onMobileClose()}>
        <SheetContent side="left" className="w-[280px] p-0 border-r border-border/70 bg-background/92 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between border-b border-border/60 px-5">
            <span className="text-sm font-semibold tracking-tight">Menu Navigation</span>
            <button
              onClick={onMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavContent
            pathname={pathname}
            onSettingsClick={onSettingsClick}
            onLogout={onLogout}
            user={displayUser}
            onAfterAction={onMobileClose}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
