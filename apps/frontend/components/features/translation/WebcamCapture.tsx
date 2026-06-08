"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Camera,
  FlipHorizontal,
  Hand,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import type { TranslateDetection } from "@/lib/translateApi";
import { cn } from "@/lib/utils";

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
  apiError: boolean;
  hasMultipleCameras: boolean;
  onRequestCamera: () => void;
  onStartDetection: () => void;
  onStopDetection: () => void;
  onFlipCamera: () => void;
  onReset: () => void;
}

export interface WebcamCaptureHandle {
  videoElement: HTMLVideoElement | null;
}

function TechnicalBadge({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon?: LucideIcon;
  label: string;
  value?: string | number;
  variant?: "default" | "active" | "error";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] sm:gap-2 sm:px-2.5 sm:py-1 sm:text-[11px]",
        variant === "default" &&
          "border-white/10 bg-white/5 text-white/50",
        variant === "active" &&
          "border-white/20 bg-white/10 text-white",
        variant === "error" &&
          "border-cohere-error/20 bg-cohere-error/10 text-cohere-error"
      )}
    >
      {Icon && <Icon className="size-2 sm:size-2.5" />}
      <span>{label}</span>
      {value !== undefined && (
        <span className="ml-0.5 opacity-50 sm:ml-1">{value}</span>
      )}
    </div>
  );
}

const WebcamCapture = forwardRef<WebcamCaptureHandle, WebcamCaptureProps>(
  (
    {
      state,
      isMirrored,
      detections,
      apiError,
      hasMultipleCameras,
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
        aria-label="Kamera penerjemah"
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-white/10 bg-cohere-primary sm:rounded-lg lg:rounded-[22px]"
      >
        {/* Header */}
        <div className="z-20 flex items-center justify-between border-b border-white/10 bg-cohere-primary px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4">
          <div className="flex items-center gap-1.5 text-white/45">
            <span
              className="size-1 rounded-full bg-white/20"
              aria-hidden="true"
            />
            <span className="text-[10px] font-medium sm:text-[11px]">
              Kamera
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghostOnDark"
              size="icon-xs"
              onClick={handleFullscreen}
              className="size-6 sm:size-7"
              aria-label={
                isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="size-3 sm:size-3.5" />
              ) : (
                <Maximize2 className="size-3 sm:size-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative m-0.5 flex-1 overflow-hidden rounded-sm border border-white/10 bg-cohere-primary sm:m-1">
          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              isMirrored ? "-scale-x-100" : "",
              isLive ? "opacity-100" : "opacity-0"
            )}
            autoPlay
            muted
            playsInline
          />

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0"
              >
                <div className="absolute left-3 top-3 size-3 border-l border-t border-white/20 sm:left-4 sm:top-4 sm:size-4" />
                <div className="absolute bottom-3 right-3 size-3 border-b border-r border-white/20 sm:bottom-4 sm:right-4 sm:size-4" />

                {detections.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute left-3 top-6 sm:left-6 sm:top-8"
                  >
                    <TechnicalBadge
                      icon={Hand}
                      label="Gerakan terdeteksi"
                      variant="active"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 sm:bottom-6"
              >
                <div className="flex items-center gap-2 rounded-sm bg-cohere-error px-3 py-2 text-[11px] font-medium text-cohere-canvas sm:gap-3 sm:px-4 sm:py-2.5 sm:text-xs">
                  <ShieldAlert className="size-3 sm:size-3.5" />
                  Koneksi terputus
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(!isLive || isLoading || isError) && (
              <motion.div
                key={state}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-cohere-primary"
              >
                {state === "idle" && (
                  <div className="flex max-w-xs flex-col items-center gap-4 px-6 text-center sm:max-w-sm sm:gap-6 sm:px-8">
                    <div className="flex size-14 items-center justify-center rounded-sm border border-white/15 sm:size-16 md:size-20">
                      <Camera className="size-6 text-white/20 sm:size-7 md:size-8" />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <h3 className="text-sm font-medium text-white sm:text-base">
                        Mulai kamera
                      </h3>
                      <p className="text-xs leading-relaxed text-white/45 sm:text-sm">
                        Izinkan akses kamera untuk mulai menerjemahkan BISINDO.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={onRequestCamera}
                      variant="onDark"
                      size="sm"
                    >
                      Aktifkan kamera
                    </Button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center gap-4 sm:gap-6">
                    <Loader2 className="size-6 animate-spin text-white/10 sm:size-8" />
                    <span className="text-[11px] text-white/45 sm:text-xs">
                      Menyiapkan kamera
                    </span>
                  </div>
                )}

                {isError && (
                  <div className="flex flex-col items-center gap-6 px-6 text-center sm:gap-8 sm:px-10">
                    <div className="flex size-16 items-center justify-center rounded-full border border-cohere-error/10 bg-cohere-error/5 sm:size-20">
                      <ShieldAlert className="size-6 text-cohere-error sm:size-8" />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-sm font-medium text-white sm:text-base">
                        {state === "error-permission"
                          ? "Izin kamera ditolak"
                          : "Kamera tidak ditemukan"}
                      </h3>
                      <p className="text-xs leading-relaxed text-white/30 sm:text-[13px]">
                        {state === "error-permission"
                          ? "Beri izin kamera dari browser, lalu coba lagi."
                          : "Pastikan kamera terhubung dan tidak sedang dipakai aplikasi lain."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={onRequestCamera}
                      variant="outlineOnDark"
                      size="sm"
                    >
                      Coba lagi
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls Footer */}
        {isLive && !isLoading && (
          <div className="z-40 bg-cohere-primary px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4">
            <div className="flex items-center gap-2 sm:gap-2.5">
              {!isActive ? (
                <Button
                  type="button"
                  onClick={onStartDetection}
                  variant="onDark"
                  size="sm"
                  className="min-h-10 flex-1 py-2 text-[13px] sm:min-h-11 sm:py-2.5"
                >
                  Mulai terjemah
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onStopDetection}
                  variant="outlineOnDark"
                  size="sm"
                  className="min-h-10 flex-1 py-2 text-[13px] sm:min-h-11 sm:py-2.5"
                >
                  Jeda terjemah
                </Button>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2">
                <ControlIconBtn onClick={onReset} label="Mulai ulang">
                  <RotateCcw className="size-3.5 sm:size-4" />
                </ControlIconBtn>
                <ControlIconBtn
                  onClick={onFlipCamera}
                  label="Ganti kamera"
                  disabled={!hasMultipleCameras}
                >
                  <FlipHorizontal className="size-3.5 sm:size-4" />
                </ControlIconBtn>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }
);

WebcamCapture.displayName = "WebcamCapture";

function ControlIconBtn({
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
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      variant="ghostOnDark"
      size="icon-xs"
      className="size-9 border border-white/15 sm:size-10"
    >
      {children}
    </Button>
  );
}

export default WebcamCapture;
