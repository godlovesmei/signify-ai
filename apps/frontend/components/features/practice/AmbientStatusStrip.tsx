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
  'no-hand': { dot: 'bg-rose-400', label: 'No hand detected' },
  hand: { dot: 'bg-emerald-400', label: 'Hand detected' },
  processing: { dot: 'bg-sky-400', label: 'Processing' },
};

export function AmbientStatusStrip({ trail, status, children, actions }: AmbientStatusStripProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="relative flex h-16 items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 backdrop-blur-md text-foreground/70 dark:border-white/10 dark:bg-black/40 dark:text-white/70 md:px-6">
      {/* Left: Status indicator */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={cn('h-2 w-2 rounded-full', config.dot)} aria-hidden="true" />
        <span className="sr-only">{config.label}</span>
      </div>

      {/* Center: Progress ring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {children}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-2">
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
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground/50">Sequence</span>
      <div className="flex items-center gap-1.5">
        {trail.map((letter, index) => (
          <span key={`${letter}-${index}`} className="flex items-center gap-1.5">
            <span
              className={cn(
                "px-2 py-1 rounded-md font-mono text-sm font-semibold transition-colors",
                index === trail.length - 1
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {letter}
            </span>
            {index < trail.length - 1 && (
              <span className="text-muted-foreground/30">→</span>
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
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm", className)}>
      <span className={cn("w-2 h-2 rounded-full animate-pulse", config.dot)} />
      <span className="text-xs font-medium text-white">{config.label}</span>
    </div>
  );
}