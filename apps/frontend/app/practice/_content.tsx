'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import WorkspaceTopNav from '@/components/layout/WorkspaceTopNav';
import MobileBottomNav from '@/components/layout/mobile-nav/MobileBottomNav';
import { Button } from '@/components/ui/button';
import {
  ALPHABET_LETTERS,
  type AlphabetLetter,
  type PracticeStats,
  getPracticeStats,
  recordPracticeAttempt,
  resetPracticeStats,
} from '@/lib/userData';

function randomLetter(): AlphabetLetter {
  return ALPHABET_LETTERS[Math.floor(Math.random() * ALPHABET_LETTERS.length)];
}

function pickAdaptiveLetter(stats: PracticeStats): AlphabetLetter {
  const ranked = [...ALPHABET_LETTERS].sort((a, b) => {
    const aStats = stats.byLetter[a];
    const bStats = stats.byLetter[b];

    if (aStats.attempts === 0 && bStats.attempts > 0) return -1;
    if (bStats.attempts === 0 && aStats.attempts > 0) return 1;

    const aAcc = aStats.attempts === 0 ? 0 : aStats.correct / aStats.attempts;
    const bAcc = bStats.attempts === 0 ? 0 : bStats.correct / bStats.attempts;
    if (aAcc !== bAcc) return aAcc - bAcc;

    return aStats.attempts - bStats.attempts;
  });

  const pool = ranked.slice(0, 6);
  return pool[Math.floor(Math.random() * pool.length)] ?? randomLetter();
}

export default function PracticePageContent() {
  const [stats, setStats] = useState<PracticeStats>(() => getPracticeStats());
  const [target, setTarget] = useState<AlphabetLetter>(() => pickAdaptiveLetter(getPracticeStats()));
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);

  const accuracy = useMemo(() => {
    if (stats.totalAttempts === 0) return 0;
    return Math.round((stats.correctAttempts / stats.totalAttempts) * 100);
  }, [stats]);

  function submitAttempt(correct: boolean) {
    const next = recordPracticeAttempt(target, correct);
    setStats(next);
    setLastResult(correct ? 'correct' : 'incorrect');
    setTarget(pickAdaptiveLetter(next));
  }

  function handleResetProgress() {
    const next = resetPracticeStats();
    setStats(next);
    setTarget(randomLetter());
    setLastResult(null);
  }

  const weakLetters = useMemo(() => {
    return [...ALPHABET_LETTERS]
      .sort((a, b) => {
        const aStats = stats.byLetter[a];
        const bStats = stats.byLetter[b];
        const aAcc = aStats.attempts === 0 ? 0 : aStats.correct / aStats.attempts;
        const bAcc = bStats.attempts === 0 ? 0 : bStats.correct / bStats.attempts;
        return aAcc - bAcc;
      })
      .slice(0, 5);
  }, [stats]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <WorkspaceTopNav
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/translate">Back to Translate</Link>
          </Button>
        }
      />

      <main className="mx-auto grid w-full max-w-6xl gap-4 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:p-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Current Target</p>
          <h1 className="mt-2 text-4xl font-bold">Letter {target}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tunjukkan isyarat huruf ini, lalu nilai sendiri apakah gerakannya sudah benar.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/alfabet/${target}.jpg`}
              alt={`Referensi isyarat huruf ${target}`}
              className="h-72 w-full object-cover"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button onClick={() => submitAttempt(true)} variant="success" className="h-11">
              I got it right
            </Button>
            <Button onClick={() => submitAttempt(false)} variant="warning" className="h-11">
              Still wrong
            </Button>
            <Button onClick={() => setTarget(randomLetter())} variant="outline" className="h-11">
              Random letter
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            {lastResult === null && <p className="text-muted-foreground">Belum ada attempt pada sesi ini.</p>}
            {lastResult === 'correct' && <p className="text-success">Mantap, lanjut huruf berikutnya.</p>}
            {lastResult === 'incorrect' && <p className="text-warning-foreground">Tidak apa-apa, ulangi lagi pelan-pelan.</p>}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Progress</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-muted-foreground">Accuracy</p>
                <p className="mt-1 text-2xl font-bold">{accuracy}%</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-muted-foreground">Total attempts</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalAttempts}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-muted-foreground">Current streak</p>
                <p className="mt-1 text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <p className="text-muted-foreground">Best streak</p>
                <p className="mt-1 text-2xl font-bold">{stats.bestStreak}</p>
              </div>
            </div>

            <Button onClick={handleResetProgress} variant="ghost" className="mt-4 w-full">
              Reset practice progress
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Letters to improve</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {weakLetters.map((letter) => {
                const letterStats = stats.byLetter[letter];
                const attempts = letterStats.attempts;
                const correct = letterStats.correct;
                const percent = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);
                return (
                  <div key={letter} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                    <span className="font-semibold">{letter}</span>
                    <span className="ml-2 text-muted-foreground">{percent}% ({correct}/{attempts})</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: setelah latihan 5-10 menit, cek halaman Reference untuk progress per huruf.
            </p>
          </div>
        </section>
      </main>
      <MobileBottomNav />
    </div>
  );
}

