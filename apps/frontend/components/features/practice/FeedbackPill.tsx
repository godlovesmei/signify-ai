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
    idle: { text: `Sign ${targetLetter}`, color: 'bg-cohere-muted' },
    detecting: { text: 'Adjust your hand', color: 'bg-cohere-coral' },
    matching: { text: `Hold ${currentLetter || targetLetter}!`, color: 'bg-cohere-green' },
    success: { text: 'Perfect!', color: 'bg-cohere-green' },
  };

  const { text, color } = config[state];

  return (
    <div
      className={cn(
        'absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3',
        'rounded-[30px] px-5 py-2.5 border transition-colors duration-200',
        isMatching
          ? 'bg-cohere-green border-cohere-green text-white'
          : 'bg-black border-white/20 text-white',
      )}
    >
      <span className={cn('w-2 h-2 rounded-full animate-pulse', color)} />
      <span className="text-sm font-medium whitespace-nowrap">{text}</span>
      {isMatching && (
        <div className="h-1 w-28 overflow-hidden bg-white/20">
          <div
            className="h-full bg-white transition-all duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
