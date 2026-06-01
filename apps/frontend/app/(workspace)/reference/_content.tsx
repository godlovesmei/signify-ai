'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ALPHABET_LETTERS,
  type PracticeStats,
  getPracticeStats,
} from '@/lib/userData';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

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
      <div className="flex-1 w-full h-full min-h-0 overflow-y-auto custom-scrollbar scroll-smooth">
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
          {/* Header & Overall Stats */}
          <div className="mb-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                  Studio<span className="opacity-20 ml-2">Reference</span>
                </h1>
                <p className="text-xs md:text-sm font-bold tracking-widest text-muted-foreground/40 uppercase">Review & Practice your sign accuracy</p>
              </div>
              <Button className="rounded-2xl px-6 py-6 font-bold shadow-xl shadow-primary/10 transition-all hover:-translate-y-1 active:scale-95" asChild>
                <Link href="/practice">Practice Now</Link>
              </Button>
            </div>

            {/* Premium Stats Row */}
            <div className="grid grid-cols-3 gap-1 rounded-[2.5rem] border border-white/5 bg-white/5 dark:bg-card/30 p-1.5 shadow-2xl backdrop-blur-3xl">
              <div className="flex flex-col items-center justify-center py-4 rounded-[2rem] bg-white/5 dark:bg-white/5">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Global Accuracy</span>
                <span className="text-xl md:text-2xl font-black text-emerald-500 tabular-nums">{totals.accuracy}%</span>
              </div>
              <div className="flex flex-col items-center justify-center py-4 rounded-[2rem]">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Total Attempts</span>
                <span className="text-xl md:text-2xl font-black tabular-nums">{totals.totalAttempts}</span>
              </div>
              <div className="flex flex-col items-center justify-center py-4 rounded-[2rem]">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Verified Signs</span>
                <span className="text-xl md:text-2xl font-black text-primary tabular-nums">{totals.totalCorrect}</span>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {ALPHABET_LETTERS.map((letter) => {
              const letterStats = stats.byLetter[letter];
              const attempts = letterStats.attempts;
              const correct = letterStats.correct;
              const accuracy = attempts === 0 ? 0 : Math.round((correct / attempts) * 100);

              return (
                <article
                  key={letter}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-card/40 shadow-sm transition-all duration-500 hover:shadow-2xl hover:bg-card/60 hover:-translate-y-1"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    <img
                      src={`/alfabet/${letter}.jpg`}
                      alt={`Reference for letter ${letter}`}
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex flex-col p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-black tracking-tighter">{letter}</h2>
                      <div className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        accuracy >= 80 ? "bg-emerald-500/10 text-emerald-500" : "bg-foreground/5 text-muted-foreground"
                      )}>
                        {accuracy}%
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                       <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${accuracy}%` }}
                            className="h-full bg-foreground/20 rounded-full"
                          />
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                         {correct} / {attempts} Verified
                       </p>
                    </div>
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

