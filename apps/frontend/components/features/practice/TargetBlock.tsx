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
      <div>
        <span className="font-display text-[96px] font-normal leading-none text-cohere-ink">
          {letter}
        </span>
      </div>
      <div className="w-full">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-cohere-hairline bg-cohere-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/alfabet/${letter}.jpg`}
            alt={`Reference gesture for ${letter}`}
            className="h-full w-full object-cover grayscale"
          />
          <div className="absolute bottom-3 left-3 rounded-sm bg-cohere-canvas px-2 py-1 text-mono-label text-[10px] text-cohere-slate">Mastery guide</div>
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
    <div className={cn("flex items-center gap-4 rounded-sm border border-cohere-hairline bg-cohere-canvas p-4", className)}>
      <span className="font-display text-[48px] font-normal leading-none text-cohere-ink">
        {letter}
      </span>
      <div className="relative h-14 w-20 overflow-hidden rounded-sm border border-cohere-hairline bg-cohere-stone">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/alfabet/${letter}.jpg`}
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
      </div>
    </div>
  );
}
