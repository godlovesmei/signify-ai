'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import WorkspaceTopNav from '@/components/layout/WorkspaceTopNav';
import MobileBottomNav from '@/components/layout/mobile-nav/MobileBottomNav';
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
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <WorkspaceTopNav
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/practice">Go to Practice</Link>
          </Button>
        }
      />

      <main className="workspace-height min-h-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
          <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6">
            <section className="grid gap-2 sm:grid-cols-3" aria-label="Practice statistics">
              <div className="rounded-xl border border-border bg-card/95 p-3 shadow-depth-1">
                <p className="text-[11px] text-muted-foreground">Total attempts</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{totals.totalAttempts}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/95 p-3 shadow-depth-1">
                <p className="text-[11px] text-muted-foreground">Correct attempts</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{totals.totalCorrect}</p>
              </div>
              <div className="rounded-xl border border-border bg-card/95 p-3 shadow-depth-1">
                <p className="text-[11px] text-muted-foreground">Overall accuracy</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{totals.accuracy}%</p>
              </div>
            </section>
          </div>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {ALPHABET_LETTERS.map((letter) => {
              const letterStats = stats.byLetter[letter];
              const attempts = letterStats.attempts;
              const correct = letterStats.correct;
              const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

              return (
                <article
                  key={letter}
                  className="flex h-56 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/alfabet/${letter}.jpg`}
                    alt={`Referensi isyarat huruf ${letter}`}
                    className="h-36 w-full flex-none object-cover"
                    loading="lazy"
                  />
                  <div className="flex flex-1 flex-col justify-between p-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold">{letter}</h2>
                      <span className="text-xs text-muted-foreground">{accuracy}%</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {correct}/{attempts} correct
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <MobileBottomNav reserveSpace={false} />
    </div>
  );
}

