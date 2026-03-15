'use client';

/**
 * translate/page.tsx  (refactored)
 *
 * This page is now a THIN ORCHESTRATION LAYER.
 * It owns:
 *  - Application-level state (camera state, transcript, settings)
 *  - Camera stream lifecycle (start, stop, flip)
 *  - Detection loop (MediaPipe + backend call)
 *  - Wiring between WebcamCapture ↔ LandmarkOverlay ↔ PredictionDisplay
 *
 * It does NOT contain:
 *  - Any JSX for camera UI chrome       → WebcamCapture
 *  - Any canvas drawing logic           → LandmarkOverlay + drawingUtils
 *  - Any transcript/prediction UI       → PredictionDisplay
 *  - Any sub-component definitions      → moved to feature folder
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Mic, Settings, Volume2, VolumeX, X, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

import {
  WebcamCapture,
  LandmarkOverlay,
  PredictionDisplay,
  type WebcamCaptureHandle,
  type CameraState,
  type TranscriptEntry,
} from '@/components/features/translation';
import type { Landmark } from '@/components/features/translation/drawingUtils';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE_URL       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const MODEL_INIT_MS      = 2400;
const DETECTION_INTERVAL = 1500;
const HAND_CROP_PADDING  = 0.25;

type Language = 'ASL' | 'BISINDO';

// ── ID helper ────────────────────────────────────────────────────────────────

let _id = 0;
function uid() { return `entry-${Date.now()}-${++_id}`; }

// ── MediaPipe init ────────────────────────────────────────────────────────────

async function createHandLandmarker(): Promise<HandLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}

// ── Frame helpers ─────────────────────────────────────────────────────────────

function cropHandFromCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  result: ReturnType<HandLandmarker['detectForVideo']>,
): Blob | null {
  if (!result.landmarks || result.landmarks.length === 0) return null;

  const { videoWidth: W, videoHeight: H } = video;
  const landmarks = result.landmarks[0];
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;

  for (const lm of landmarks) {
    if (lm.x < xMin) xMin = lm.x;
    if (lm.y < yMin) yMin = lm.y;
    if (lm.x > xMax) xMax = lm.x;
    if (lm.y > yMax) yMax = lm.y;
  }

  const bw = (xMax - xMin) * W;
  const bh = (yMax - yMin) * H;
  const padX = bw * HAND_CROP_PADDING;
  const padY = bh * HAND_CROP_PADDING;
  const cx = Math.max(0, Math.floor(xMin * W - padX));
  const cy = Math.max(0, Math.floor(yMin * H - padY));
  const cw = Math.min(W - cx, Math.ceil(bw + padX * 2));
  const ch = Math.min(H - cy, Math.ceil(bh + padY * 2));
  if (cw <= 0 || ch <= 0) return null;

  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, W, H);

  const crop    = document.createElement('canvas');
  crop.width    = cw;
  crop.height   = ch;
  const cropCtx = crop.getContext('2d');
  if (!cropCtx) return null;
  cropCtx.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch);

  const dataUrl = crop.toDataURL('image/jpeg', 0.85);
  const binary  = atob(dataUrl.split(',')[1]);
  const arr     = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/jpeg' });
}

async function predictFromBlob(
  blob: Blob,
): Promise<{ prediction: string; confidence: number; low_confidence: boolean } | null> {
  try {
    const form = new FormData();
    form.append('file', blob, 'hand.jpg');
    const res = await fetch(`${API_BASE_URL}/api/v1/translate/predict`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Settings panel ────────────────────────────────────────────────────────────
// Kept here (not extracted) because it uses only page-level state and is small.

function SettingsPanel({
  language,
  onLanguageChange,
  voiceEnabled,
  onVoiceToggle,
  onClose,
}: {
  language: Language;
  onLanguageChange: (l: Language) => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detection settings"
      className="absolute inset-0 z-30 flex items-end justify-center md:items-center"
    >
      <div
        className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        className="relative z-10 w-full max-w-90 rounded-t-2xl border border-border/40 bg-card shadow-xl focus:outline-none md:rounded-2xl animate-[slideUp_0.22s_ease]"
      >
        <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Language select */}
          <div>
            <label
              htmlFor="lang-select"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Sign Language
            </label>
            <div className="relative">
              <select
                id="lang-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ASL">American Sign Language (ASL)</option>
                <option value="BISINDO">Indonesian Sign Language (BISINDO)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Voice toggle */}
          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Voice Output</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Speak translations aloud</p>
            </div>
            <Button
              role="switch"
              aria-checked={voiceEnabled}
              onClick={onVoiceToggle}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
                voiceEnabled ? 'bg-primary' : 'bg-border',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  voiceEnabled ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </Button>
          </div>

          {/* Lighting tip */}
          <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 dark:border-amber-500/15 dark:bg-amber-500/5">
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              Best results in well-lit conditions.{' '}
              <Link
                href="/how-it-works#limitations"
                className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:no-underline"
              >
                Learn more <ArrowUpRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TranslatePage() {
  // ── State ──────────────────────────────────────────────────────────────────

  const [appState, setAppState]                     = useState<CameraState>('idle');
  const [transcript, setTranscript]                 = useState<TranscriptEntry[]>([]);
  const [language, setLanguage]                     = useState<Language>('BISINDO');
  const [voiceEnabled, setVoiceEnabled]             = useState(false);
  const [facingMode, setFacingMode]                 = useState<'user' | 'environment'>('user');
  const [showSettings, setShowSettings]             = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [apiError, setApiError]                     = useState(false);
  const [handDetected, setHandDetected]             = useState(false);
  const [mpReady, setMpReady]                       = useState(false);

  // Landmarks for LandmarkOverlay
  const [landmarks, setLandmarks]                   = useState<Landmark[] | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const webcamRef     = useRef<WebcamCaptureHandle>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);   // offscreen crop canvas
  const streamRef     = useRef<MediaStream | null>(null);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy        = useRef(false);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  // ── Init MediaPipe once ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    createHandLandmarker()
      .then((lm) => { if (!cancelled) { landmarkerRef.current = lm; setMpReady(true); } })
      .catch((e) => console.error('MediaPipe init failed:', e));
    return () => { cancelled = true; };
  }, []);

  // ── Detect multiple cameras ────────────────────────────────────────────────

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((d) => setHasMultipleCameras(d.filter((x) => x.kind === 'videoinput').length > 1))
      .catch(() => {});
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Camera helpers ─────────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = webcamRef.current?.videoElement;
    if (video) video.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (facing: 'user' | 'environment' = facingMode) => {
      setAppState('requesting');
      setApiError(false);
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const video = webcamRef.current?.videoElement;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setAppState('loading');
        setTimeout(() => setAppState('ready'), MODEL_INIT_MS);
      } catch (err: unknown) {
        const e = err as { name?: string };
        setAppState(
          e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError'
            ? 'error-permission'
            : 'error-device',
        );
      }
    },
    [facingMode, stopStream],
  );

  const handleReset = useCallback(() => {
    stopStream();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    isBusy.current = false;
    setAppState('idle');
    setTranscript([]);
    setApiError(false);
    setHandDetected(false);
    setLandmarks(null);
  }, [stopStream]);

  // ── Detection loop ─────────────────────────────────────────────────────────

  const startDetection = useCallback(() => {
    if (appState !== 'ready') return;
    setAppState('detecting');
    setApiError(false);

    timerRef.current = setInterval(async () => {
      if (isBusy.current) return;
      const video = webcamRef.current?.videoElement;
      if (!video || !canvasRef.current || !landmarkerRef.current) return;
      if (video.readyState < 2) return;

      isBusy.current = true;
      try {
        // 1. Detect landmarks
        const result = landmarkerRef.current.detectForVideo(video, performance.now());
        const hasHand = (result.landmarks?.length ?? 0) > 0;
        setHandDetected(hasHand);

        // Update LandmarkOverlay
        setLandmarks(hasHand ? (result.landmarks[0] as Landmark[]) : null);

        if (!hasHand) return;

        // 2. Crop hand region
        const blob = cropHandFromCanvas(video, canvasRef.current, result);
        if (!blob) return;

        // 3. Send to backend
        const prediction = await predictFromBlob(blob);
        if (!prediction) { setApiError(true); return; }
        setApiError(false);

        // 4. Skip low-confidence
        if (prediction.low_confidence) return;

        // 5. Append to transcript
        setTranscript((prev) => [
          ...prev.slice(-49),
          {
            id: uid(),
            text: prediction.prediction,
            confidence: prediction.confidence,
            timestamp: new Date(),
            language,
          },
        ]);

        // 6. Voice synthesis
        if (voiceEnabled && 'speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(prediction.prediction);
          u.rate = 0.95;
          window.speechSynthesis.speak(u);
        }
      } finally {
        isBusy.current = false;
      }
    }, DETECTION_INTERVAL);
  }, [appState, language, voiceEnabled]);

  const stopDetection = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    isBusy.current = false;
    setHandDetected(false);
    setLandmarks(null);
    if (appState === 'detecting') setAppState('ready');
  }, [appState]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    stopDetection();
    startCamera(next);
  }, [facingMode, stopDetection, startCamera]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isLive   = appState === 'ready' || appState === 'detecting';
  const isActive = appState === 'detecting';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Global keyframe definitions shared by sub-components */}
      <style>{`
        @keyframes scanline {
          0%   { top: 1.25rem; opacity: 0 }
          8%   { opacity: 1 }
          92%  { opacity: 1 }
          100% { top: calc(100% - 5.5rem); opacity: 0 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: .3; transform: scale(1) }
          50%      { opacity: .07; transform: scale(1.06) }
        }
        @keyframes entryIn {
          from { opacity: 0; transform: translateY(4px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .entry-enter { animation: entryIn 0.22s ease forwards; }
      `}</style>

      {/* Offscreen canvas for hand crop (not visible) */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header
          role="banner"
          className="flex h-14 shrink-0 items-center justify-between border-b border-border/30 bg-background px-4 md:px-5"
        >
          <Logo size="sm" />

          <div className="flex items-center gap-2">
            {/* Live indicator dot */}
            {isActive && (
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400/70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
            )}
            <h1 className="text-sm font-semibold tracking-[-0.01em]">
              {isActive ? 'Detecting' : 'Translate'}
            </h1>
            {isLive && (
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 md:inline-flex">
                Live
              </span>
            )}
            {!mpReady && (
              <span className="hidden rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 md:inline-flex">
                Loading hand detector…
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              disabled={!isLive}
              aria-label={voiceEnabled ? 'Disable voice' : 'Enable voice'}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-30"
            >
              {voiceEnabled
                ? <Volume2 className="h-4 w-4" />
                : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              disabled={!isLive}
              aria-label="Open settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-30"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ── Main two-column layout ───────────────────────────────────────── */}
        <main
          className="flex flex-1 flex-col overflow-hidden md:flex-row"
          style={{ minHeight: 0 }}
        >
          {/* Camera column — WebcamCapture + LandmarkOverlay stacked */}
          <div className="relative flex flex-col md:flex-1" style={{ minHeight: 0 }}>
            <WebcamCapture
              ref={webcamRef}
              state={appState}
              facingMode={facingMode}
              mpReady={mpReady}
              handDetected={handDetected}
              apiError={apiError}
              hasMultipleCameras={hasMultipleCameras}
              languageLabel={language}
              voiceEnabled={voiceEnabled}
              onRequestCamera={() => startCamera()}
              onStartDetection={startDetection}
              onStopDetection={stopDetection}
              onFlipCamera={flipCamera}
              onReset={handleReset}
            />

            {/* Landmark skeleton drawn on top of video, only while detecting */}
            {isActive && (
              <LandmarkOverlay
                landmarks={landmarks}
                mirrored={facingMode === 'user'}
                showBoundingBox={false}
              />
            )}
          </div>

          {/* Transcript column */}
          <PredictionDisplay
            transcript={transcript}
            appState={appState}
            onClearTranscript={() => setTranscript([])}
          />
        </main>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <SettingsPanel
          language={language}
          onLanguageChange={setLanguage}
          voiceEnabled={voiceEnabled}
          onVoiceToggle={() => setVoiceEnabled((v) => !v)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}