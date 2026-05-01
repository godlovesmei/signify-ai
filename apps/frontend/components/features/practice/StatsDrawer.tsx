'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type AlphabetLetter, type PracticeStats } from '@/lib/userData';

interface StatsDrawerProps {
  open: boolean;
  stats: PracticeStats;
  weakLetters: AlphabetLetter[];
  target: AlphabetLetter;
  onReset: () => void;
}

export function StatsDrawer({ open, stats, weakLetters, target, onReset }: StatsDrawerProps) {
  const accuracy = stats.totalAttempts === 0
    ? 0
    : Math.round((stats.correctAttempts / stats.totalAttempts) * 100);

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-500 ease-out',
        open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
      )}
    >
      <div className="p-6 space-y-4 border-b border-white/5">
        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">Statistics</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: 'Accuracy', value: `${accuracy}%`, color: undefined },
              { label: 'Total', value: stats.totalAttempts, color: undefined },
              { label: 'Streak', value: stats.currentStreak, color: 'text-warning' as const },
              { label: 'Best', value: stats.bestStreak, color: undefined },
            ]
          ).map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/5 transition-colors">
              <p className="text-[10px] text-muted-foreground/50 mb-1">{label}</p>
              <p className={cn('text-2xl font-bold tabular-nums', color ?? 'text-foreground')}>{value}</p>
            </div>
          ))}
        </div>

        {weakLetters.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">Needs practice</p>
            <div className="flex flex-wrap gap-2">
              {weakLetters.map((letter) => {
                const s = stats.byLetter[letter];
                const pct = s.attempts === 0 ? 0 : Math.round((s.correct / s.attempts) * 100);
                return (
                  <div
                    key={letter}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border',
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

        <Button
          onClick={onReset}
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground/50 hover:text-destructive"
        >
          Reset progress
        </Button>
      </div>
    </div>
  );
}