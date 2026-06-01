'use client';

import { type AlphabetLetter } from '@/lib/userData';
import { cn } from '@/lib/utils';

interface TargetBlockProps {
  letter: AlphabetLetter;
  className?: string;
}

export function TargetBlock({ letter, className }: TargetBlockProps) {
  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="relative group">
        <span className="text-7xl md:text-8xl font-black text-foreground leading-none tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all group-hover:scale-110">
          {letter}
        </span>
        <div className="absolute -inset-8 bg-white/5 rounded-full blur-2xl -z-10 animate-pulse" />
      </div>
      <div className="w-full">
        <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.03] aspect-[4/3] relative group shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/alfabet/${letter}.jpg`}
            alt={`Reference gesture for ${letter}`}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100 grayscale hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[9px] text-white/70 font-black uppercase tracking-widest">Mastery Guide</div>
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
    <div className={cn("flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.03] glass-panel", className)}>
      <span className="text-5xl font-black text-foreground leading-none tracking-tighter">
        {letter}
      </span>
      <div className="w-20 h-14 rounded-xl overflow-hidden border border-white/10 bg-black relative shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/alfabet/${letter}.jpg`}
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </div>
  );
}