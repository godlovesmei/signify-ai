'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from "@/i18n/navigation";
import Image from 'next/image';
import { motion } from 'motion/react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import {
  ALPHABET_LETTERS,
  createDefaultPracticeStats,
  type PracticeStats,
  getPracticeStats,
} from '@/lib/userData';
import { cn } from '@/lib/utils';

export default function ReferencePageContent() {
  const t = useTranslations('workspace.reference');
  const commonT = useTranslations('common');
  const [stats, setStats] = useState<PracticeStats>(createDefaultPracticeStats);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadStats = useCallback(async ({
    notify = false,
  }: { notify?: boolean } = {}) => {
    setIsLoading(true);
    setLoadError(false);
    try {
      setStats(await getPracticeStats());
    } catch {
      setLoadError(true);
      if (notify) {
        toast.error(t('loadError'), {
          id: 'reference-progress-load-error',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totals = useMemo(() => {
    const totalAttempts = stats.totalAttempts;
    const totalCorrect = stats.correctAttempts;
    const accuracy = totalAttempts === 0 ? 0 : Math.round((totalCorrect / totalAttempts) * 100);
    return { totalAttempts, totalCorrect, accuracy };
  }, [stats]);

  return (
    <div className="h-full overflow-y-auto bg-cohere-canvas text-cohere-ink">
      <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
        <PageHeader
          title={t('title')}
          description={t('description')}
          actions={
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="size-4 animate-spin text-cohere-slate" aria-label={t('loading')} />}
              {loadError && (
                <Button onClick={() => void loadStats({ notify: true })} variant="outline" size="sm">
                  <RefreshCw className="size-4" />
                  {commonT('retry')}
                </Button>
              )}
              <Button asChild>
                <Link href="/practice">{t('practiceNow')}</Link>
              </Button>
            </div>
          }
          className="mb-8"
        />

        <div className="mb-10 grid grid-cols-3 border border-cohere-hairline bg-cohere-canvas">
          {[
            [t('globalAccuracy'), `${totals.accuracy}%`],
            [t('totalAttempts'), totals.totalAttempts],
            [t('verifiedSigns'), totals.totalCorrect],
          ].map(([label, value]) => (
            <div key={label} className="border-r border-cohere-hairline p-4 last:border-r-0 md:p-6">
              <p className="text-mono-label text-[11px] text-cohere-slate">{label}</p>
              <p className="mt-3 text-[32px] leading-none text-cohere-ink tabular-nums">{value}</p>
            </div>
          ))}
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
                className="group overflow-hidden rounded-sm border border-cohere-hairline bg-cohere-canvas transition-colors hover:bg-cohere-stone"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-b-[22px] bg-cohere-stone">
                  <Image
                    src={`/alfabet/${letter}.jpg`}
                    alt={t('letterAlt', { letter })}
                    width={360}
                    height={360}
                    className="size-full object-cover grayscale transition-[filter] duration-300 group-hover:grayscale-0"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-[32px] leading-none">{letter}</h2>
                    <span
                      className={cn(
                        "rounded-[30px] border px-2.5 py-1 text-[12px]",
                        accuracy >= 80
                          ? "border-cohere-green bg-cohere-pale-green text-cohere-green"
                          : "border-cohere-hairline text-cohere-slate"
                      )}
                    >
                      {accuracy}%
                    </span>
                  </div>
                  <div className="mt-4 h-1 w-full bg-cohere-hairline">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${accuracy}%` }}
                      viewport={{ once: true }}
                      className="h-full bg-cohere-primary"
                    />
                  </div>
                  <p className="mt-3 text-[12px] text-cohere-slate">
                    {t('verified', { correct, attempts })}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
