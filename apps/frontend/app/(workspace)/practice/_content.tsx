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

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background text-foreground">
      <main className="workspace-height min-h-0 overflow-y-auto md:overflow-hidden">
        <div className="flex h-full flex-col gap-4 px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">

          {/* DESKTOP LAYOUT: 3-Column Grid */}
          {isDesktop && (
            <div className="grid grid-cols-12 gap-8 h-full">

            {/* LEFT SIDEBAR: Target Info (2 cols) */}
            <aside className="col-span-3 flex min-h-0 min-w-0 flex-col gap-6">
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 glass-panel shadow-2xl">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-8 text-center">Neural Target</p>
                <TargetBlock letter={target} />
              </div>

              {/* Quick Stats */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 glass-panel shadow-2xl flex-1 overflow-hidden flex flex-col">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-6">Real-time Performance</p>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Samples</span>
                    <span className="text-3xl font-black tracking-tighter tabular-nums">{stats.totalAttempts}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Precision</span>
                    <span className="text-3xl font-black tracking-tighter tabular-nums text-emerald-400">
                      {stats.totalAttempts === 0 ? 0 : Math.round((stats.correctAttempts / stats.totalAttempts) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Momentum</span>
                    <span className="text-3xl font-black tracking-tighter tabular-nums text-amber-500">{stats.currentStreak}</span>
                  </div>
                </div>

                {weakLetters.length > 0 && (
                  <div className="mt-auto pt-8 border-t border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Underperforming</p>
                    <div className="flex flex-wrap gap-2">
                      {weakLetters.map((letter) => (
                        <span
                          key={letter}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            letter === target
                              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                              : "border-white/5 bg-white/[0.03] text-white/30",
                          )}
                        >
                          {letter}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* CENTER: Camera (6 cols) - PRIORITIZED */}
            <section className="col-span-6 flex flex-col gap-6 min-h-0">
              {/* Camera Header */}
              <div className="flex items-center justify-between px-2">
                <StatusBadge status={statusTone} className="shadow-2xl" />
                <TrailIndicator trail={breadcrumb} />
              </div>

              {/* Camera Frame */}
              <div ref={cameraFrameRef} className="flex-1 relative min-h-0">
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
                    voiceEnabled={false}
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

              {/* Camera Controls */}
              <div className="flex items-center justify-center gap-6 py-4">
                <button
                  type="button"
                  onClick={flipCamera}
                  disabled={isCameraBusy}
                  className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-white/40 transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95"
                  aria-label="Flip camera"
                >
                  <RotateCcw className="h-6 w-6 transition-transform group-hover:rotate-180 duration-500" />
                </button>

                <button
                  type="button"
                  onClick={handlePrimaryCameraAction}
                  disabled={isCameraBusy}
                  className={cn(
                    "flex h-20 w-48 items-center justify-center gap-4 rounded-3xl transition-all duration-500 font-black uppercase tracking-[0.2em]",
                    isCameraBusy && "cursor-wait opacity-60",
                    isActive
                      ? "bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 border-red-400/50"
                      : "bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                  )}
                  aria-label={isActive ? "Stop detection" : "Start detection"}
                >
                  {isActive ? (
                    <>
                      <div className="h-3 w-3 bg-white rounded-sm animate-pulse" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6" />
                      <span>Start</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-white/40 transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                </button>
              </div>
            </section>

            {/* RIGHT SIDEBAR: Progress & Actions (3 cols) */}
            <aside className="col-span-3 flex flex-col gap-6 min-h-0">
              {/* Progress Ring */}
              <div className="shrink-0 rounded-3xl border border-white/5 bg-white/[0.03] p-8 glass-panel shadow-2xl">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-center flex-1">Neural Lock</p>
                </div>
                <div className="flex flex-col items-center gap-8">
                  <HoldProgressRing progress={holdProgress} total={HOLD_FRAMES_NEEDED} size="xl" />
                  <div className="w-full">
                    <div className="h-2 overflow-hidden rounded-full bg-white/5 shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        style={{ width: `${Math.min(100, (holdProgress / HOLD_FRAMES_NEEDED) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-center text-white/20">Maintain gesture focus</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 rounded-3xl border border-white/5 bg-white/[0.03] p-8 glass-panel shadow-2xl">
                <p className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Mission Control</p>
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={!isActive || isSuccessFlash}
                    className="h-16 w-full justify-between rounded-2xl border-white/5 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    Skip Target <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-16 w-full justify-between rounded-2xl border-white/5 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                        Engine Config <Sliders className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[400px] border-white/10 bg-black/90 backdrop-blur-3xl rounded-[2rem] p-8 shadow-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-[0.2em] mb-4 text-center">Session configuration</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
                          <span className="text-xs font-black uppercase tracking-widest text-white/60">Guide Overlay</span>
                          <Switch checked={ghostVisible} onCheckedChange={setGhostVisible} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10">
                          <span className="text-xs font-black uppercase tracking-widest text-white/60">Insight Metrics</span>
                          <Switch checked={statsOpen} onCheckedChange={setStatsOpen} />
                        </div>
                        <div className="pt-4">
                          <DialogClose asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                              onClick={handleResetProgress}
                            >
                              Purge Progress
                            </Button>
                          </DialogClose>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="h-12 w-full text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Initialize Camera System
                  </Button>
                </div>
              </div>

              {/* Stats Drawer (collapsible) */}
              <StatsDrawer
                open={statsOpen}
                stats={stats}
                weakLetters={weakLetters}
                target={target}
              />
            </aside>
            </div>
          )}

          {/* MOBILE LAYOUT: Stack */}
          {!isDesktop && (
            <div className="flex flex-col gap-6 h-full overflow-y-auto pb-10">

            {/* Mobile Camera (Prioritized) */}
            <section className="relative h-[40dvh] xs:h-[45dvh] min-h-[350px] shrink-0">
              <div className="absolute top-4 left-4 z-40">
                <StatusBadge status={statusTone} className="shadow-2xl scale-90 origin-top-left" />
              </div>

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
                  voiceEnabled={false}
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
            </section>

            {/* Mobile Controls & Target Info */}
            <div className="flex flex-col gap-6 flex-none px-2">
              <section className="flex items-center gap-6 p-6 rounded-3xl border border-white/5 bg-white/[0.03] glass-panel shadow-xl">
                <TargetCompact letter={target} className="border-none bg-transparent p-0 scale-110" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between font-black uppercase tracking-widest text-[9px] text-white/30 mb-2">
                    <span>Precision {stats.totalAttempts === 0 ? 0 : Math.round((stats.correctAttempts / stats.totalAttempts) * 100)}%</span>
                    <span>Streak {stats.currentStreak}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${Math.min(100, (holdProgress / HOLD_FRAMES_NEEDED) * 100)}%` }}
                    />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handlePrimaryCameraAction}
                  disabled={isCameraBusy}
                  className={cn(
                    "h-16 rounded-2xl font-black uppercase tracking-widest transition-all duration-300",
                    isActive 
                      ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]" 
                      : "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  )}
                >
                  {isActive ? "End session" : "Initialize"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSkip} 
                  disabled={!isActive || isSuccessFlash} 
                  className="h-16 rounded-2xl font-black uppercase tracking-widest border-white/5 bg-white/[0.03] hover:bg-white hover:text-black transition-all"
                >
                  Skip
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 py-2">
                 <button onClick={flipCamera} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 p-2 flex items-center gap-3 transition-colors hover:text-white">
                   <RotateCcw className="size-4" /> Flip Optic
                 </button>
                 <button onClick={() => setGhostVisible(!ghostVisible)} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 p-2 flex items-center gap-3 transition-colors hover:text-white">
                   <div className={cn("size-2 rounded-full", ghostVisible ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-white/10")} />
                   {ghostVisible ? "Hide Guide" : "Show Guide"}
                 </button>
              </div>
            </div>

            {/* Stats drawer for mobile if needed */}
            <div className="px-2">
               <StatsDrawer
                  open={statsOpen}
                  stats={stats}
                  weakLetters={weakLetters}
                  target={target}
                />
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}