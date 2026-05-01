"use client";

import { cn } from "@/lib/utils";

export type DetectionStatusState = "idle" | "loading" | "ready" | "detecting" | "error";

export interface DetectionStatusProps {
  state: DetectionStatusState;
  fps?: number;
  showFps?: boolean;
}

const DOT_CLASSES: Record<DetectionStatusState, string> = {
  idle: "bg-muted-foreground/30",
  loading: "bg-warning",
  ready: "bg-primary",
  detecting: "bg-success",
  error: "bg-destructive",
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
  const dotClass = DOT_CLASSES[state];

  return (
    <div
      role="status"
      aria-label={`Detection status: ${STATE_LABELS[state]}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300",
        isWorking
          ? "border-primary/20 bg-primary/[0.06] shadow-[0_10px_24px_-20px_rgba(var(--glow-primary),0.8)]"
          : "border-border/70 bg-muted/35 dark:border-white/5 dark:bg-white/[0.03]"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70 dark:bg-black/20">
        <span className="relative flex h-3 w-3 shrink-0">
          {isWorking && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                dotClass
              )}
            />
          )}
          <span className={cn("relative inline-flex h-3 w-3 rounded-full", dotClass)} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground/80">
          {STATE_LABELS[state]}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground/55">
          {STATE_HINTS[state]}
        </span>
      </div>

      <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
        {[0, 0.1, 0.2, 0.3].map((delay, index) => (
          <span
            key={delay}
            className={cn(
              "w-1 rounded-full bg-primary/60",
              isWorking ? "animate-wave-bar" : "h-1 bg-muted-foreground/25"
            )}
            style={isWorking ? { animationDelay: `${delay}s` } : { height: `${index + 3}px` }}
          />
        ))}
      </div>

      {showFps && isDetecting && fps !== undefined && (
        <span
          data-fps-counter
          aria-label={`${fps} frames per second`}
          className="rounded-md bg-info/10 border border-info/20 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-info"
        >
          {fps} FPS
        </span>
      )}
    </div>
  );
}
