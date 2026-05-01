'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CameraFrameProps {
  isActive: boolean;
  isDetecting: boolean;
  isMatching: boolean;
  isSuccess: boolean;
  className?: string;
  children: ReactNode;
}

export function CameraFrame({
  isActive,
  isDetecting,
  isMatching,
  isSuccess,
  className,
  children,
}: CameraFrameProps) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-2xl bg-slate-900',
        'transition-all duration-300 ease-out',
        !isActive && 'ring-1 ring-white/[0.08] opacity-80',
        isActive && !isDetecting && 'ring-2 ring-primary/20',
        isDetecting && !isMatching && 'ring-2 ring-primary/30',
        isMatching && !isSuccess && 'ring-2 ring-emerald-400/40',
        isSuccess && 'ring-2 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]',
        className,
      )}
    >
      {children}
    </div>
  );
}