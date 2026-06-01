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
        'relative h-full w-full overflow-hidden rounded-3xl bg-black',
        'transition-all duration-700 ease-out border',
        !isActive && 'border-white/5 opacity-80',
        isActive && !isDetecting && 'border-white/20 glass-panel',
        isDetecting && !isMatching && 'border-cyan-500/30 glass-panel shadow-[0_0_50px_rgba(6,182,212,0.1)]',
        isMatching && !isSuccess && 'border-emerald-500/50 glass-panel shadow-[0_0_60px_rgba(16,185,129,0.15)]',
        isSuccess && 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_100px_rgba(52,211,153,0.3)]',
        className,
      )}
    >
      {/* Decorative corners for that studio look */}
      <div className="absolute top-6 left-6 size-12 border-t-2 border-l-2 border-white/20 rounded-tl-xl pointer-events-none z-10" />
      <div className="absolute top-6 right-6 size-12 border-t-2 border-r-2 border-white/20 rounded-tr-xl pointer-events-none z-10" />
      <div className="absolute bottom-6 left-6 size-12 border-b-2 border-l-2 border-white/20 rounded-bl-xl pointer-events-none z-10" />
      <div className="absolute bottom-6 right-6 size-12 border-b-2 border-r-2 border-white/20 rounded-br-xl pointer-events-none z-10" />
      
      {children}
    </div>
  );
}