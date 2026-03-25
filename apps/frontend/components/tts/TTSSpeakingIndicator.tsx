'use client';

import { cn } from '@/lib/utils';

export interface TTSSpeakingIndicatorProps {
  /** Controls whether the bars are animating. When false bars render at rest height. */
  active: boolean;
  className?: string;
}

const BARS = [
  { delay: '0ms',    height: 'h-2.5' },
  { delay: '120ms',  height: 'h-4'   },
  { delay: '60ms',   height: 'h-3'   },
  { delay: '180ms',  height: 'h-4'   },
];

export default function TTSSpeakingIndicator({ active, className }: TTSSpeakingIndicatorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex items-end gap-[3px]', className)}
    >
      {BARS.map((bar, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] rounded-full bg-current origin-bottom transition-all duration-150',
            bar.height,
            active && 'animate-tts-wave',
          )}
          style={active ? { animationDelay: bar.delay } : undefined}
        />
      ))}
    </span>
  );
}