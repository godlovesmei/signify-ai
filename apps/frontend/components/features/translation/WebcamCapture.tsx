"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
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
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  fps?: number;
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
  variant = "default" 
}: { 
  icon?: LucideIcon; 
  label: string; 
  value?: string | number;
  variant?: "default" | "active" | "error";
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[11px]",
      variant === "default" && "bg-white/5 border-white/10 text-white/50",
      variant === "active" && "bg-white/10 border-white/20 text-white",
      variant === "error" && "bg-[color-mix(in_srgb,var(--cohere-error)_10%,transparent)] border-[color-mix(in_srgb,var(--cohere-error)_20%,transparent)] text-[var(--cohere-error)]"
    )}>
      {Icon && <Icon className="size-2.5" />}
      <span>{label}</span>
      {value !== undefined && <span className="ml-1 opacity-50">{value}</span>}
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
      fps = 0,
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
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-white/10 bg-cohere-primary"
      >
        <div className="z-20 flex items-center justify-between border-b border-white/10 bg-cohere-primary px-4 py-3 md:px-5">
          <div className="flex items-center gap-2 text-white/45">
            <span className="size-1.5 rounded-full bg-white/20" aria-hidden="true" />
            <span className="text-[12px] font-medium">Kamera</span>
          </div>
          <div className="flex items-center gap-3">
            <TechnicalBadge
              icon={Zap}
              label="Kecepatan"
              value={isActive ? `${fps} FPS` : "0 FPS"}
              variant={isActive ? "active" : "default"}
            />
            <button
              onClick={handleFullscreen}
              className="rounded-sm p-1 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </div>

        <div className="relative m-1 flex-1 overflow-hidden rounded-sm border border-white/10 bg-black">
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
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute top-4 left-4 size-4 border-t border-l border-white/20" />
                <div className="absolute bottom-4 right-4 size-4 border-b border-r border-white/20" />
                
                {detections.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-6 left-6"
                  >
                    <TechnicalBadge icon={Hand} label="Gerakan terdeteksi" variant="active" />
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
                className="absolute inset-x-0 bottom-6 px-6 z-30 flex justify-center"
              >
                <div className="flex items-center gap-3 rounded-sm bg-cohere-error px-4 py-2.5 text-xs font-medium text-white">
                  <ShieldAlert className="size-3.5" />
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
                className="absolute inset-0 z-30 flex items-center justify-center bg-[#17171c]"
              >
                {state === "idle" && (
                  <div className="flex max-w-sm flex-col items-center gap-6 px-8 text-center">
                    <div className="flex size-16 items-center justify-center rounded-sm border border-white/15 md:size-20">
                      <Camera className="size-8 text-white/20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-white">Mulai kamera</h3>
                      <p className="text-sm leading-relaxed text-white/45">
                        Izinkan akses kamera untuk mulai menerjemahkan BISINDO.
                      </p>
                    </div>
                    <button
                      onClick={onRequestCamera}
                      className="rounded-[32px] bg-white px-8 py-3 text-xs font-medium text-cohere-primary transition-colors hover:bg-cohere-stone"
                    >
                      Aktifkan kamera
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center gap-6">
                    <Loader2 className="size-8 text-white/10 animate-spin" />
                    <span className="text-xs text-white/45">
                      Menyiapkan kamera
                    </span>
                  </div>
                )}

                {isError && (
                  <div className="flex flex-col items-center gap-8 text-center px-10">
                    <div className="size-20 rounded-full bg-[color-mix(in_srgb,var(--cohere-error)_5%,transparent)] border border-[color-mix(in_srgb,var(--cohere-error)_10%,transparent)] flex items-center justify-center">
                      <ShieldAlert className="size-8 text-cohere-error" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-white">
                        {state === "error-permission" ? "Izin kamera ditolak" : "Kamera tidak ditemukan"}
                      </h3>
                      <p className="text-[13px] text-white/30 leading-relaxed">
                        {state === "error-permission"
                          ? "Beri izin kamera dari browser, lalu coba lagi."
                          : "Pastikan kamera terhubung dan tidak sedang dipakai aplikasi lain."}
                      </p>
                    </div>
                    <button
                      onClick={onRequestCamera}
                      className="rounded-[32px] border border-white/20 px-8 py-3 text-[11px] font-medium text-white transition-colors hover:bg-white/10"
                    >
                      Coba lagi
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="z-40 bg-[#17171c] px-4 py-4 md:px-5">
          <div className="flex items-center gap-4">
            {isLive && !isLoading && (
              <>
                {!isActive ? (
                  <button
                    onClick={onStartDetection}
                    className="flex-1 rounded-[32px] bg-white px-6 py-4 text-sm font-medium text-cohere-primary transition-colors hover:bg-cohere-stone"
                  >
                    Mulai terjemah
                  </button>
                ) : (
                  <button
                    onClick={onStopDetection}
                    className="flex-1 rounded-[32px] border border-white/20 bg-cohere-primary px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Jeda terjemah
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <ControlIconBtn onClick={onReset} label="Mulai ulang">
                    <RotateCcw className="size-5" />
                  </ControlIconBtn>
                  <ControlIconBtn 
                    onClick={onFlipCamera} 
                    label="Ganti kamera"
                    disabled={!hasMultipleCameras}
                  >
                    <FlipHorizontal className="size-5" />
                  </ControlIconBtn>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }
);

WebcamCapture.displayName = "WebcamCapture";

function ControlIconBtn({ 
  onClick, 
  disabled, 
  label,
  children 
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
      className="flex size-12 items-center justify-center rounded-sm border border-white/15 text-white/45 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-20"
    >
      {children}
    </button>
  );
}

export default WebcamCapture;
