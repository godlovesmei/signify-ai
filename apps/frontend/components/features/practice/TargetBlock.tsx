'use client';

import { type AlphabetLetter } from '@/lib/userData';
import { cn } from '@/lib/utils';

interface TargetBlockProps {
  letter: AlphabetLetter;
  className?: string;
}

export function TargetBlock({ letter, className }: TargetBlockProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative">
        <span className="text-6xl md:text-7xl font-black text-foreground leading-none drop-shadow-[0_0_30px_rgba(124,58,237,0.2)]">
          {letter}
        </span>
        <div className="absolute -inset-3 bg-primary/5 rounded-full blur-xl -z-10" />
      </div>
      <div className="w-full max-w-[120px]">
        <div className="rounded-lg overflow-hidden border border-white/[0.06] bg-slate-800/50 aspect-[4/3] relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/alfabet/${letter}.jpg`}
            alt={`Reference gesture for ${letter}`}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 text-[9px] text-white/50 font-medium">Ref</div>
        </div>
      </div>
    </div>
  );
}

// New: Compact target for sidebar
interface TargetCompactProps {
  letter: AlphabetLetter;
  className?: string;
}

export function TargetCompact({ letter, className }: TargetCompactProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/30", className)}>
      <span className="text-4xl font-black text-foreground leading-none">
        {letter}
      </span>
      <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/[0.06] bg-slate-800/50 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/alfabet/${letter}.jpg`}
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
      </div>
    </div>
  );
}