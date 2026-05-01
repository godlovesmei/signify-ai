'use client';

import { cn } from '@/lib/utils';

type DetectionState = 'idle' | 'detecting' | 'matching' | 'success';

interface FeedbackPillProps {
  state: DetectionState;
  currentLetter: string | null;
  targetLetter: string;
  holdProgress: number;
  holdFramesNeeded: number;
}

export function FeedbackPill({ state, currentLetter, targetLetter, holdProgress, holdFramesNeeded }: FeedbackPillProps) {
  const isMatching = state === 'matching' || state === 'success';
  const progressPct = Math.min(100, Math.round((holdProgress / holdFramesNeeded) * 100));

  const config = {
    idle: { text: `Sign ${targetLetter}`, color: 'bg-slate-500' },
    detecting: { text: 'Adjust your hand', color: 'bg-amber-500' },
    matching: { text: `Hold ${currentLetter || targetLetter}!`, color: 'bg-emerald-400' },
    success: { text: 'Perfect!', color: 'bg-emerald-500' },
  };

  const { text, color } = config[state];

  return (
    <div
      className={cn(
        'absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3',
        'rounded-full px-5 py-2.5 backdrop-blur-md border transition-all duration-200',
        isMatching
          ? 'bg-emerald-500/90 border-emerald-400/30 text-white shadow-lg shadow-emerald-500/20'
          : 'bg-black/60 border-white/[0.08] text-white',
      )}
    >
      <span className={cn('w-2 h-2 rounded-full animate-pulse', color)} />
      <span className="text-sm font-medium whitespace-nowrap">{text}</span>
      {isMatching && (
        <div className="h-2 w-28 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}