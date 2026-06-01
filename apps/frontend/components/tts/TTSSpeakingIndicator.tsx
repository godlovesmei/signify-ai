'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export interface TTSSpeakingIndicatorProps {
  active: boolean;
  className?: string;
}

export default function TTSSpeakingIndicator({ active, className }: TTSSpeakingIndicatorProps) {
  const bars = [0, 1, 2, 3];
  
  return (
    <span
      aria-hidden="true"
      className={cn('flex items-center gap-[3px] h-4', className)}
    >
      {bars.map((i) => (
        <motion.span
          key={i}
          animate={active ? {
            height: [4, 16, 8, 14, 4],
          } : {
            height: 4
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
          className="w-[3px] rounded-full bg-current"
        />
      ))}
    </span>
  );
}
