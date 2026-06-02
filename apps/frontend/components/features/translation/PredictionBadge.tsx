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

  // Responsive font size: mobile 64px, tablet 80px, desktop 96px
  const baseFontSize = typeof window !== "undefined" && window.innerWidth < 640 ? 64 : window.innerWidth < 1024 ? 80 : 96;
  const fontSize = `${baseFontSize * textScale}px`;

  return (
    <div role="region" aria-label="Current sign prediction" className="flex w-full flex-col gap-3 sm:gap-4">
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {letter ? `Detected sign: ${letter}, ${pct}% confidence` : ""}
      </span>

      {/* Badge card */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          "h-28 px-6 rounded-sm overflow-hidden sm:h-32 sm:px-8 md:h-40 md:px-10",
          isNoHand || isIdle
            ? "border border-dashed border-cohere-hairline bg-cohere-stone"
            : "border border-cohere-hairline bg-cohere-canvas shadow-none"
        )}
      >
        {isIdle ? (
          <div className="flex items-center gap-2 select-none">
            <span
              className="h-1 w-1 rounded-full bg-cohere-ink/20"
              aria-hidden="true"
            />
            <p className="font-mono text-xs uppercase tracking-normal text-cohere-muted sm:text-[14px]">
              Siap
            </p>
          </div>
        ) : isNoHand ? (
          <div className="flex flex-col items-center gap-2 select-none text-center">
            <p className="font-mono text-xs uppercase tracking-normal text-cohere-muted sm:text-[14px]">
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
              fontSize: `clamp(48px, 15vw, ${96 * textScale}px)`,
              fontWeight: 400,
              letterSpacing: HERO_LETTER_SPACING,
            }}
          >
            {letter ?? "—"}
          </span>
        )}
      </div>

      {/* Confidence Indicator */}
      {isDetecting && (
        <div className="flex flex-col gap-2 sm:gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-normal text-cohere-muted sm:text-[14px]">
              {hasHand ? "Skor" : "Mencari gerakan"}
            </span>
            {pct > 0 && hasHand && (
              <span className="font-mono text-xs tabular-nums text-cohere-ink sm:text-[14px]">
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