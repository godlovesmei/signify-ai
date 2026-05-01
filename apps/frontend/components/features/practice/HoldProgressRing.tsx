'use client';

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

interface HoldProgressRingProps {
  progress: number;
  total: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function HoldProgressRing({ progress, total, size = 'md', className }: HoldProgressRingProps) {
  const pct = Math.min(1, progress / total);
  const isSuccess = pct >= 1;
  const isHolding = pct > 0 && pct < 1;

  const sizes = { sm: 48, md: 64, lg: 80, xl: 96 };
  const dim = sizes[size];
  const r = (dim * 0.7) / 2;
  const circ = 2 * Math.PI * r;

  const progressValue = useMotionValue(pct);
  const strokeColor = useTransform(progressValue, [0, 1], ['#f59e0b', '#10b981']);
  const dotColor = useTransform(progressValue, [0, 1], ['#f59e0b', '#10b981']);
  const dashOffset = useTransform(progressValue, (value) => circ * (1 - value));

  useEffect(() => {
    const controls = animate(progressValue, pct, { duration: 0.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [pct, progressValue]);

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: dim, height: dim }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Hold progress"
      animate={
        isHolding
          ? { scale: [0.98, 1.02, 0.98] }
          : isSuccess
          ? { scale: 1.02 }
          : { scale: 1 }
      }
      transition={
        isHolding
          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.2 }
      }
    >
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ stroke: strokeColor, strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      </div>
    </motion.div>
  );
}