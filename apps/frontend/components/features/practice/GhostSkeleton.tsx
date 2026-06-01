'use client';

import type { ComponentType, SVGProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { type AlphabetLetter } from '@/lib/userData';
import { cn } from '@/lib/utils';

type GhostSvg = ComponentType<SVGProps<SVGSVGElement>>;

const LETTER_SVGS: Partial<Record<AlphabetLetter, GhostSvg>> = {};

interface GhostSkeletonProps {
  letter: AlphabetLetter;
  visible?: boolean;
  className?: string;
}

function GenericSkeleton({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('h-[70%] w-auto', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <g className="text-white">
        <polyline points="100,160 100,120" />
        <polyline points="100,120 70,110 45,90" />
        <polyline points="100,118 90,80 85,45" />
        <polyline points="100,118 105,70 110,30" />
        <polyline points="100,118 120,72 130,40" />
        <polyline points="100,120 135,90 150,70" />

        <circle cx="100" cy="160" r="4" />
        <circle cx="100" cy="120" r="4" />

        <circle cx="70" cy="110" r="3" />
        <circle cx="45" cy="90" r="3" />

        <circle cx="90" cy="80" r="3" />
        <circle cx="85" cy="45" r="3" />

        <circle cx="105" cy="70" r="3" />
        <circle cx="110" cy="30" r="3" />

        <circle cx="120" cy="72" r="3" />
        <circle cx="130" cy="40" r="3" />

        <circle cx="135" cy="90" r="3" />
        <circle cx="150" cy="70" r="3" />
      </g>
    </svg>
  );
}

export function GhostSkeleton({ letter, visible = true, className }: GhostSkeletonProps) {
  const LetterSvg = LETTER_SVGS[letter];

  if (!visible) return null;

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-60',
        className,
      )}
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={letter}
          className="flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
        >
          {LetterSvg ? (
            <LetterSvg className="h-[60%] w-auto text-white" />
          ) : (
            <div className="relative">
              <GenericSkeleton className="h-[60%] w-auto text-white/80" />
              <div className="mt-8 flex flex-col items-center gap-2">
                <span className="text-mono-label text-[11px] text-white/65">Master Guidance</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
