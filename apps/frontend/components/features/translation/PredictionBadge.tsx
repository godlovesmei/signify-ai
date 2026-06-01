"use client";

import { cn } from "@/lib/utils";

export type ConfidenceTier = "idle" | "low" | "medium" | "high";

export interface PredictionBadgeProps {
  letter: string | null;
  confidence: number | null;
  isDetecting: boolean;
  hasHand: boolean;
  textScale?: number;
}

const HERO_LETTER_SPACING = "0";

export default function PredictionBadge({
  letter,
  confidence,
  isDetecting,
  hasHand,
  textScale = 1,
}: PredictionBadgeProps) {
  const isNoHand = isDetecting && !hasHand;
  const isIdle = !isDetecting;
  
  const pct =
    confidence !== null && isDetecting && hasHand
      ? Math.round(confidence * 100)
      : 0;

  const letterKey = letter ?? "__idle__";

  return (
    <div role="region" aria-label="Current sign prediction" className="flex flex-col gap-4">
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {letter ? `Detected sign: ${letter}, ${pct}% confidence` : ""}
      </span>

      {/* Badge card — Editorial Surface */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          "h-40 px-10 rounded-sm overflow-hidden",
          isNoHand || isIdle
            ? "border border-dashed border-cohere-hairline bg-cohere-stone"
            : "border border-cohere-hairline bg-cohere-canvas shadow-none"
        )}
      >
        {isIdle ? (
          <div className="flex items-center gap-2 select-none">
            <span className="h-1 w-1 rounded-full bg-cohere-ink/20" aria-hidden="true" />
            <p className="font-mono text-[14px] uppercase tracking-normal text-cohere-muted">
              Siap
            </p>
          </div>
        ) : isNoHand ? (
          <div className="flex flex-col items-center gap-2 select-none text-center">
            <p className="font-mono text-[14px] uppercase tracking-normal text-cohere-muted">
              Arahkan tangan
            </p>
          </div>
        ) : (
          <span
            key={letterKey}
            data-prediction-badge
            aria-hidden="true"
            className="animate-prediction-pop font-display leading-none text-cohere-ink"
            style={{ 
              fontSize: `${96 * textScale}px`, 
              fontWeight: 400,
              letterSpacing: HERO_LETTER_SPACING
            }}
          >
            {letter ?? "—"}
          </span>
        )}
      </div>

      {/* Confidence Indicator — Clinical Hairline Progress Bar */}
      {isDetecting && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
              <span className="font-mono text-[14px] uppercase tracking-normal text-cohere-muted">
              {hasHand ? "Skor" : "Mencari gerakan"}
            </span>
            {pct > 0 && hasHand && (
              <span className="font-mono text-[14px] tabular-nums text-cohere-ink">
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
            className="h-[1px] w-full bg-cohere-hairline"
          >
            <div
              key={letterKey}
              className="h-full bg-cohere-ink transition-[width] duration-500 ease-out"
              style={{ width: `${hasHand ? pct : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
