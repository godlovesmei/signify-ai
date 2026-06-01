"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue } from "motion/react";
import { ChevronRight, Sliders, RotateCcw, Maximize2, Camera, Minimize2 } from "lucide-react";

import {
  WebcamCapture,
  type WebcamCaptureHandle,
  type CameraState,
} from "@/components/features/translation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { captureFrame } from "@/lib/imagePreprocess";
import { predictFromBlob, type TranslateDetection } from "@/lib/translateApi";
import {
  ALPHABET_LETTERS,
  type AlphabetLetter,
  type PracticeStats,
  getPracticeStats,
  recordPracticeAttempt,
  resetPracticeStats,
} from "@/lib/userData";
import { CameraFrame } from "@/components/features/practice/CameraFrame";
import { TrailIndicator, StatusBadge } from "@/components/features/practice/AmbientStatusStrip";
import { HoldProgressRing } from "@/components/features/practice/HoldProgressRing";
import { GhostSkeleton } from "@/components/features/practice/GhostSkeleton";
import { MicroFeedback } from "@/components/features/practice/MicroFeedback";
import { SuccessOverlay } from "@/components/features/practice/SuccessOverlay";
import { TargetBlock, TargetCompact } from "@/components/features/practice/TargetBlock";
import { StatsDrawer } from "@/components/features/practice/StatsDrawer";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const PRACTICE_WS_URL = process.env.NEXT_PUBLIC_PRACTICE_WS_URL;
const PRACTICE_WS_PATH = "/api/v1/translate/stream";
const MODEL_INIT_MS = 2400;
const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
const DETECTION_INTERVAL = IS_MOBILE ? 300 : 200;
const HOLD_FRAMES_NEEDED = 5;
const HOLD_CONFIDENCE_MIN = 0.78;
const HOLD_DECAY = 0.5;
const SUCCESS_PAUSE_MS = 800;
const RING_FINGER_TIP_INDEX = 16;

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomLetter(): AlphabetLetter {
  return ALPHABET_LETTERS[Math.floor(Math.random() * ALPHABET_LETTERS.length)];
}

function pickAdaptiveLetter(stats: PracticeStats, exclude?: AlphabetLetter): AlphabetLetter {
  const ranked = [...ALPHABET_LETTERS].sort((a, b) => {
    const aS = stats.byLetter[a];
    const bS = stats.byLetter[b];
    if (aS.attempts === 0 && bS.attempts > 0) return -1;
    if (bS.attempts === 0 && aS.attempts > 0) return 1;
    const aAcc = aS.attempts === 0 ? 0 : aS.correct / aS.attempts;
    const bAcc = bS.attempts === 0 ? 0 : bS.correct / bS.attempts;
    if (aAcc !== bAcc) return aAcc - bAcc;
    return aS.attempts - bS.attempts;
  });
  const pool = ranked.slice(0, 6).filter((l) => l !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] ?? randomLetter();
}

type LandmarkPoint = { x: number; y: number; z?: number };

type MicroFeedbackPayload = {
  x: number;
  y: number;
  text: string;
  visible: boolean;
};

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function coerceLandmark(value: unknown): LandmarkPoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    const x = toNumber(value[0]);
    const y = toNumber(value[1]);
    const z = toNumber(value[2]);
    if (x === null || y === null) return null;
    return { x, y, z: z ?? undefined };
  }

  const record = toRecord(value);
  if (!record) return null;
  const x = toNumber(record.x);
  const y = toNumber(record.y);
  const z = toNumber(record.z);
  if (x === null || y === null) return null;
  return { x, y, z: z ?? undefined };
}

function findLandmarks(payload: Record<string, unknown>): LandmarkPoint[] | null {
  const direct = payload.landmarks ?? payload.keypoints;
  if (Array.isArray(direct)) {
    const mapped = direct.map(coerceLandmark).filter(Boolean) as LandmarkPoint[];
    return mapped.length > 0 ? mapped : null;
  }

  const hands = payload.hands;
  if (Array.isArray(hands) && hands.length > 0) {
    const first = toRecord(hands[0]);
    if (first) {
      const list = first.landmarks ?? first.keypoints;
      if (Array.isArray(list)) {
        const mapped = list.map(coerceLandmark).filter(Boolean) as LandmarkPoint[];
        return mapped.length > 0 ? mapped : null;
      }
    }
  }

  return null;
}

function normalizeCoord(value: number | null, size?: number | null): number | null {
  if (value === null) return null;
  if (value >= 0 && value <= 1) return value * 100;
  if (size && value >= 0 && value <= size) return (value / size) * 100;
  if (value >= 0 && value <= 100) return value;
  return null;
}

function clampPercent(value: number): number {
  return Math.min(96, Math.max(4, value));
}

function getFrameSize(payload: Record<string, unknown>): { width?: number; height?: number } {
  const width = toNumber(payload.width) ?? toNumber(toRecord(payload.frame)?.width) ?? toNumber(toRecord(payload.image)?.width);
  const height = toNumber(payload.height) ?? toNumber(toRecord(payload.frame)?.height) ?? toNumber(toRecord(payload.image)?.height);
  return {
    width: width ?? undefined,
    height: height ?? undefined,
  };
}

function parsePracticeMessage(raw: unknown): MicroFeedbackPayload | null {
  const payload = toRecord(raw);
  if (!payload) return null;

  const feedback =
    toRecord(payload.feedback) ??
    toRecord(payload.micro_feedback) ??
    toRecord(payload.microFeedback) ??
    toRecord(payload.annotation);

  const fallbackPoint = toRecord(payload.point) ?? toRecord(payload.anchor);
  const feedbackPoint = toRecord(feedback?.point) ?? toRecord(feedback?.anchor);
  const text =
    (typeof feedback?.text === "string" ? feedback.text : undefined) ??
    (typeof payload.text === "string" ? payload.text : undefined) ??
    (typeof payload.message === "string" ? payload.message : undefined) ??
    "";

  const visibleRaw = feedback?.visible ?? payload.visible;
  const visible = typeof visibleRaw === "boolean" ? visibleRaw : true;

  const size = getFrameSize(payload);

  const xValue =
    toNumber(feedback?.x) ??
    toNumber(feedbackPoint?.x) ??
    toNumber(fallbackPoint?.x) ??
    toNumber(payload.x);
  const yValue =
    toNumber(feedback?.y) ??
    toNumber(feedbackPoint?.y) ??
    toNumber(fallbackPoint?.y) ??
    toNumber(payload.y);

  let xPercent = normalizeCoord(xValue, size.width);
  let yPercent = normalizeCoord(yValue, size.height);

  if (xPercent === null || yPercent === null) {
    const landmarks = findLandmarks(payload);
    if (landmarks && landmarks.length > RING_FINGER_TIP_INDEX) {
      const ringTip = landmarks[RING_FINGER_TIP_INDEX];
      xPercent = normalizeCoord(ringTip.x, size.width);
      yPercent = normalizeCoord(ringTip.y, size.height);
    }
  }

  if (xPercent === null || yPercent === null) return null;

  return {
    x: clampPercent(xPercent),
    y: clampPercent(yPercent),
    text,
    visible,
  };
}

function resolvePracticeWsUrl(): string | null {
  if (PRACTICE_WS_URL) return PRACTICE_WS_URL;
  try {
    const url = new URL(API_BASE_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = PRACTICE_WS_PATH;
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PracticePageContent() {
  // ── Camera state ──────────────────────────────────────────────────
  const [appState, setAppState] = useState<CameraState>("idle");
  const [isMirrored, setIsMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [apiError, setApiError] = useState(false);
  const [detections, setDetections] = useState<TranslateDetection[]>([]);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });

  // ── Practice state ────────────────────────────────────────────────
  const [stats, setStats] = useState<PracticeStats>(() => getPracticeStats());
  const [target, setTarget] = useState<AlphabetLetter>(() => pickAdaptiveLetter(getPracticeStats()));
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSuccessFlash, setSuccessFlash] = useState(false);
  const [trail, setTrail] = useState<AlphabetLetter[]>(() => [target]);
  const [ghostVisible, setGhostVisible] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Micro feedback ───────────────────────────────────────────────
  const microX = useMotionValue(50);
  const microY = useMotionValue(40);
  const [microText, setMicroText] = useState("");
  const [microVisible, setMicroVisible] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────
  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const cameraFrameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isBusy = useRef(false);
  const holdProgressRef = useRef(0);
  const isSucceeding = useRef(false);
  const targetRef = useRef(target);
  const startInferenceLoopRef = useRef<() => void>(() => {});
  const microPayloadRef = useRef<MicroFeedbackPayload>({
    x: 50,
    y: 40,
    text: "",
    visible: false,
  });
  const microTextRef = useRef("");
  const microVisibleRef = useRef(false);
  const microRafRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingTargetRef = useRef<AlphabetLetter | null>(null);

  useEffect(() => { targetRef.current = target; }, [target]);

  const isMirroredRef = useRef(isMirrored);
  useEffect(() => {
    isMirroredRef.current = isMirrored;
  }, [isMirrored]);

  const scheduleMicroUpdate = useCallback(() => {
    if (microRafRef.current !== null) return;
    microRafRef.current = requestAnimationFrame(() => {
      microRafRef.current = null;
      const { x, y, text, visible } = microPayloadRef.current;

      const finalX = isMirroredRef.current ? 100 - x : x;
      microX.set(finalX);
      microY.set(y);
      if (text !== microTextRef.current) {
        microTextRef.current = text;
        setMicroText(text);
      }
      if (visible !== microVisibleRef.current) {
        microVisibleRef.current = visible;
        setMicroVisible(visible);
      }
    });
  }, [microX, microY]);

  const applyMicroFeedback = useCallback((payload: MicroFeedbackPayload) => {
    microPayloadRef.current = payload;
    scheduleMicroUpdate();
  }, [scheduleMicroUpdate]);

  const clearMicroFeedback = useCallback(() => {
    microPayloadRef.current = {
      ...microPayloadRef.current,
      text: "",
      visible: false,
    };
    scheduleMicroUpdate();
  }, [scheduleMicroUpdate]);

  useEffect(() => {
    return () => {
      if (microRafRef.current !== null) {
        cancelAnimationFrame(microRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last === target) return prev.length > 0 ? prev : [target];
      return [...prev, target].slice(-3);
    });
    clearMicroFeedback();
  }, [target, clearMicroFeedback]);

  useEffect(() => {
    captureCanvasRef.current = document.createElement("canvas");
    return () => { captureCanvasRef.current = null; };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const stream = streamRef.current;
    const video = webcamRef.current?.videoElement;
    if (!stream || !video) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.play().catch(() => {});
  }, [isDesktop]);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasDetectingRef = useRef(false);
  useEffect(() => {
    function onVisibility() {
      if (document.hidden && appState === "detecting") {
        wasDetectingRef.current = true;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      } else if (!document.hidden && wasDetectingRef.current) {
        wasDetectingRef.current = false;
        startInferenceLoopRef.current();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [appState]);

  useEffect(() => {
    const wsUrl = resolvePracticeWsUrl();
    if (!wsUrl || appState !== "detecting") return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      const letter = pendingTargetRef.current ?? targetRef.current;
      pendingTargetRef.current = null;
      ws.send(JSON.stringify({ type: "practice_target", target: letter }));
    });

    ws.addEventListener("message", (event) => {
      let decoded: string | null = null;
      if (typeof event.data === "string") {
        decoded = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        decoded = new TextDecoder().decode(event.data);
      }
      if (!decoded) return;
      try {
        const parsed = JSON.parse(decoded);
        const payload = parsePracticeMessage(parsed);
        if (payload) applyMicroFeedback(payload);
      } catch {
        // Ignore malformed payloads.
      }
    });

    ws.addEventListener("close", () => {
      wsRef.current = null;
    });

    ws.addEventListener("error", () => {
      wsRef.current = null;
    });

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [appState, applyMicroFeedback]);

  useEffect(() => {
    if (appState !== "detecting") return;
    const payload = JSON.stringify({ type: "practice_target", target });
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    } else {
      pendingTargetRef.current = target;
    }
  }, [appState, target]);

  // ── Camera helpers ────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = webcamRef.current?.videoElement;
    if (video) video.srcObject = null;
  }, []);

  // ── Success handler ───────────────────────────────────────────────

  const triggerSuccess = useCallback((letter: AlphabetLetter) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    clearMicroFeedback();
    setSuccessFlash(true);

    const newStats = recordPracticeAttempt(letter, true);
    setStats(newStats);

    setTimeout(() => {
      const next = pickAdaptiveLetter(newStats, letter);
      setTarget(next);
      targetRef.current = next;
      holdProgressRef.current = 0;
      setHoldProgress(0);
      setCurrentLetter(null);
      setDetections([]);
      setSuccessFlash(false);
      isSucceeding.current = false;
      startInferenceLoopRef.current();
    }, SUCCESS_PAUSE_MS);
  }, [clearMicroFeedback]);

  // ── Inference loop ────────────────────────────────────────────────

  const startInferenceLoop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    timerRef.current = setInterval(async () => {
      if (isBusy.current || isSucceeding.current) return;
      const video = webcamRef.current?.videoElement;
      const canvas = captureCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      isBusy.current = true;
      try {
        const frameBlob = await captureFrame(video, canvas, 640);
        if (frameBlob === null) return;

        const result = await predictFromBlob(frameBlob, { baseUrl: API_BASE_URL });
        if (result === null) {
          setApiError(true);
          setDetections([]);
          return;
        }

        setApiError(false);

        const dets = result.detections ?? [];
        setDetections(dets);

        if (dets.length === 0) {
          setCurrentLetter(null);
          holdProgressRef.current = Math.max(0, holdProgressRef.current - HOLD_DECAY);
          setHoldProgress(holdProgressRef.current);
          return;
        }

        const top = dets.reduce((best, cur) =>
          cur.confidence > best.confidence ? cur : best,
        );
        setCurrentLetter(top.class);

        if (top.class === targetRef.current && top.confidence >= HOLD_CONFIDENCE_MIN) {
          holdProgressRef.current = Math.min(HOLD_FRAMES_NEEDED, holdProgressRef.current + 1);
        } else {
          holdProgressRef.current = Math.max(0, holdProgressRef.current - HOLD_DECAY);
        }
        setHoldProgress(holdProgressRef.current);

        if (holdProgressRef.current >= HOLD_FRAMES_NEEDED && !isSucceeding.current) {
          isSucceeding.current = true;
          triggerSuccess(targetRef.current);
        }
      } finally {
        isBusy.current = false;
      }
    }, DETECTION_INTERVAL);
  }, [triggerSuccess]);

  useEffect(() => {
    startInferenceLoopRef.current = startInferenceLoop;
  }, [startInferenceLoop]);

  // ── Skip ──────────────────────────────────────────────────────────

  const handleSkip = useCallback(() => {
    if (isSucceeding.current) return;
    clearMicroFeedback();
    const newStats = recordPracticeAttempt(target, false);
    setStats(newStats);
    holdProgressRef.current = 0;
    setHoldProgress(0);
    setCurrentLetter(null);
    setDetections([]);
    const next = pickAdaptiveLetter(newStats, target);
    setTarget(next);
    targetRef.current = next;
  }, [clearMicroFeedback, target]);

  // ── Camera lifecycle ──────────────────────────────────────────────

  const startDetection = useCallback(() => {
    setAppState("detecting");
    startInferenceLoop();
  }, [startInferenceLoop]);

  const startCamera = useCallback(async (facing: "user" | "environment" = facingMode) => {
    setAppState("requesting");
    setApiError(false);
    stopStream();
    isSucceeding.current = false;
    holdProgressRef.current = 0;
    setHoldProgress(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = webcamRef.current?.videoElement;
      if (video) { video.srcObject = stream; await video.play(); }
      setAppState("loading");
      setTimeout(() => {
        startDetection();
      }, MODEL_INIT_MS);
    } catch (err: unknown) {
      const e = err as { name?: string };
      setAppState(
        e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
          ? "error-permission"
          : "error-device",
      );
    }
  }, [facingMode, stopStream, startDetection]);

  const stopDetection = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    isBusy.current = false;
    holdProgressRef.current = 0;
    isSucceeding.current = false;
    clearMicroFeedback();
    setDetections([]);
    setCurrentLetter(null);
    setHoldProgress(0);
    if (appState === "detecting") setAppState("ready");
  }, [appState, clearMicroFeedback]);

  const handleReset = useCallback(() => {
    stopStream();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    isBusy.current = false;
    holdProgressRef.current = 0;
    isSucceeding.current = false;
    clearMicroFeedback();
    setAppState("idle");
    setDetections([]);
    setCurrentLetter(null);
    setHoldProgress(0);
    setApiError(false);
    setSuccessFlash(false);
  }, [clearMicroFeedback, stopStream]);

  const flipCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    setIsMirrored(next === "user");
    stopDetection();
    startCamera(next);
  }, [facingMode, stopDetection, startCamera]);

  const handlePrimaryCameraAction = useCallback(() => {
    if (appState === "detecting") {
      stopDetection();
      return;
    }

    if (appState === "ready") {
      startDetection();
      return;
    }

    startCamera();
  }, [appState, startCamera, startDetection, stopDetection]);

  const handleToggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    cameraFrameRef.current?.requestFullscreen().catch(() => {});
  }, []);

  const handleResetProgress = useCallback(() => {
    const next = resetPracticeStats();
    setStats(next);
    setTarget(randomLetter());
    holdProgressRef.current = 0;
    setHoldProgress(0);
    clearMicroFeedback();
  }, [clearMicroFeedback]);

  useEffect(() => {
    if (appState !== "detecting") {
      clearMicroFeedback();
    }
  }, [appState, clearMicroFeedback]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === cameraFrameRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ── Derived values ────────────────────────────────────────────────

  const isActive = appState === "detecting";
  const isCameraBusy = appState === "requesting" || appState === "loading";
  const statusTone =
    appState === "requesting" || appState === "loading"
      ? "processing"
      : appState === "detecting"
        ? detections.length > 0
          ? "hand"
          : "no-hand"
        : "no-hand";

  const breadcrumb = trail.length > 0 ? trail : [target];
  const weakLetters = Object.entries(stats.byLetter)
    .filter(([, s]) => s.attempts > 0 && s.correct / s.attempts < 0.7)
    .map(([l]) => l as AlphabetLetter)
    .slice(0, 5);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cohere-canvas text-cohere-ink">
      <main className="workspace-height min-h-0 overflow-y-auto">
        <div className="grid min-h-full gap-5 p-4 md:p-6 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:p-8">
          <aside className="flex min-w-0 flex-col gap-5">
            <section className="rounded-sm border border-cohere-hairline bg-cohere-stone p-5">
              <p className="mb-5 text-mono-label text-[12px] text-cohere-slate">Target</p>
              <div className="hidden lg:block">
                <TargetBlock letter={target} />
              </div>
              <div className="lg:hidden">
                <TargetCompact letter={target} />
              </div>
            </section>

            <section className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-5">
              <p className="text-mono-label text-[12px] text-cohere-slate">Performance</p>
              <div className="mt-5 grid grid-cols-3 gap-3 lg:grid-cols-1">
                {[
                  ["Samples", stats.totalAttempts],
                  ["Precision", `${stats.totalAttempts === 0 ? 0 : Math.round((stats.correctAttempts / stats.totalAttempts) * 100)}%`],
                  ["Streak", stats.currentStreak],
                ].map(([label, value]) => (
                  <div key={label} className="border-t border-cohere-hairline pt-3">
                    <p className="text-[12px] text-cohere-slate">{label}</p>
                    <p className="mt-1 text-[28px] leading-none text-cohere-ink tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              {weakLetters.length > 0 && (
                <div className="mt-6 border-t border-cohere-hairline pt-5">
                  <p className="mb-3 text-mono-label text-[11px] text-cohere-slate">Focus queue</p>
                  <div className="flex flex-wrap gap-2">
                    {weakLetters.map((letter) => (
                      <span
                        key={letter}
                        className={cn(
                          "rounded-[30px] border px-3 py-1 text-[12px]",
                          letter === target
                            ? "border-cohere-green bg-cohere-pale-green text-cohere-green"
                            : "border-cohere-hairline bg-cohere-canvas text-cohere-slate"
                        )}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </aside>

          <section className="flex min-h-[560px] min-w-0 flex-col gap-4 lg:min-h-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <StatusBadge status={statusTone} />
              <TrailIndicator trail={breadcrumb} />
            </div>

            <div ref={cameraFrameRef} className="relative min-h-[420px] flex-1">
              <CameraFrame
                isActive={isActive}
                isDetecting={isActive && detections.length > 0}
                isMatching={isActive && currentLetter === target}
                isSuccess={isSuccessFlash}
                className="h-full w-full"
              >
                <WebcamCapture
                  ref={webcamRef}
                  state={appState}
                  isMirrored={isMirrored}
                  detections={detections}
                  apiError={apiError}
                  hasMultipleCameras={true}
                  onRequestCamera={() => startCamera()}
                  onStartDetection={startDetection}
                  onStopDetection={stopDetection}
                  onFlipCamera={flipCamera}
                  onReset={handleReset}
                />

                {isActive && <GhostSkeleton letter={target} visible={ghostVisible} />}

                {isActive && (
                  <MicroFeedback
                    x={microX}
                    y={microY}
                    text={microText}
                    visible={microVisible}
                  />
                )}

                <SuccessOverlay show={isSuccessFlash} letter={target} />
              </CameraFrame>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-cohere-hairline pt-4">
              <button
                type="button"
                onClick={flipCamera}
                disabled={isCameraBusy}
                className="flex size-12 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink transition-colors hover:bg-cohere-stone disabled:opacity-40"
                aria-label="Flip camera"
              >
                <RotateCcw className="size-5" />
              </button>

              <Button
                type="button"
                onClick={handlePrimaryCameraAction}
                disabled={isCameraBusy}
                className={cn("min-w-44", isActive && "bg-cohere-error hover:bg-cohere-error/90")}
                aria-label={isActive ? "Stop detection" : "Start detection"}
              >
                {isActive ? (
                  <>
                    <span className="size-2 rounded-sm bg-white" />
                    Stop session
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    Start practice
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="flex size-12 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink transition-colors hover:bg-cohere-stone"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
              </button>
            </div>
          </section>

          <aside className="flex min-w-0 flex-col gap-5">
            <section className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-5">
              <p className="text-mono-label text-[12px] text-cohere-slate">Hold progress</p>
              <div className="mt-6 flex flex-col items-center gap-6">
                <HoldProgressRing progress={holdProgress} total={HOLD_FRAMES_NEEDED} size="xl" />
                <div className="w-full">
                  <div className="h-1 w-full overflow-hidden bg-cohere-hairline">
                    <div
                      className="h-full bg-cohere-green transition-all duration-300"
                      style={{ width: `${Math.min(100, (holdProgress / HOLD_FRAMES_NEEDED) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-center text-[12px] text-cohere-slate">Maintain gesture focus</p>
                </div>
              </div>
            </section>

            <section className="rounded-sm border border-cohere-hairline bg-cohere-stone p-5">
              <p className="mb-5 text-mono-label text-[12px] text-cohere-slate">Controls</p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={!isActive || isSuccessFlash}
                  className="justify-between"
                >
                  Skip target <ChevronRight className="size-4" />
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      Session config <Sliders className="size-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[420px] rounded-lg border-cohere-hairline bg-cohere-canvas p-6 text-cohere-ink">
                    <DialogHeader>
                      <DialogTitle className="text-[24px] leading-[1.3]">Session configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-t border-cohere-hairline pt-4">
                        <span className="text-[14px] text-cohere-ink">Guide overlay</span>
                        <Switch checked={ghostVisible} onCheckedChange={setGhostVisible} />
                      </div>
                      <div className="flex items-center justify-between border-t border-cohere-hairline pt-4">
                        <span className="text-[14px] text-cohere-ink">Insight metrics</span>
                        <Switch checked={statsOpen} onCheckedChange={setStatsOpen} />
                      </div>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={handleResetProgress}
                        >
                          Reset practice progress
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" onClick={handleReset}>
                  Reset camera
                </Button>

                <button
                  type="button"
                  onClick={() => setGhostVisible(!ghostVisible)}
                  className="rounded-sm border border-cohere-hairline bg-cohere-canvas px-4 py-3 text-left text-[14px] text-cohere-ink transition-colors hover:bg-cohere-stone"
                >
                  {ghostVisible ? "Hide guide overlay" : "Show guide overlay"}
                </button>
              </div>
            </section>

            <StatsDrawer
              open={statsOpen}
              stats={stats}
              weakLetters={weakLetters}
              target={target}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
