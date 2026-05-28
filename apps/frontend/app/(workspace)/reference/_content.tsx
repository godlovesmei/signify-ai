'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ALPHABET_LETTERS,
  type PracticeStats,
  getPracticeStats,
} from '@/lib/userData';

export default function ReferencePageContent() {
  const stats = useMemo<PracticeStats>(() => getPracticeStats(), []);

  const totals = useMemo(() => {
    const totalAttempts = stats.totalAttempts;
    const totalCorrect = stats.correctAttempts;
    const accuracy = totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100);
    return { totalAttempts, totalCorrect, accuracy };
  }, [stats]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent text-foreground">
      <div className="flex-1 w-full h-full min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
          {/* Header & Overall Stats (Non-sticky or compact) */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Kamus Isyarat</h1>
                <p className="text-sm text-muted-foreground mt-1">Review & practice your signs</p>
              </div>
              <Button variant="secondary" size="sm" className="rounded-xl shadow-sm" asChild>
                <Link href="/practice">Practice</Link>
              </Button>
            </div>

            {/* Compact Stats Row */}
            <div className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] backdrop-blur-md">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Accuracy</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{totals.accuracy}%</span>
              </div>
              <div className="w-px h-8 bg-black/5 dark:bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Attempts</span>
                <span className="text-xl font-bold">{totals.totalAttempts}</span>
              </div>
              <div className="w-px h-8 bg-black/5 dark:bg-white/10" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Correct</span>
                <span className="text-xl font-bold">{totals.totalCorrect}</span>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 sm:gap-4">
            {ALPHABET_LETTERS.map((letter) => {
              const letterStats = stats.byLetter[letter];
              const attempts = letterStats.attempts;
              const correct = letterStats.correct;
              const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

              return (
                <article
                  key={letter}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 bg-white/40 dark:bg-zinc-800/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:bg-white/80 dark:hover:bg-zinc-800/80 hover:-translate-y-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/alfabet/${letter}.jpg`}
                    alt={`Referensi isyarat huruf ${letter}`}
                    className="aspect-square w-full flex-none object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 z-10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg sm:text-xl font-bold">{letter}</h2>
                      <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-muted-foreground">{accuracy}%</span>
                    </div>
                    <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
                      <span className="text-foreground">{correct}</span>/{attempts} correct
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}

