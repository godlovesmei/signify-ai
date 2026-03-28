'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

import {
  WebcamCapture,
  LandmarkOverlay,
  PredictionDisplay,
  PredictionBadge,
  SentenceBuilder,
  DetectionStatus,
  type WebcamCaptureHandle,
  type CameraState,
  type TranscriptEntry,
  type DetectionStatusState,
} from '@/components/features/translation';
import type { DetectedHand } from '@/components/features/translation/drawingUtils';
import SettingsDrawer, { type MediaDeviceOption } from '@/components/layout/SettingsDrawer';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useTheme } from '@/hooks/useTheme';
import { useLandmarkClassifier } from '@/hooks/useLandmarkClassifier';

const API_BASE_URL       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const MODEL_INIT_MS      = 2400;
const DETECTION_INTERVAL = 500;
const MOTION_THRESHOLD   = 0.012; // avg landmark drift (normalised units) above which hand is considered moving
const VOTE_BUFFER_SIZE   = 4;     // frames to collect before committing
const VOTE_NEEDED        = 3;     // how many of those frames must agree
const HAND_CROP_PADDING  = 0.10;

type Language = 'ASL' | 'BISINDO';

let _id = 0;
function uid() { return `entry-${Date.now()}-${++_id}`; }

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
    runningMode:                'VIDEO',
    numHands:                   2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence:  0.5,
    minTrackingConfidence:      0.5,
  });
}

/** Shared helper — draws a square region from the video onto a 224×224 canvas and returns a PNG blob. */
function buildCropBlob(
  scratch: HTMLCanvasElement,
  cx: number, cy: number, side: number,
  flipHorizontal: boolean,
): Blob | null {
  const TARGET = 224;
  const crop = document.createElement('canvas');
  crop.width = TARGET; crop.height = TARGET;
  const cropCtx = crop.getContext('2d');
  if (!cropCtx) return null;
  if (flipHorizontal) {
    cropCtx.translate(TARGET, 0);
    cropCtx.scale(-1, 1);
  }
  cropCtx.drawImage(scratch, cx, cy, side, side, 0, 0, TARGET, TARGET);
  const dataUrl = crop.toDataURL('image/png');
  const binary  = atob(dataUrl.split(',')[1]);
  const arr     = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/png' });
}

/**
 * Single-hand crop — used for one-handed BISINDO letters: C, E, I, J, L, O, R, U, V, Z.
 * Flip logic normalises to right-hand orientation:
 *   rear camera  → flip real left hands (appear left-looking in raw pixels)
 *   front camera → flip real right hands (camera-perspective makes right appear left-looking)
 */
function cropSingleHand(
  video: HTMLVideoElement,
  hand: DetectedHand,
  mirrored: boolean,
): Blob | null {
  const { videoWidth: W, videoHeight: H } = video;

  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const lm of hand.landmarks) {
    if (lm.x < xMin) xMin = lm.x;
    if (lm.y < yMin) yMin = lm.y;
    if (lm.x > xMax) xMax = lm.x;
    if (lm.y > yMax) yMax = lm.y;
  }

  const bw  = (xMax - xMin) * W;
  const bh  = (yMax - yMin) * H;
  const pad = Math.max(bw, bh) * HAND_CROP_PADDING;
  const side = Math.ceil(Math.max(bw, bh) + pad * 2);
  const cx   = Math.max(0, Math.min(W - side, Math.round(((xMin + xMax) / 2) * W - side / 2)));
  const cy   = Math.max(0, Math.min(H - side, Math.round(((yMin + yMax) / 2) * H - side / 2)));
  if (side <= 0) return null;

  const scratch = document.createElement('canvas');
  scratch.width = W; scratch.height = H;
  const ctx = scratch.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, W, H);

  const shouldFlip = mirrored ? hand.handedness === 'Right' : hand.handedness === 'Left';
  return buildCropBlob(scratch, cx, cy, side, shouldFlip);
}

/**
 * Two-hand crop — used for two-handed BISINDO letters: A, B, D, F, G, H, K, M, N, P, Q, S, T, W, X, Y.
 * Computes a joint bounding box across ALL detected hands so both appear in one 224×224 crop,
 * matching the training data distribution (Roboflow images contain both hands together).
 *
 * Returns null if either hand's bounding box extends outside the frame — the model
 * should not receive a partially-visible two-hand gesture.
 *
 * Flip: the entire crop is flipped once when mirrored (front camera), preserving the
 * spatial relationship between the hands that the model learned.
 */
function cropBothHands(
  video: HTMLVideoElement,
  hands: DetectedHand[],
  mirrored: boolean,
): Blob | null {
  const { videoWidth: W, videoHeight: H } = video;

  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const hand of hands) {
    for (const lm of hand.landmarks) {
      if (lm.x < xMin) xMin = lm.x;
      if (lm.y < yMin) yMin = lm.y;
      if (lm.x > xMax) xMax = lm.x;
      if (lm.y > yMax) yMax = lm.y;
    }
  }

  const bw  = (xMax - xMin) * W;
  const bh  = (yMax - yMin) * H;
  const pad = Math.max(bw, bh) * HAND_CROP_PADDING;
  const side = Math.ceil(Math.max(bw, bh) + pad * 2);
  const rawCx = Math.round(((xMin + xMax) / 2) * W - side / 2);
  const rawCy = Math.round(((yMin + yMax) / 2) * H - side / 2);

  // Reject if the unclamped bounding box extends outside the frame —
  // a clipped two-hand crop is worse than no prediction.
  if (rawCx < 0 || rawCy < 0 || rawCx + side > W || rawCy + side > H || side <= 0) return null;

  const scratch = document.createElement('canvas');
  scratch.width = W; scratch.height = H;
  const ctx = scratch.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, W, H);

  // Flip the whole scene for front camera — preserves left/right spatial relationship
  return buildCropBlob(scratch, rawCx, rawCy, side, mirrored);
}

async function predictFromBlob(
  blob: Blob,
): Promise<{ prediction: string; confidence: number; low_confidence: boolean } | null> {
  try {
    const form = new FormData();
    form.append('file', blob, 'hand.jpg');
    const res = await fetch(`${API_BASE_URL}/api/v1/translate/predict`, {
      method: 'POST', body: form,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function toDetectionStatus(state: CameraState): DetectionStatusState {
  if (state === 'detecting')                                    return 'detecting';
  if (state === 'ready')                                        return 'ready';
  if (state === 'loading' || state === 'requesting')            return 'loading';
  if (state === 'error-permission' || state === 'error-device') return 'error';
  return 'idle';
}

export default function TranslatePageContent() {
  const prefs = useAccessibilityPrefs();
  const { theme, setTheme } = useTheme();
  const { isReady: mlpReady, predict: mlpPredict } = useLandmarkClassifier();

  const [appState, setAppState]                   = useState<CameraState>('idle');
  const [transcript, setTranscript]               = useState<TranscriptEntry[]>([]);
  const [tokens, setTokens]                       = useState<string[]>([]);
  const [currentLetter, setCurrentLetter]         = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking]               = useState(false);
  const [isTtsError, setIsTtsError]               = useState(false);
  const [fps, setFps]                             = useState(0);
  const [language]                                = useState<Language>('BISINDO');
  const [voiceEnabled, setVoiceEnabled]           = useState(false);
  const [facingMode, setFacingMode]               = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored]               = useState(true);
  const [showSettings, setShowSettings]           = useState(false);
  const [devices, setDevices]                     = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId]   = useState('');
  const [apiError, setApiError]                   = useState(false);
  const [handsIncomplete, setHandsIncomplete]     = useState(false);
  const [mpReady, setMpReady]                     = useState(false);
  const [hands, setHands]                         = useState<DetectedHand[]>([]);

  const webcamRef      = useRef<WebcamCaptureHandle>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy         = useRef(false);
  const landmarkerRef  = useRef<HandLandmarker | null>(null);
  const fpsCountRef    = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const facingModeRef   = useRef(facingMode);
  const languageRef     = useRef(language);
  const voiceEnabledRef = useRef(voiceEnabled);
  const isMirroredRef   = useRef(isMirrored);

  useEffect(() => { facingModeRef.current   = facingMode;   }, [facingMode]);
  useEffect(() => { languageRef.current     = language;     }, [language]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { isMirroredRef.current   = isMirrored;   }, [isMirrored]);

  // ── Stability gate ──────────────────────────────────────────────────────────
  const prevLandmarksRef = useRef<Array<{ x: number; y: number }> | null>(null);

  function isHandStable(landmarks: Array<{ x: number; y: number }>): boolean {
    const prev = prevLandmarksRef.current;
    prevLandmarksRef.current = landmarks.map(l => ({ x: l.x, y: l.y }));
    if (!prev || prev.length !== landmarks.length) return false;
    const drift = landmarks.reduce((sum, lm, i) => {
      const dx = lm.x - prev[i].x;
      const dy = lm.y - prev[i].y;
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0) / landmarks.length;
    return drift < MOTION_THRESHOLD;
  }

  // ── Sliding window vote ─────────────────────────────────────────────────────
  const voteBuffer = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    createHandLandmarker()
      .then((lm) => { if (!cancelled) { landmarkerRef.current = lm; setMpReady(true); } })
      .catch((e) => console.error('MediaPipe init failed:', e));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((d) => {
        const videoInputs = d.filter((x) => x.kind === 'videoinput');
        setDevices(videoInputs.map((x) => ({ deviceId: x.deviceId, label: x.label })));
        if (videoInputs.length > 0) setSelectedDeviceId(videoInputs[0].deviceId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current)       clearInterval(timerRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = webcamRef.current?.videoElement;
    if (video) video.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (facing: 'user' | 'environment' = facingMode, deviceId?: string) => {
      setAppState('requesting');
      setApiError(false);
      stopStream();
      try {
        const videoConstraints: MediaTrackConstraints = {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        };
        if (deviceId) videoConstraints.deviceId = { exact: deviceId };
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints, audio: false,
        });
        streamRef.current = stream;
        const video = webcamRef.current?.videoElement;
        if (video) { video.srcObject = stream; await video.play(); }
        setAppState('loading');
        setTimeout(() => setAppState('ready'), MODEL_INIT_MS);
      } catch (err: unknown) {
        const e = err as { name?: string };
        setAppState(
          e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError'
            ? 'error-permission' : 'error-device',
        );
      }
    },
    [facingMode, stopStream],
  );

  const handleReset = useCallback(() => {
    stopStream();
    if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
    if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
    isBusy.current = false; fpsCountRef.current = 0;
    setAppState('idle');
    setTranscript([]); setTokens([]);
    setCurrentLetter(null); setCurrentConfidence(null);
    setIsSpeaking(false); setIsTtsError(false);
    setFps(0); setApiError(false); setHands([]); setHandsIncomplete(false);
    voteBuffer.current = []; prevLandmarksRef.current = null;
  }, [stopStream]);

  const startDetection = useCallback(() => {
    if (appState !== 'ready') return;
    setAppState('detecting');
    setApiError(false);

    fpsCountRef.current = 0;
    fpsIntervalRef.current = setInterval(() => {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
    }, 1000);

    timerRef.current = setInterval(async () => {
      if (isBusy.current) return;
      const video = webcamRef.current?.videoElement;
      if (!video || !landmarkerRef.current) return;
      if (video.readyState < 2) return;

      isBusy.current = true;
      try {
        const result             = landmarkerRef.current.detectForVideo(video, performance.now());
        const detectedLandmarks  = result.landmarks    ?? [];
        const detectedHandedness = result.handedness ?? [];
        const mirrored           = facingModeRef.current === 'user';

        const nextHands: DetectedHand[] = detectedLandmarks.map((lms, i) => {
          const topClass  = detectedHandedness[i]?.[0];
          const rawLabel  = (topClass?.categoryName ?? 'Right') as 'Left' | 'Right';
          const corrected = mirrored ? (rawLabel === 'Left' ? 'Right' : 'Left') : rawLabel;
          return { landmarks: lms as DetectedHand['landmarks'], handedness: corrected, score: topClass?.score ?? 1 };
        });

        setHands(nextHands);
        if (nextHands.length === 0) {
          setCurrentLetter(null); setCurrentConfidence(null);
          setHandsIncomplete(false);
          prevLandmarksRef.current = null;
          voteBuffer.current = [];
          return;
        }

        // ── Stability gate ─────────────────────────────────────────────
        // Use the primary hand's landmarks to detect motion. Skip inference
        // when the hand is still transitioning — only predict held poses.
        const primaryLandmarks = nextHands[0].landmarks.map(l => ({ x: l.x, y: l.y }));
        if (!isHandStable(primaryLandmarks)) return;

        // ── Crop strategy: single hand vs. joint two-hand ─────────────
        // BISINDO is predominantly two-handed. The model was trained on
        // Roboflow images where both hands appear together in one crop.
        // When 2 hands are detected → joint crop (preserves spatial relationship).
        // When 1 hand is detected  → single-hand crop (correct for C,E,I,J,L,O,R,U,V,Z).
        // cropBothHands() returns null if the joint bounding box clips the frame edge —
        // in that case we skip inference rather than sending a broken crop.
        let cropBlob: Blob | null;
        if (nextHands.length >= 2) {
          cropBlob = cropBothHands(video, nextHands, isMirroredRef.current);
          setHandsIncomplete(cropBlob === null); // null = one hand near edge, clipped
          if (cropBlob === null) return;
        } else {
          // One hand in frame — valid for single-hand letters; may be incomplete for two-hand letters.
          // We cannot know which case this is until after prediction, so we proceed but flag it.
          setHandsIncomplete(false);
          cropBlob = cropSingleHand(video, nextHands[0], isMirroredRef.current);
          if (cropBlob === null) return;
        }

        // ── CNN path (backend API, primary) ───────────────────────────
        const cnnBest = await predictFromBlob(cropBlob);

        // ── MLP fallback (browser-side) — when CNN unreachable or low confidence ──
        if ((cnnBest === null || cnnBest.confidence < 0.7) && mlpReady) {
          const mlpResults = nextHands
            .map(hand => mlpPredict(hand.landmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z ?? 0 }))))
            .filter((r): r is NonNullable<typeof r> => r !== null);

          if (mlpResults.length > 0) {
            const best = mlpResults.reduce((a, b) => b.confidence > a.confidence ? b : a);
            if (!best.low_confidence) {
              setApiError(false);
              fpsCountRef.current += 1;
              setCurrentLetter(best.prediction);
              setCurrentConfidence(best.confidence);
              setTokens(prev => [...prev, best.prediction]);
              setTranscript(prev => [
                ...prev.slice(-49),
                { id: uid(), text: best.prediction, confidence: best.confidence, timestamp: new Date(), language: languageRef.current },
              ]);
              if (voiceEnabledRef.current && 'speechSynthesis' in window) {
                setIsSpeaking(true);
                const u = new SpeechSynthesisUtterance(best.prediction);
                u.rate = 0.95;
                u.onend = () => setIsSpeaking(false);
                u.onerror = () => setIsSpeaking(false);
                window.speechSynthesis.speak(u);
              }
              return;
            }
          }
        }

        // Use CNN result (or report error if both paths failed)
        if (cnnBest === null) { setApiError(true); return; }
        if (cnnBest.low_confidence) {
          setApiError(false);
          setCurrentLetter(cnnBest.prediction);
          setCurrentConfidence(cnnBest.confidence);
          return;
        }

        setApiError(false);
        fpsCountRef.current += 1;
        setCurrentLetter(cnnBest.prediction);
        setCurrentConfidence(cnnBest.confidence);

        // ── Sliding window vote ────────────────────────────────────────
        // Collect predictions into a rolling buffer. Only commit to transcript
        // when VOTE_NEEDED frames out of VOTE_BUFFER_SIZE agree on the same letter.
        // This eliminates single-frame noise and B/P/W ambiguity.
        voteBuffer.current.push(cnnBest.prediction);
        if (voteBuffer.current.length > VOTE_BUFFER_SIZE) voteBuffer.current.shift();
        if (voteBuffer.current.length < VOTE_BUFFER_SIZE) return;

        const freq: Record<string, number> = {};
        for (const l of voteBuffer.current) freq[l] = (freq[l] ?? 0) + 1;
        const [winner, count] = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        if (count < VOTE_NEEDED) return;

        voteBuffer.current = []; // reset after commit so the same letter isn't repeated immediately

        setTokens((prev) => [...prev, winner]);
        setTranscript((prev) => [
          ...prev.slice(-49),
          { id: uid(), text: winner, confidence: cnnBest.confidence, timestamp: new Date(), language: languageRef.current },
        ]);

        if (voiceEnabledRef.current && 'speechSynthesis' in window) {
          setIsSpeaking(true);
          const u = new SpeechSynthesisUtterance(winner);
          u.rate = 0.95;
          u.onend = () => setIsSpeaking(false);
          u.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(u);
        }
      } finally { isBusy.current = false; }
    }, DETECTION_INTERVAL);
  }, [appState]);

  const stopDetection = useCallback(() => {
    if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
    if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
    isBusy.current = false; fpsCountRef.current = 0;
    setHands([]); setCurrentLetter(null); setCurrentConfidence(null); setFps(0); setHandsIncomplete(false);
    voteBuffer.current = []; prevLandmarksRef.current = null;
    if (appState === 'detecting') setAppState('ready');
  }, [appState]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    stopDetection();
    startCamera(next);
  }, [facingMode, stopDetection, startCamera]);

  const handleSpeak = useCallback(() => {
    const sentence = tokens.join('');
    if (!sentence.trim() || isSpeaking) return;
    if (!('speechSynthesis' in window)) { setIsTtsError(true); return; }
    setIsTtsError(false);
    setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(sentence);
    u.lang   = 'id-ID';
    u.rate   = prefs.ttsSpeed;
    u.volume = prefs.ttsVolume;
    u.onend  = () => setIsSpeaking(false);
    u.onerror = () => { setIsSpeaking(false); setIsTtsError(true); };
    window.speechSynthesis.speak(u);
  }, [tokens, isSpeaking, prefs.ttsSpeed, prefs.ttsVolume]);

  const handleLogout = useCallback(async () => {
    const { createBrowserClient } = await import('@supabase/ssr');
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    );
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  }, []);

  const isLive   = appState === 'ready' || appState === 'detecting';
  const isActive = appState === 'detecting';

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { top: 1.25rem; opacity: 0 }
          8%   { opacity: 1 }
          92%  { opacity: 1 }
          100% { top: calc(100% - 5.5rem); opacity: 0 }
        }
        @keyframes entryIn {
          from { opacity: 0; transform: translateY(4px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .entry-enter { animation: entryIn 0.22s ease forwards; }
      `}</style>

      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <header
          role="banner"
          className="flex h-14 shrink-0 items-center justify-between border-b border-border/30 bg-background px-4 md:px-5"
        >
          <Logo size="sm" />

          <div className="flex items-center gap-2">
            {isActive && (
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-destructive/70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
            )}
            <h1 className="text-sm font-semibold tracking-[-0.01em]">
              {isActive ? 'Detecting' : 'Translate'}
            </h1>
            {isLive && (
              <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary md:inline-flex">
                Live
              </span>
            )}
            {!mpReady && (
              <span className="hidden rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning-foreground md:inline-flex">
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
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col overflow-hidden md:flex-row" style={{ minHeight: 0 }}>
          <div className="relative flex flex-col md:aspect-square md:h-full md:flex-none" style={{ minHeight: 0 }}>
            <WebcamCapture
              ref={webcamRef}
              state={appState}
              facingMode={facingMode}
              mpReady={mpReady}
              handsCount={hands.length}
              apiError={apiError}
              hasMultipleCameras={devices.length > 1}
              languageLabel={language}
              voiceEnabled={voiceEnabled}
              onRequestCamera={() => startCamera()}
              onStartDetection={startDetection}
              onStopDetection={stopDetection}
              onFlipCamera={flipCamera}
              onReset={handleReset}
            />
            {isActive && (
              <LandmarkOverlay
                hands={hands}
                mirrored={isMirrored}
                showBoundingBox
                showHandLabels
              />
            )}
            {isActive && handsIncomplete && (
              <div
                role="alert"
                className="absolute top-14 left-1/2 z-20 -translate-x-1/2 rounded-full bg-amber-500/90 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm whitespace-nowrap"
              >
                Keep both hands fully in frame
              </div>
            )}
          </div>

          <aside
            aria-label="Detection feedback"
            className="flex flex-col gap-4 overflow-y-auto border-t border-border/30 bg-background p-4 md:w-[420px] md:border-t-0 md:border-l"
          >
            <div className="flex items-center justify-between">
              <DetectionStatus state={toDetectionStatus(appState)} fps={fps} showFps />
            </div>

            <PredictionBadge
              letter={currentLetter}
              confidence={currentConfidence}
              isDetecting={isActive}
              hasHand={hands.length > 0}
              textScale={prefs.textScale}
            />

            {isActive && (currentLetter === 'J' || currentLetter === 'Z') && (
              <p className="text-center text-xs text-amber-500">
                {currentLetter} requires motion — hold the starting pose, then sign the movement.
              </p>
            )}

            <SentenceBuilder
              tokens={tokens}
              isSpeaking={isSpeaking}
              onDeleteLast={() => setTokens((prev) => prev.slice(0, -1))}
              onClearAll={() => setTokens([])}
              onSpeak={handleSpeak}
              isTtsError={isTtsError}
              textScale={prefs.textScale}
            />

            <PredictionDisplay
              transcript={transcript}
              appState={appState}
              onClearTranscript={() => setTranscript([])}
            />
          </aside>
        </main>
      </div>

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        onThemeChange={setTheme}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={(id) => { setSelectedDeviceId(id); startCamera(facingMode, id); }}
        isMirrored={isMirrored}
        onMirrorToggle={() => setIsMirrored((v) => !v)}
        highContrast={prefs.highContrast}
        onHighContrastToggle={() => prefs.setHighContrast(!prefs.highContrast)}
        textScale={prefs.textScale}
        onTextScaleChange={prefs.setTextScale}
        ttsSpeed={prefs.ttsSpeed}
        onTtsSpeedChange={prefs.setTtsSpeed}
        ttsVolume={prefs.ttsVolume}
        onTtsVolumeChange={prefs.setTtsVolume}
        onLogout={handleLogout}
      />
    </>
  );
}