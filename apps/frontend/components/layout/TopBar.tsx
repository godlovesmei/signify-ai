"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Menu } from "lucide-react";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-cohere-hairline bg-cohere-canvas px-4 md:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden flex size-9 items-center justify-center -ml-1 rounded-md bg-cohere-stone text-cohere-muted hover:text-cohere-ink transition-colors active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
        )}
        <Link
          href="/translate"
          className="flex items-center gap-2 md:gap-3 transition-opacity hover:opacity-80"
        >
          <Logo href={false} size="sm" showWordmark={false} className="shrink-0" />
          <span className="text-sm font-display font-medium tracking-normal hidden xs:inline text-cohere-ink">
            Signify<span className="text-cohere-slate">AI</span>
          </span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
         <div className="bg-cohere-stone border border-cohere-hairline px-2 md:px-3 py-1 rounded-full text-mono-label !text-[10px] lowercase text-cohere-muted">Studio v3.0</div>
      </div>
    </header>
  );
}
