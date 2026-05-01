"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export interface NavUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface NavbarProps {
  user?: NavUser | null;
  onSettingsOpen?: () => void;
  lang?: "EN" | "ID";
  onLangToggle?: () => void;
}

const MODE_TABS = [
  { label: "Letter", href: "/translate?mode=letter" },
  { label: "Word", href: "/translate?mode=word" },
  { label: "Sentence", href: "/translate?mode=sentence" },
  { label: "Practice", href: "/practice" },
] as const;

function UserAvatar({ user }: { user: NavUser }) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      aria-label={`Signed in as ${user.name}`}
      title={user.name}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br from-primary to-primary-700 text-primary-foreground font-display text-xs font-semibold",
        "ring-2 ring-background/80 shadow-sm select-none overflow-hidden"
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
        initials
      )}
    </div>
  );
}

function ModeTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Detection mode"
      className="hidden md:flex items-end gap-0 h-full"
      role="tablist"
    >
      {MODE_TABS.map(({ label, href }) => {
        const isActive =
          label === "Practice"
            ? pathname === "/practice"
            : pathname.startsWith("/translate");

        return (
          <Link
            key={label}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative flex items-center px-4 h-full text-sm transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
              "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-full after:origin-left after:transition-transform after:duration-300",
              isActive
                ? "text-primary font-semibold after:bg-primary after:scale-x-100"
                : "text-muted-foreground/70 font-medium after:bg-primary after:scale-x-0 hover:text-foreground hover:bg-white/5 rounded-t-lg"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Navbar({
  user,
  onSettingsOpen,
  lang = "ID",
  onLangToggle,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "h-14",
        "glass-strong border-b border-white/10",
        "shadow-depth-1"
      )}
    >
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Logo size="sm" />
          <span className="hidden sm:block text-sm font-semibold text-foreground font-display">
            Signify
          </span>
        </div>

        {/* Center: Mode tabs (desktop only) */}
        <ModeTabBar pathname={pathname} />

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLangToggle}
            aria-label={`Switch language — currently ${lang}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 h-9 px-2.5 hover:text-foreground hover:bg-white/5 transition-all duration-200"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            {lang}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsOpen}
            aria-label="Open settings"
            className={cn(
              "size-9 text-muted-foreground/70 hover:text-foreground hover:bg-white/5 transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            <Settings className="size-4" aria-hidden="true" />
          </Button>

          {/* User avatar */}
          {user && (
            <div className="ml-1">
              <UserAvatar user={user} />
            </div>
          )}
        </div>
      </div>

      {/* Mobile mode tabs */}
      {(pathname.startsWith("/translate") || pathname === "/practice") && (
        <nav
          aria-label="Detection mode (mobile)"
          role="tablist"
          className={cn(
            "md:hidden flex w-full border-t border-white/5",
            "glass"
          )}
        >
          {MODE_TABS.map(({ label, href }) => {
            const isActive =
              label === "Practice"
                ? pathname === "/practice"
                : pathname.startsWith("/translate");

            return (
              <Link
                key={label}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex flex-1 items-center justify-center py-2.5 text-xs transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                  "relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full",
                  isActive
                    ? "text-primary font-semibold after:bg-primary"
                    : "text-muted-foreground/60 font-medium after:bg-transparent hover:text-foreground hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}