"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-transparent px-3 md:px-4 lg:px-6">
      {/* Left: Mobile menu + Logo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 md:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/translate" className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <Logo size="sm" showWordmark={false} className="shrink-0 drop-shadow-sm" />
          <span className="hidden text-sm font-semibold tracking-tight md:block">
            Signify<span className="text-primary">AI</span>
          </span>
        </Link>
      </div>

      {/* Center: Search (desktop) */}
      <div className="hidden md:flex flex-1 justify-center px-8">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 px-3 text-xs text-muted-foreground transition-all duration-300 hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:text-foreground shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md"
        >
          <Search className="h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">Search commands, history, or reference...</span>
          <kbd className="ml-auto hidden rounded-md border border-black/10 dark:border-white/20 bg-background/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-mono font-medium lg:block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-1">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 md:hidden transition-colors"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-slate-50 dark:ring-zinc-950" />
        </button>

        <Link
          href="/profile"
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-[11px] font-bold text-primary-foreground shadow-md ring-1 ring-black/10 dark:ring-white/10 transition-transform hover:scale-105"
          aria-label="Profile"
        >
          <User className="h-4 w-4" />
        </Link>
      </div>

      {/* Search overlay (placeholder) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div className="mx-auto mt-[20vh] w-full max-w-xl px-4">
            <div className="rounded-xl border border-border bg-background p-4 shadow-depth-4">
              <p className="text-sm text-muted-foreground">Command palette coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}