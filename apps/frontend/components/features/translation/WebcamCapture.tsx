"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Camera,
  Check,
  FlipHorizontal,
  Hand,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldAlert,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { TranslateDetection } from "@/lib/translateApi";

export type CameraFacingMode = "user" | "environment";

export type CameraState =
  | "idle"
  | "requesting"
  | "loading"
  | "ready"
  | "detecting"
  | "error-permission"
  | "error-device";

export interface WebcamCaptureProps {
  state: CameraState;
  isMirrored: boolean;
  detections: TranslateDetection[];
  showDetectionOverlay?: boolean;
  apiError: boolean;
  hasMultipleCameras: boolean;
  languageLabel: string;
  voiceEnabled: boolean;
  onRequestCamera: () => void;
  onStartDetection: () => void;
  onStopDetection: () => void;
  onFlipCamera: () => void;
  onReset: () => void;
}

export interface WebcamCaptureHandle {
  videoElement: HTMLVideoElement | null;
}

function LiveDot() {
  return (
    <div className="flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground dark:text-white/90">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success/80 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      LIVE
    </div>
  );
}

function LoadingState({ label }: { label?: string }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const raf = () => {
      const p = Math.min(((Date.now() - start) / 2400) * 100, 95);
      setProgress(p);
      if (p < 95) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, []);
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4 px-5 py-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <div>
        <h3 className="mb-1 text-base font-semibold">{label ?? "Initialising"}</h3>
        <p className="text-sm text-muted-foreground/60">Just a moment on first load.</p>
      </div>
      <div className="w-full space-y-1.5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1 w-full overflow-hidden rounded-full bg-muted/70 dark:bg-white/10"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-[11px] text-muted-foreground/40 tabular-nums">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  type,
  onRetry,
}: {
  type: "error-permission" | "error-device";
  onRetry: () => void;
}) {
  const isPermission = type === "error-permission";
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 px-5 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
        <ShieldAlert className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">
          {isPermission ? "Camera Access Denied" : "No Camera Found"}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground/70">
          {isPermission
            ? "Signify needs camera access. Please allow it in your browser settings and try again."
            : "No camera detected. Please connect one and try again."}
        </p>
      </div>
      <Button
        variant="default"
        onClick={onRetry}
        className="h-10 rounded-xl px-6 text-sm font-medium shadow-glow-primary hover:shadow-glow-primary/80"
      >
        <RotateCcw className="mr-2 h-3.5 w-3.5" /> Try Again
      </Button>
    </div>
  );
}

function IdlePrompt({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 px-5 py-4 text-center sm:gap-4 sm:py-5">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Camera className="h-6 w-6 text-primary" />
        <span className="absolute -inset-2 rounded-[20px] border border-primary/10 animate-pulse-ring" />
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold">Start Translating</h3>
        <p className="text-sm leading-relaxed text-muted-foreground/70">
          Position your hands in frame. Signify will detect your BISINDO signs in real time.
        </p>
      </div>
      <ul className="hidden w-full space-y-2 text-left sm:block" aria-label="Tips for best results">
        {[
          "Face a light source for best accuracy",
          "Keep your signing hand clearly visible inside the guide box",
          "Sign at a natural, comfortable pace",
        ].map((tip) => (
          <li
            key={tip}
            className="flex items-center gap-2.5 text-sm leading-relaxed text-muted-foreground/60"
          >
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10"
              aria-hidden="true"
            >
              <Check className="h-2.5 w-2.5 text-primary" />
            </span>
            {tip}
          </li>
        ))}
      </ul>
      <Button
        variant="default"
        onClick={onStart}
        className="h-10 w-full rounded-xl text-sm font-semibold shadow-glow-primary hover:shadow-glow-primary/80"
      >
        <Camera className="h-4 w-4 mr-2" /> Enable Camera
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground/40">
        Camera feed is processed locally and never stored.{" "}
        <Link
          href="/how-it-works"
          className="text-muted-foreground/60 underline underline-offset-2 hover:text-foreground"
        >
          Learn how it works
        </Link>
      </p>
    </div>
  );
}

function OverlayIconBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl glass text-foreground/80 dark:text-white/80 backdrop-blur-md transition-all hover:bg-muted/80 dark:hover:bg-white/15 hover:text-foreground dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

const WebcamCapture = forwardRef<WebcamCaptureHandle, WebcamCaptureProps>(
  (
    {
      state,
      isMirrored,
      detections,
      showDetectionOverlay = true,
      apiError,
      hasMultipleCameras,
      languageLabel,
      voiceEnabled,
      onRequestCamera,
      onStartDetection,
      onStopDetection,
      onFlipCamera,
      onReset,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useImperativeHandle(ref, () => ({
      get videoElement() {
        return videoRef.current;
      },
    }));

    useEffect(() => {
      const handler = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handler);
      return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        sectionRef.current?.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };

    const isLive = state === "ready" || state === "detecting";
    const isActive = state === "detecting";
    const isError = state === "error-permission" || state === "error-device";
    const isLoading = state === "requesting" || state === "loading";

    return (
      <section
        ref={sectionRef}
        aria-label="Camera feed"
        className="relative flex h-full min-h-0 flex-col overflow-hidden bg-card/95 dark:bg-black/60"
        style={{ minHeight: 0 }}
      >
        <video
          ref={videoRef}
          className={[
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out",
            isMirrored ? "-scale-x-100" : "",
            isLive ? "opacity-100" : "opacity-0",
          ].join(" ")}
          autoPlay
          muted
          playsInline
          aria-label="Live camera feed"
        />

        {isLive && showDetectionOverlay && detections.length > 0 && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
            {detections.map((det, index) => {
              const modelSize = 640;
              const x1 = clampPercent((det.box.x1 / modelSize) * 100);
              const y1 = clampPercent((det.box.y1 / modelSize) * 100);
              const x2 = clampPercent((det.box.x2 / modelSize) * 100);
              const y2 = clampPercent((det.box.y2 / modelSize) * 100);

              const left = isMirrored ? 100 - x2 : x1;
              const width = Math.max(0, x2 - x1);
              const height = Math.max(0, y2 - y1);

              return (
                <div
                  key={`${det.class}-${index}`}
                  className="absolute border-2 border-success/80 rounded-sm"
                  style={{
                    left: `${clampPercent(left)}%`,
                    top: `${y1}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                  }}
                >
                  <span className="absolute -top-6 left-0 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-glow-success">
                    {`${det.class} ${(det.confidence * 100).toFixed(0)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {isActive && apiError && (
          <div
            role="alert"
            className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-destructive/90 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            Cannot reach backend — retrying…
          </div>
        )}

        {!isLive && (
          <div
            key={state}
            className="absolute inset-0 flex items-center justify-center overflow-y-auto p-3 animate-fade-up sm:p-6"
          >
            {state === "idle" && <IdlePrompt onStart={onRequestCamera} />}
            {isLoading && (
              <LoadingState
                label={
                  state === "loading" ? "Initialising Camera" : "Requesting Permission"
                }
              />
            )}
            {isError && (
              <ErrorState
                type={state as "error-permission" | "error-device"}
                onRetry={onRequestCamera}
              />
            )}
          </div>
        )}

        {isLive && (
          <div
            role="toolbar"
            aria-label="Camera controls"
            className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 pb-6 pt-14 bg-gradient-to-t from-black/60 via-black/15 to-transparent"
          >
            <OverlayIconBtn onClick={onReset} label="Stop and reset">
              <RotateCcw className="h-4 w-4" />
            </OverlayIconBtn>

            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={isActive ? onStopDetection : onStartDetection}
              aria-label={isActive ? "Stop detection" : "Start detection"}
              aria-pressed={isActive}
              className={[
                "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "ring-1 ring-destructive/40 focus-visible:ring-destructive"
                  : "ring-1 ring-primary/30 focus-visible:ring-primary shadow-glow-primary",
              ].join(" ")}
            >
              {isActive ? (
                <Square className="h-4 w-4 fill-white text-white" />
              ) : (
                <Hand className="h-5 w-5 text-white" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <OverlayIconBtn
                onClick={onFlipCamera}
                disabled={!hasMultipleCameras}
                label="Switch camera"
              >
                <FlipHorizontal className="h-4 w-4" />
              </OverlayIconBtn>
              <OverlayIconBtn
                onClick={handleFullscreen}
                label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </OverlayIconBtn>
            </div>
          </div>
        )}

        {isLive && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[11px] font-semibold text-foreground dark:text-white/85">
            <Hand className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            {languageLabel}
          </div>
        )}

        {isLive && voiceEnabled && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full glass px-2.5 py-1 text-[11px] font-medium text-foreground dark:text-white/85">
            <svg
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            Voice On
          </div>
        )}

        {isActive && (
          <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2">
            <LiveDot />
          </div>
        )}
      </section>
    );
  }
);

WebcamCapture.displayName = "WebcamCapture";
export default WebcamCapture;
