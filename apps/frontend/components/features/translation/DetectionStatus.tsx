'use client';

import { cn } from '@/lib/utils';

export type DetectionStatusState = 'idle' | 'loading' | 'ready' | 'detecting' | 'error';

export interface DetectionStatusProps {
  state: DetectionStatusState;
  /** Frames per second — only shown when state is 'detecting'. */
  fps?: number;
  /** Hide the FPS badge (e.g. on mobile). Default: true */
  showFps?: boolean;
}

const DOT_CLASSES: Record<DetectionStatusState, string> = {
  idle:      'bg-neutral-400',
  loading:   'bg-warning-500',
  ready:     'bg-primary',
  detecting: 'bg-primary',
  error:     'bg-error-500',
};

const STATE_LABELS: Record<DetectionStatusState, string> = {
  idle:      'Idle',
  loading:   'Warming up',
  ready:     'Ready',
  detecting: 'Active',
  error:     'Error',
};

export default function DetectionStatus({
  state,
  fps,
  showFps = true,
}: DetectionStatusProps) {
  const isDetecting = state === 'detecting';
  const isLoading   = state === 'loading';
  const dotClass    = DOT_CLASSES[state];

  return (
    <div
      role="status"
      aria-label={`Detection status: ${STATE_LABELS[state]}`}
      className="flex items-center gap-3"
    >
      {/* Status dot */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {(isDetecting || isLoading) && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                dotClass,
              )}
            />
          )}
          <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', dotClass)} />
        </span>

        <span className="text-xs font-medium text-muted-foreground">
          {STATE_LABELS[state]}
        </span>
      </div>

      {/* FPS counter — info-500 badge, font-mono, data-fps-counter for base layer targeting */}
      {showFps && isDetecting && fps !== undefined && (
        <span
          data-fps-counter
          aria-label={`${fps} frames per second`}
          className="rounded-md bg-info px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-info-foreground"
        >
          {fps} FPS
        </span>
      )}
    </div>
  );
}