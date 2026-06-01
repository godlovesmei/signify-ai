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
          ? { scale: [0.95, 1.05, 0.95], rotate: isHolding ? [0, 5, -5, 0] : 0 }
          : isSuccess
          ? { scale: 1.15 }
          : { scale: 1 }
      }
      transition={
        isHolding
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : { type: 'spring', stiffness: 400, damping: 20 }
      }
    >
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${dim} ${dim}`}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#003c33" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#003c33" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          fill="none"
          stroke="#d9d9dd"
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
          style={{ 
            stroke: isSuccess ? '#003c33' : 'url(#ringGradient)', 
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className={cn(
            "rounded-full transition-all duration-300",
            isSuccess ? "h-4 w-4 bg-cohere-green" : "h-2 w-2 bg-cohere-primary"
          )}
        />
      </div>
    </motion.div>
  );
}
