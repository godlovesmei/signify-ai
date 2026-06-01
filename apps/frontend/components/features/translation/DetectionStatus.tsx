"use client";

import { cn } from "@/lib/utils";

export type DetectionStatusState = "idle" | "loading" | "ready" | "detecting" | "error";

export interface DetectionStatusProps {
  state: DetectionStatusState;
  fps?: number;
  showFps?: boolean;
}

const DOT_COLORS: Record<DetectionStatusState, string> = {
  idle: "bg-[#d9d9dd]", // hairline
  loading: "bg-[#75758a]", // slate
  ready: "bg-[#17171c]", // ink / primary
  detecting: "bg-[#003c33]", // mineral green
  error: "bg-[#b30000]", // error
};

const STATE_LABELS: Record<DetectionStatusState, string> = {
  idle: "Idle",
  loading: "Warming up",
  ready: "Ready",
  detecting: "Active",
  error: "Error",
};

const STATE_HINTS: Record<DetectionStatusState, string> = {
  idle: "Camera idle",
  loading: "Preparing model",
  ready: "Ready to scan",
  detecting: "Scanning hands",
  error: "Needs attention",
};

export default function DetectionStatus({
  state,
  fps,
  showFps = true,
}: DetectionStatusProps) {
  const isDetecting = state === "detecting";
  const isLoading = state === "loading";
  const isWorking = isDetecting || isLoading;
  const dotColorClass = DOT_COLORS[state];

  return (
    <div
      role="status"
      aria-label={`Detection status: ${STATE_LABELS[state]}`}
      className={cn(
        "flex h-10 items-center justify-between gap-4 rounded-md border border-[#d9d9dd] bg-[#eeece7] px-3.5 py-1.5 transition-all duration-300"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex shrink-0 items-center justify-center">
          <span className={cn("h-1.5 w-1.5 rounded-full", dotColorClass)} />
        </div>

        <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <span className="text-[13px] font-medium text-[#212121] leading-tight">
            {STATE_LABELS[state]}
          </span>
          <span className="truncate text-[11px] text-[#616161] leading-tight opacity-80">
            {STATE_HINTS[state]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showFps && isDetecting && fps !== undefined && (
          <span
            data-fps-counter
            aria-label={`${fps} frames per second`}
            className="font-mono text-[11px] tabular-nums text-[#212121] border-l border-[#d9d9dd] pl-3"
          >
            {fps} <span className="text-[9px] uppercase tracking-normal opacity-40">fps</span>
          </span>
        )}

        {isWorking && (
          <div className="flex h-3 items-center" aria-hidden="true">
            <div className="h-full w-[1px] bg-[#003c33]/40 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
