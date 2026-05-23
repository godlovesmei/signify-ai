"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/55 bg-background/85 px-3 shadow-[0_1px_0_rgba(var(--shadow-color),0.04)] backdrop-blur-xl md:px-4 lg:px-6">
      {/* Left: Mobile menu + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          href="/translate"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/80"
        >
          <Logo size="sm" showWordmark={false} className="shrink-0 drop-shadow-sm" />
          <span className="hidden text-sm font-semibold tracking-tight md:block">
            Signify<span className="text-primary">AI</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
