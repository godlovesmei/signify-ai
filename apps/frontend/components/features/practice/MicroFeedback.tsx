'use client';

import { motion, type MotionValue, useMotionTemplate } from 'motion/react';
import { cn } from '@/lib/utils';

interface MicroFeedbackProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  text: string;
  visible?: boolean;
  className?: string;
}

export function MicroFeedback({ x, y, text, visible = true, className }: MicroFeedbackProps) {
  const left = useMotionTemplate`${x}%`;
  const top = useMotionTemplate`${y}%`;
  const isVisible = visible && text.trim().length > 0;

  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full',
        className,
      )}
      style={{ left, top }}
      initial={false}
      animate={isVisible ? { opacity: 1, y: [0, -4, 0] } : { opacity: 0, y: 6 }}
      transition={{ opacity: { duration: 0.2 }, y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-black/80 px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10">
          {text}
        </div>
        <span className="mt-[-2px] h-2 w-2 rotate-45 bg-black/80 ring-1 ring-white/10" />
      </div>
    </motion.div>
  );
}