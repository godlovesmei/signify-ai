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
  'no-hand': { dot: 'bg-cohere-muted', label: 'Idle' },
  hand: { dot: 'bg-cohere-green', label: 'Tracking' },
  processing: { dot: 'bg-cohere-blue', label: 'Analyzing' },
};

export function AmbientStatusStrip({ trail, status, children, actions }: AmbientStatusStripProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className="relative flex h-20 items-center justify-between rounded-sm border border-cohere-hairline bg-cohere-canvas px-6"
      aria-label={`Practice status ${config.label}. Sequence ${trail.join(", ") || "empty"}.`}
    >
      {/* Left: Status indicator */}
      <div className="flex items-center gap-3">
        <span className={cn('h-3 w-3 rounded-full', config.dot)} aria-hidden="true" />
        <span className="text-mono-label text-[11px] text-cohere-slate">{config.label}</span>
      </div>

      {/* Center: Progress ring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {children}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-4 font-medium">
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
      <span className="text-mono-label text-[11px] text-cohere-slate">Sequence</span>
      <div className="flex items-center gap-2">
        {trail.map((letter, index) => (
          <span key={`${letter}-${index}`} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-sm border text-[14px] transition-colors duration-200",
                index === trail.length - 1
                  ? "border-cohere-ink bg-cohere-ink text-cohere-canvas"
                  : "bg-cohere-stone text-cohere-slate border-cohere-hairline"
              )}
            >
              {letter}
            </span>
            {index < trail.length - 1 && (
              <span className="text-cohere-slate">/</span>
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
    <div className={cn("flex items-center gap-3 rounded-[30px] border border-cohere-hairline bg-cohere-canvas px-4 py-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", config.dot)} />
      <span className="text-mono-label text-[11px] text-cohere-ink">{config.label}</span>
    </div>
  );
}
