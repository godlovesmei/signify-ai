'use client';

import { cn } from '@/lib/utils';

export type ConfidenceTier = 'idle' | 'low' | 'medium' | 'high';

export interface PredictionBadgeProps {
  letter: string | null;
  confidence: number | null;
  isDetecting: boolean;
  hasHand: boolean;
  textScale?: number;
}

function getTier(
  confidence: number | null,
  isDetecting: boolean,
  hasHand: boolean,
): ConfidenceTier {
  if (!isDetecting || confidence === null || !hasHand) return 'idle';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

const CARD_CLASSES: Record<ConfidenceTier, string> = {
  idle:   'bg-muted border border-border',
  low:    'bg-error-100 border-2 border-error-500',
  medium: 'bg-warning-100 border-2 border-warning-500',
  high:   'bg-success-100 border-2 border-success-500',
};

const TEXT_CLASSES: Record<ConfidenceTier, string> = {
  idle:   'text-muted-foreground',
  low:    'text-error-700',
  medium: 'text-warning-700',
  high:   'text-success-700',
};

const BAR_CLASSES: Record<ConfidenceTier, string> = {
  idle:   'bg-border',
  low:    'bg-error-500',
  medium: 'bg-warning-500',
  high:   'bg-success-500',
};

const TIER_LABELS: Record<ConfidenceTier, string> = {
  idle:   '—',
  low:    'Low',
  medium: 'Medium',
  high:   'High',
};

export default function PredictionBadge({
  letter,
  confidence,
  isDetecting,
  hasHand,
  textScale = 1,
}: PredictionBadgeProps) {
  const tier = getTier(confidence, isDetecting, hasHand);
  const isIdle    = tier === 'idle';
  const isNoHand  = isDetecting && !hasHand;

  const pct = confidence !== null && isDetecting && hasHand
    ? Math.round(confidence * 100)
    : 0;

  const fontSize = `${Math.max(1.875, 4 * textScale)}rem`;
  const letterKey = letter ?? '__idle__';

  return (
    <div
      role="region"
      aria-label="Current sign prediction"
      className="flex flex-col gap-3"
    >
      {/* Screen reader live region */}
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {letter ? `Detected sign: ${letter}, ${TIER_LABELS[tier]} confidence` : ''}
      </span>

      {/* ── Badge card ────────────────────────────────────────────────────
          Idle: compact 56px height, muted, no big dash
          No-hand: dashed border, medium height
          Active: full height with letter + glow on high confidence
      ──────────────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-2xl transition-all duration-200',
          // Height: compact when idle, full when active
          isIdle && !isDetecting
            ? 'min-h-[56px] px-4 py-3'
            : 'min-h-[120px] p-6',
          // Border / background
          isNoHand
            ? 'border border-dashed border-border bg-muted'
            : CARD_CLASSES[tier],
          // Glow on high confidence
          tier === 'high' && !isNoHand &&
            'shadow-[0_0_12px_rgba(34,197,102,0.30)] animate-pulse-ring',
        )}
      >
        {isIdle && !isDetecting ? (
          /* Compact idle — no giant dash, just a subtle label */
          <p className="text-xs text-muted-foreground/60 select-none">
            Waiting for detection…
          </p>
        ) : (
          <span
            key={letterKey}
            data-prediction-badge
            aria-hidden="true"
            className={cn(
              'font-display font-extrabold leading-none tracking-tight',
              'animate-prediction-in',
              isNoHand ? 'text-muted-foreground/40' : TEXT_CLASSES[tier],
            )}
            style={{ fontSize }}
          >
            {letter ?? '—'}
          </span>
        )}
      </div>

      {/* ── Confidence meter ──────────────────────────────────────────────
          Hidden when fully idle — no point showing an empty bar before
          detection starts. Visible (even at 0%) once detecting begins.
      ──────────────────────────────────────────────────────────────────── */}
      {isDetecting && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-wide',
                isIdle ? 'text-muted-foreground' : TEXT_CLASSES[tier],
              )}
            >
              {TIER_LABELS[tier]}
            </span>

            {pct > 0 && (
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {pct}%
              </span>
            )}
          </div>

          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Detection confidence: ${pct}%`}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              key={letterKey}
              className={cn(
                'h-full rounded-full animate-confidence-fill transition-[width] duration-200 ease-out',
                BAR_CLASSES[tier],
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}