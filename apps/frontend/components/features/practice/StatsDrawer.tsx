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
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl shadow-2xl glass-panel">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Analytics Engine</p>
          <div className="flex h-2 w-32 overflow-hidden rounded-full bg-white/5">
             <div 
               className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" 
               style={{ width: `${accuracy}%` }}
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: 'Precision', value: `${accuracy}%`, color: 'text-emerald-400' as const },
              { label: 'Samples', value: stats.totalAttempts, color: undefined },
              { label: 'Momentum', value: stats.currentStreak, color: 'text-amber-400' as const },
              { label: 'Record', value: stats.bestStreak, color: undefined },
            ]
          ).map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-white/5 bg-black/40 p-4 transition-all hover:scale-105 hover:bg-white/10"
            >
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
              <p className={cn('text-2xl font-black tabular-nums tracking-tighter', color ?? 'text-white')}>{value}</p>
            </div>
          ))}
        </div>

        {weakLetters.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-white/20">Optimization Queue</p>
            <div className="flex flex-wrap gap-2">
              {weakLetters.map((letter) => {
                const s = stats.byLetter[letter];
                const pct = s.attempts === 0 ? 0 : Math.round((s.correct / s.attempts) * 100);
                return (
                  <div
                    key={letter}
                    className={cn(
                      'px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all',
                      letter === target
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/5 bg-white/[0.03] text-white/40',
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
