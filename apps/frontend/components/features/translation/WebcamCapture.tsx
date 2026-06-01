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
  Square,
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

/**
 * Technical Badge following Cohere's Mono Label style.
 * Typography: CohereMono, 14px, 400, 0.28px tracking.
 */
function TechnicalBadge({ 
  icon: Icon, 
  label, 
  value, 
  variant = "default" 
}: { 
  icon?: any; 
  label: string; 
  value?: string | number;
  variant?: "default" | "active" | "error";
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2.5 py-1 border-[0.5px] rounded-sm font-mono uppercase text-[9px] tracking-[0.05em]",
      variant === "default" && "bg-white/5 border-white/10 text-white/50",
      variant === "active" && "bg-white/10 border-white/20 text-white",
      variant === "error" && "bg-red-500/10 border-red-500/20 text-red-500"
    )}>
      {Icon && <Icon className="size-2.5" />}
      <span>{label}</span>
      {value !== undefined && <span className="opacity-30 ml-1">/ {value}</span>}
    </div>
  );
}

/**
 * Enterprise Status chip for the live state.
 */
function StatusChip({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        "size-1.5 rounded-full",
        active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-white/20"
      )} />
      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/70">
        {active ? "LIVE_FEED" : "STANDBY"}
      </span>
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
        aria-label="Agent Vision Interface"
        className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-md bg-[#17171c] border border-white/5 shadow-2xl"
      >
        {/* Header Bar: Enterprise AI Command Style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 z-20 bg-[#17171c]">
          <div className="flex items-center gap-8">
            <StatusChip active={isActive} />
            <div className="hidden lg:flex items-center gap-4">
              <TechnicalBadge label="Engine" value="BISINDO_V3" />
              <TechnicalBadge label="Mode" value="RGB_DIRECT" />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <TechnicalBadge 
               icon={Zap} 
               label="Inference" 
               value={isActive ? `${fps} FPS` : "---"} 
               variant={isActive ? "active" : "default"}
             />
             <div className="h-4 w-px bg-white/10 hidden md:block" />
             <button 
              onClick={handleFullscreen}
              className="p-1 text-white/30 hover:text-white transition-colors"
             >
               {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
             </button>
          </div>
        </div>

        {/* Media Container: High Editorial Space */}
        <div className="relative flex-1 bg-black overflow-hidden m-1 rounded-sm border border-white/5 group">
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

          {/* HUD Branded Elements - Minimal technical indicators */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Clean technical frame corners - very subtle */}
                <div className="absolute top-4 left-4 size-4 border-t border-l border-white/20" />
                <div className="absolute bottom-4 right-4 size-4 border-b border-r border-white/20" />
                
                {detections.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-6 left-6"
                  >
                    <TechnicalBadge icon={Hand} label="Gesture_Detected" variant="active" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* API Error Overlay */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 bottom-6 px-6 z-30 flex justify-center"
              >
                <div className="flex items-center gap-3 px-4 py-2.5 bg-red-600 text-white rounded-xs text-[10px] font-mono tracking-widest uppercase shadow-xl">
                  <ShieldAlert className="size-3.5" />
                  Signal_Lost: Connection_Error
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interaction Overlays */}
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
                  <div className="flex flex-col items-center gap-10 max-w-sm text-center px-10">
                    <div className="size-20 rounded-full border border-white/5 flex items-center justify-center">
                      <Camera className="size-8 text-white/20" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-light text-white tracking-widest uppercase font-mono text-[14px]">Initialize Vision</h3>
                      <p className="text-sm text-white/30 leading-relaxed font-light">
                        Authorize hardware connection to begin real-time gesture analysis.
                      </p>
                    </div>
                    <button
                      onClick={onRequestCamera}
                      className="px-10 py-4 bg-white text-[#17171c] rounded-full text-xs font-bold tracking-[0.1em] uppercase hover:bg-neutral-200 transition-all active:scale-[0.98]"
                    >
                      Connect Hardware
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center gap-6">
                    <Loader2 className="size-8 text-white/10 animate-spin" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30">
                      Authenticating_Stream
                    </span>
                  </div>
                )}

                {isError && (
                  <div className="flex flex-col items-center gap-8 text-center px-10">
                    <div className="size-20 rounded-full bg-red-500/5 border border-red-500/10 flex items-center justify-center">
                      <ShieldAlert className="size-8 text-red-500" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                        {state === "error-permission" ? "Access_Denied" : "Device_Not_Found"}
                      </h3>
                      <p className="text-[13px] text-white/30 leading-relaxed">
                        {state === "error-permission"
                          ? "Vision protocol requires active camera authorization."
                          : "No compatible hardware detected in the local manifest."}
                      </p>
                    </div>
                    <button
                      onClick={onRequestCamera}
                      className="px-8 py-3 border border-white/10 text-white rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-white/5 transition-all"
                    >
                      Retry System Check
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer: Controlled Action Band */}
        <div className="px-6 py-6 z-40 bg-[#17171c]">
          <div className="flex items-center gap-4">
            {isLive && !isLoading && (
              <>
                {!isActive ? (
                  <button
                    onClick={onStartDetection}
                    className="flex-1 px-8 py-5 bg-white text-[#17171c] rounded-full text-sm font-bold tracking-tight hover:bg-neutral-200 transition-all uppercase"
                  >
                    Start Translation
                  </button>
                ) : (
                  <button
                    onClick={onStopDetection}
                    className="flex-1 px-8 py-5 bg-[#17171c] border border-white/20 text-white rounded-full text-sm font-bold tracking-tight hover:bg-white/5 transition-all uppercase"
                  >
                    Terminate Session
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <ControlIconBtn onClick={onReset} label="Reset System">
                    <RotateCcw className="size-5" />
                  </ControlIconBtn>
                  <ControlIconBtn 
                    onClick={onFlipCamera} 
                    label="Switch Source" 
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
      className="flex size-14 items-center justify-center rounded-full border border-white/5 text-white/20 hover:text-white hover:bg-white/5 hover:border-white/10 transition-all disabled:opacity-10 active:scale-95"
    >
      {children}
    </button>
  );
}

export default WebcamCapture;
