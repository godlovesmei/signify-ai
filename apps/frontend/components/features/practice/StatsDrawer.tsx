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
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 backdrop-blur-sm">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">Statistics</p>
          <span className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-1 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {stats.correctAttempts}/{stats.totalAttempts}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { label: 'Accuracy', value: `${accuracy}%`, color: undefined },
              { label: 'Total', value: stats.totalAttempts, color: undefined },
              { label: 'Streak', value: stats.currentStreak, color: 'text-warning' as const },
              { label: 'Best', value: stats.bestStreak, color: undefined },
            ]
          ).map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 transition-colors hover:bg-white/5"
            >
              <p className="mb-1 text-[10px] leading-none text-muted-foreground/55">{label}</p>
              <p className={cn('text-xl font-bold leading-none tabular-nums', color ?? 'text-foreground')}>{value}</p>
            </div>
          ))}
        </div>

        {weakLetters.length > 0 && (
          <div className="mt-2.5 border-t border-white/5 pt-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Needs practice</p>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {weakLetters.map((letter) => {
                const s = stats.byLetter[letter];
                const pct = s.attempts === 0 ? 0 : Math.round((s.correct / s.attempts) * 100);
                return (
                  <div
                    key={letter}
                    className={cn(
                      'shrink-0 rounded-md border px-2 py-1 text-xs',
                      letter === target
                        ? 'border-primary/30 bg-primary/10 font-bold text-primary'
                        : 'border-white/5 bg-white/[0.02] text-muted-foreground',
                    )}
                  >
                    <span className="font-semibold">{letter}</span> <span>{pct}%</span>
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
