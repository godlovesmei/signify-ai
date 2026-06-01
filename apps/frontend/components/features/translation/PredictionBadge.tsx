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

/**
 * Cohere Design Tokens from DESIGN.md
 * Aligns with "Interpretation Ledger" aesthetic: Editorial restraint, 
 * hairline borders, and stark monochromatic surfaces.
 */
const COHERE = {
  colors: {
    canvas: "#ffffff",
    softStone: "#eeece7",
    hairline: "#d9d9dd",
    ink: "#212121",
    muted: "#93939f",
    primary: "#17171c",
  },
  typography: {
    heroDisplay: {
      fontSize: "96px",
      letterSpacing: "-0.02em",
    },
    monoLabel: {
      fontSize: "14px",
      letterSpacing: "0.02em",
    }
  }
} as const;

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
            ? "bg-[#eeece7] border border-dashed border-[#d9d9dd]" // Soft Stone background, dashed hairline
            : "bg-white border border-[#d9d9dd] shadow-none"    // Stark White background, hairline border
        )}
      >
        {isIdle ? (
          <div className="flex items-center gap-2 select-none">
            <span className="h-1 w-1 rounded-full bg-[#212121]/20" aria-hidden="true" />
            <p className="font-mono text-[14px] uppercase tracking-[0.02em] text-[#93939f]">
              System Standby
            </p>
          </div>
        ) : isNoHand ? (
          <div className="flex flex-col items-center gap-2 select-none text-center">
            <span className="text-2xl grayscale opacity-20 mb-1" aria-hidden="true">
              ✋
            </span>
            <p className="font-mono text-[14px] uppercase tracking-[0.02em] text-[#93939f]">
              Awaiting Input
            </p>
          </div>
        ) : (
          <span
            key={letterKey}
            data-prediction-badge
            aria-hidden="true"
            className="font-display leading-none text-[#212121] animate-prediction-pop"
            style={{ 
              fontSize: `${96 * textScale}px`, 
              fontWeight: 400,
              letterSpacing: COHERE.typography.heroDisplay.letterSpacing 
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
            <span className="font-mono text-[14px] uppercase tracking-[0.02em] text-[#93939f]">
              {hasHand ? "Prediction Score" : "Scanning Room"}
            </span>
            {pct > 0 && hasHand && (
              <span className="font-mono text-[14px] text-[#212121] tabular-nums">
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
            className="h-[1px] w-full bg-[#d9d9dd]" 
          >
            <div
              key={letterKey}
              className="h-full bg-[#17171c] transition-[width] duration-500 ease-out"
              style={{ width: `${hasHand ? pct : 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

