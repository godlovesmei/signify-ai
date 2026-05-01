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

function getTier(
  confidence: number | null,
  isDetecting: boolean,
  hasHand: boolean
): ConfidenceTier {
  if (!isDetecting || confidence === null || !hasHand) return "idle";
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

const TIER_CONFIG: Record<
  ConfidenceTier,
  {
    card: string;
    text: string;
    bar: string;
    glow?: string;
    label: string;
  }
> = {
  idle: {
    card: "bg-card/90 border border-border/80 dark:border-white/10",
    text: "text-muted-foreground/55",
    bar: "bg-muted/75 dark:bg-white/10",
    label: "—",
  },
  low: {
    card: "bg-error/5 border border-error/20",
    text: "text-error",
    bar: "bg-error",
    glow: "shadow-glow-error/30",
    label: "Low",
  },
  medium: {
    card: "bg-warning/5 border border-warning/20",
    text: "text-warning",
    bar: "bg-warning",
    glow: "shadow-glow-warning/30",
    label: "Medium",
  },
  high: {
    card: "bg-success/5 border border-success/20",
    text: "text-success",
    bar: "bg-success",
    glow: "shadow-glow-success/40",
    label: "High",
  },
};

export default function PredictionBadge({
  letter,
  confidence,
  isDetecting,
  hasHand,
  textScale = 1,
}: PredictionBadgeProps) {
  const tier = getTier(confidence, isDetecting, hasHand);
  const isIdle = tier === "idle";
  const isNoHand = isDetecting && !hasHand;
  const config = TIER_CONFIG[tier];

  const pct =
    confidence !== null && isDetecting && hasHand
      ? Math.round(confidence * 100)
      : 0;

  const fontSize = `${Math.max(1.875, 4 * textScale)}rem`;
  const letterKey = letter ?? "__idle__";

  return (
    <div role="region" aria-label="Current sign prediction" className="flex flex-col gap-3">
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {letter ? `Detected sign: ${letter}, ${config.label} confidence` : ""}
      </span>

      {/* Badge card */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl transition-all duration-300",
          "min-h-[112px] px-4 py-5 sm:min-h-[120px] sm:p-6",
          isNoHand
            ? "border border-dashed border-border/80 dark:border-white/10 bg-muted/55 dark:bg-white/5"
            : config.card,
          config.glow
        )}
      >
        {isIdle && !isDetecting ? (
          <div className="flex items-center gap-2 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" aria-hidden="true" />
            <p className="text-xs text-muted-foreground/55">Start detection to see results</p>
          </div>
        ) : isNoHand ? (
          <div className="flex flex-col items-center gap-2 select-none">
            <span className="text-3xl text-muted-foreground/35" aria-hidden="true">
              ✋
            </span>
            <p className="text-xs text-muted-foreground/55">Show your hand to the camera</p>
          </div>
        ) : (
          <span
            key={letterKey}
            data-prediction-badge
            aria-hidden="true"
            className={cn(
              "font-display font-extrabold leading-none tracking-tight animate-prediction-pop",
              config.text
            )}
            style={{ fontSize }}
          >
            {letter ?? "—"}
          </span>
        )}
      </div>

      {/* Confidence meter */}
      {isDetecting && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-[11px] font-bold uppercase tracking-wide",
                isIdle ? "text-muted-foreground/55" : config.text
              )}
            >
              {config.label}
            </span>
            {pct > 0 && (
              <span className="font-mono text-xs tabular-nums text-muted-foreground/50">
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
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted/65 dark:bg-white/5"
          >
            <div
              key={letterKey}
              className={cn(
                "h-full rounded-full animate-confidence-fill transition-[width] duration-200 ease-out",
                config.bar
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
