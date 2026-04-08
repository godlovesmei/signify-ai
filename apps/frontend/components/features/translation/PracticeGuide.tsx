'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Grid, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'alphabet' | 'numbers' | 'phrases';

type SignCard = {
  id: string;
  label: string;
  name: string;
  emoji: string;
  description: string;
  fingers: string;
  tip?: string;
  variant?: string;
};

const SIGN_LIBRARY: Record<Category, SignCard[]> = {
  alphabet: [
    {
      id: 'A',
      label: 'A',
      name: 'Letter A',
      emoji: '✊',
      description: 'Make a fist with your thumb resting on the side of your index finger.',
      fingers: 'All fingers curled into the palm; thumb rests against the index finger.',
      tip: 'Keep a tight fist — the thumb should be visible from the front.',
      variant: 'Some signers rest the thumb on top; both are acceptable in BISINDO.',
    },
    {
      id: 'B',
      label: 'B',
      name: 'Letter B',
      emoji: '🖐️',
      description: 'Open palm facing forward, fingers together, thumb across the palm.',
      fingers: 'Keep fingers straight and close; thumb touches the base of the palm.',
      tip: 'Avoid flaring fingers apart; a clean silhouette helps detection.',
    },
    {
      id: 'C',
      label: 'C',
      name: 'Letter C',
      emoji: '🤌',
      description: 'Curve all fingers and thumb to form a “C” shape facing forward.',
      fingers: 'Knuckles rounded; thumb opposite the index to complete the arc.',
      tip: 'Don’t collapse the arc — maintain space inside the “C”.',
    },
  ],
  numbers: [
    {
      id: '1',
      label: '1',
      name: 'Number 1',
      emoji: '☝️',
      description: 'Index finger up, other fingers curled, palm forward.',
      fingers: 'Middle, ring, pinky folded; thumb resting over them.',
      tip: 'Keep the index straight, not angled.',
    },
    {
      id: '2',
      label: '2',
      name: 'Number 2',
      emoji: '✌️',
      description: 'Index and middle up in a V, palm forward.',
      fingers: 'Ring and pinky curled; thumb across them.',
      tip: 'Spread the V slightly for clarity.',
    },
    {
      id: '3',
      label: '3',
      name: 'Number 3',
      emoji: '🤟',
      description: 'Thumb, index, and middle extended; ring and pinky curled.',
      fingers: 'Palm forward; thumb separated from index.',
      tip: 'Avoid making “W” — keep three digits only.',
    },
  ],
  phrases: [
    {
      id: 'HI',
      label: 'Hi',
      name: 'Hi / Halo',
      emoji: '👋',
      description: 'Raise your hand near the temple and wave once.',
      fingers: 'Relaxed open palm.',
      tip: 'A single wave is enough; avoid repeated motion when capturing.',
    },
    {
      id: 'THANKS',
      label: 'Thanks',
      name: 'Terima kasih',
      emoji: '🤲',
      description: 'Fingertips touch chin then move forward slightly.',
      fingers: 'Palm up; fingers together.',
      tip: 'Keep motion smooth and short for detection.',
    },
    {
      id: 'YES',
      label: 'Yes',
      name: 'Ya',
      emoji: '🤜',
      description: 'Make a fist and nod it up and down.',
      fingers: 'Closed fist, wrist hinge motion.',
      tip: 'Small, clear nod — avoid big arm swings.',
    },
  ],
};

const categoryLabels: Record<Category, string> = {
  alphabet: 'Alphabet',
  numbers: 'Numbers',
  phrases: 'Phrases',
};

// Optional image map; populate with real paths e.g. `/charts/letters/A.jpg`
const LETTER_IMAGES: Record<string, string | null> = Object.fromEntries(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => [l, null]),
);

export default function PracticeGuide() {
  const [category, setCategory] = useState<Category>('alphabet');
  const [index, setIndex] = useState(0);
  const [showChart, setShowChart] = useState(false);

  const items = SIGN_LIBRARY[category];
  const active = items[index] ?? items[0];

  const setActive = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setIndex(clamped);
  };

  // Reset index when switching category
  useEffect(() => {
    setIndex(0);
  }, [category]);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      {/* Category tabs */}
      <div className="flex w-full gap-2 overflow-x-auto pb-1">
        {(['alphabet', 'numbers', 'phrases'] as Category[]).map((cat) => {
          const activeCat = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                activeCat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {cat === 'alphabet' && <span aria-hidden>🔤</span>}
              {cat === 'numbers' && <span aria-hidden>🔢</span>}
              {cat === 'phrases' && <span aria-hidden>💬</span>}
              {categoryLabels[cat]}
            </button>
          );
        })}
      </div>

      {/* Ready card */}
      <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Practice guide</p>
            <p className="text-xs text-muted-foreground">Learn the shape before you sign.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowChart(true)}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:text-foreground hover:border-border"
          >
            <Grid className="h-3.5 w-3.5" />
            A–Z Chart
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Ready</p>
            <p className="text-sm font-semibold text-foreground">Follow the steps</p>
          </div>
        </div>
      </div>

      {/* Active card */}
      <div className="grid grid-cols-[auto,1fr] gap-3 rounded-xl border border-border/50 bg-background/60 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl">
          <span aria-hidden>{active.emoji}</span>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
              static
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {categoryLabels[category]}
            </span>
          </div>
          <p className="text-lg font-bold leading-tight">{active.label} — {active.name}</p>
          <p className="text-sm text-muted-foreground">{active.description}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <InfoCard title="Fingers">{active.fingers}</InfoCard>
        {active.tip && (
          <InfoCard title="Tip" tone="tip">
            {active.tip}
          </InfoCard>
        )}
        {active.variant && (
          <InfoCard title="Variant">{active.variant}</InfoCard>
        )}
      </div>

      {/* Navigator */}
      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActive(index - 1)}
            disabled={index === 0}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-border/60 transition disabled:opacity-40 disabled:pointer-events-none',
              'bg-background hover:bg-muted',
            )}
            aria-label="Previous sign"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setActive(index + 1)}
            disabled={index === items.length - 1}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border border-border/60 transition disabled:opacity-40 disabled:pointer-events-none',
              'bg-background hover:bg-muted',
            )}
            aria-label="Next sign"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {index + 1} / {items.length} · Use ← → to step
        </p>
      </div>

      {/* Sign selector */}
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-full flex-wrap gap-2">
          {items.map((item, idx) => {
            const isActive = idx === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(idx)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-foreground hover:border-primary/60 hover:text-primary',
                )}
                aria-label={`Select ${item.name}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <ChartModal open={showChart} onClose={() => setShowChart(false)} />
    </section>
  );
}

/* ── Chart Modal ───────────────────────────────────────────────────────────── */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function ChartModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-border/60 bg-card/95 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Grid className="h-4 w-4 text-primary" />
            <span>ASL Chart</span>
            <span className="rounded-full border border-border/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              A–Z
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Expand"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close chart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {ALPHABET.map((letter) => {
              const src = LETTER_IMAGES[letter];
              return (
                <div
                  key={letter}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/80 p-2 text-center shadow-sm"
                >
                  <div className="relative h-20 w-full overflow-hidden rounded-lg bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={`BISINDO letter ${letter}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">
                        {letter}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{letter}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-border/50 px-4 py-3">
          <button
            type="button"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            onClick={onClose}
          >
            Tutup chart
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
  tone = 'default',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'default' | 'tip';
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        tone === 'tip'
          ? 'border-amber-200/70 bg-amber-50/50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-100'
          : 'border-border/60 bg-background/70 text-foreground',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
        {title}
      </p>
      <p className="leading-relaxed text-sm">{children}</p>
    </div>
  );
}