'use client';

import { cn } from '@/lib/utils';
import { type AlphabetLetter, type PracticeStats } from '@/lib/userData';

interface StatsDrawerProps {
  open: boolean;
  stats: PracticeStats;
  weakLetters: AlphabetLetter[];
  target: AlphabetLetter;
}

export function StatsDrawer({ open, stats, weakLetters, target }: StatsDrawerProps) {
  const accuracy = stats.totalAttempts === 0
    ? 0
    : Math.round((stats.correctAttempts / stats.totalAttempts) * 100);

  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden transition-all duration-300 ease-out',
        open ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0',
      )}
    >
      <div className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-mono-label text-[12px] text-cohere-slate">Analytics Engine</p>
          <div className="flex h-1 w-32 overflow-hidden bg-cohere-hairline">
             <div 
               className="h-full bg-cohere-green transition-all duration-500" 
               style={{ width: `${accuracy}%` }}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: 'Precision', value: `${accuracy}%`, color: 'text-cohere-green' as const },
              { label: 'Samples', value: stats.totalAttempts, color: undefined },
              { label: 'Momentum', value: stats.currentStreak, color: 'text-cohere-coral' as const },
              { label: 'Record', value: stats.bestStreak, color: undefined },
            ]
          ).map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-sm border border-cohere-hairline bg-cohere-stone p-4"
            >
              <p className="mb-2 text-[12px] text-cohere-slate">{label}</p>
              <p className={cn('text-2xl tabular-nums', color ?? 'text-cohere-ink')}>{value}</p>
            </div>
          ))}
        </div>

        {weakLetters.length > 0 && (
          <div className="mt-5 border-t border-cohere-hairline pt-5">
            <p className="mb-3 text-mono-label text-[11px] text-cohere-slate">Optimization Queue</p>
            <div className="flex flex-wrap gap-2">
              {weakLetters.map((letter) => {
                const s = stats.byLetter[letter];
                const pct = s.attempts === 0 ? 0 : Math.round((s.correct / s.attempts) * 100);
                return (
                  <div
                    key={letter}
                    className={cn(
                      'rounded-[30px] border px-3 py-1 text-[12px] uppercase',
                      letter === target
                        ? 'border-cohere-green bg-cohere-pale-green text-cohere-green'
                        : 'border-cohere-hairline bg-cohere-canvas text-cohere-slate',
                    )}
                  >
                   {letter} <span className="ml-1 opacity-40">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
