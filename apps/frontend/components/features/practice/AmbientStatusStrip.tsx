'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { type AlphabetLetter } from '@/lib/userData';

type AmbientStatusTone = 'no-hand' | 'hand' | 'processing';

interface AmbientStatusStripProps {
  trail: AlphabetLetter[];
  status: AmbientStatusTone;
  children: ReactNode;
  actions?: ReactNode;
}

const STATUS_CONFIG: Record<AmbientStatusTone, { dot: string; label: string }> = {
  'no-hand': { dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]', label: 'Idle' },
  hand: { dot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', label: 'Tracking' },
  processing: { dot: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]', label: 'Analyzing' },
};

export function AmbientStatusStrip({ trail, status, children, actions }: AmbientStatusStripProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="relative flex h-20 items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-6 backdrop-blur-xl shadow-2xl">
      {/* Left: Status indicator */}
      <div className="flex items-center gap-3">
        <span className={cn('h-3 w-3 rounded-full', config.dot)} aria-hidden="true" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{config.label}</span>
      </div>

      {/* Center: Progress ring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {children}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-4 font-black">
        {actions}
      </div>
    </div>
  );
}

// New: TrailIndicator component (extracted from AmbientStatusStrip)
interface TrailIndicatorProps {
  trail: AlphabetLetter[];
  className?: string;
}

export function TrailIndicator({ trail, className }: TrailIndicatorProps) {
  if (trail.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20">Sequence</span>
      <div className="flex items-center gap-2">
        {trail.map((letter, index) => (
          <span key={`${letter}-${index}`} className="flex items-center gap-2">
            <span
              className={cn(
                "size-10 flex items-center justify-center rounded-xl font-black transition-all duration-500 border",
                index === trail.length - 1
                  ? "bg-white text-black border-white shadow-xl scale-110"
                  : "bg-white/5 text-white/30 border-white/5"
              )}
            >
              {letter}
            </span>
            {index < trail.length - 1 && (
              <span className="text-white/10 font-bold">→</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// New: StatusBadge component (extracted from AmbientStatusStrip)
interface StatusBadgeProps {
  status: AmbientStatusTone;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className={cn("flex items-center gap-3 px-5 py-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-3xl", className)}>
      <span className={cn("w-2 h-2 rounded-full animate-pulse", config.dot)} />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{config.label}</span>
    </div>
  );
}