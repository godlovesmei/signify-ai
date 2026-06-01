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
        'relative h-full w-full overflow-hidden rounded-[22px] bg-black',
        'border transition-colors duration-300',
        !isActive && 'border-cohere-hairline opacity-90',
        isActive && !isDetecting && 'border-white/25',
        isDetecting && !isMatching && 'border-white/35',
        isMatching && !isSuccess && 'border-cohere-coral',
        isSuccess && 'border-white bg-cohere-green',
        className,
      )}
    >
      <div className="pointer-events-none absolute left-6 top-6 z-10 size-10 border-l border-t border-white/25" />
      <div className="pointer-events-none absolute right-6 top-6 z-10 size-10 border-r border-t border-white/25" />
      <div className="pointer-events-none absolute bottom-6 left-6 z-10 size-10 border-b border-l border-white/25" />
      <div className="pointer-events-none absolute bottom-6 right-6 z-10 size-10 border-b border-r border-white/25" />
      
      {children}
    </div>
  );
}
