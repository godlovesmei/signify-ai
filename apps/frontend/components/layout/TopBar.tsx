"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between bg-background/85 pl-2 pr-3 backdrop-blur-xl md:pr-4 lg:pr-6">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 pl-2">
        <Link
          href="/translate"
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/80"
        >
          <Logo href={false} size="sm" showWordmark={false} className="shrink-0 drop-shadow-sm" />
          <span className="hidden text-sm font-semibold tracking-tight md:block">
            Signify<span className="text-primary">AI</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
