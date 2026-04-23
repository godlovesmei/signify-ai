'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

import {
  WebcamCapture,
  PredictionDisplay,
  PredictionBadge,
  SentenceBuilder,
  DetectionStatus,
  type WebcamCaptureHandle,
  type CameraState,
  type TranscriptEntry,
} from '@/components/features/translation';
import SettingsDrawer, { type MediaDeviceOption } from '@/components/layout/SettingsDrawer';
import MobileBottomNav from '@/components/layout/mobile-nav/MobileBottomNav';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useTheme } from '@/hooks/useTheme';
import { captureFrame } from '@/lib/imagePreprocess';
import { predictFromBlob, type TranslateDetection } from '@/lib/translateApi';
import { mapCameraStateToDetectionStatus } from '@/lib/translateState';
import { appendHistoryEntry } from '@/lib/userData';
import PracticeGuide from '@/components/features/translation/PracticeGuide';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';


const API_BASE_URL       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const MODEL_INIT_MS      = 2400;
const IS_MOBILE          = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
const DETECTION_INTERVAL = IS_MOBILE ? 300 : 200; // faster cadence for lower commit latency
const VOTE_BUFFER_SIZE   = 3;     // shorter fallback window for mid-confidence predictions
const WEIGHTED_VOTE_THRESHOLD = 0.67; // ~2/3 weighted quorum
const FAST_COMMIT_THRESHOLD = 0.92; // single-frame fast commit when highly confident
const SAME_LETTER_COOLDOWN_MS = 900; // suppress rapid duplicate commits of the same letter
type Language = 'ASL' | 'BISINDO';
type VoteEntry = { letter: string; confidence: number };

let _id = 0;
function uid() { return `entry-${Date.now()}-${++_id}`; }

export default function TranslatePageContent() {
  const prefs = useAccessibilityPrefs();
  const { theme, setTheme } = useTheme();
  const [appState, setAppState]                   = useState<CameraState>('idle');
  const [sessionStart, setSessionStart]           = useState<Date | null>(null);
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
  const [detections, setDetections]               = useState<TranslateDetection[]>([]);

  const webcamRef      = useRef<WebcamCaptureHandle>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const timerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy         = useRef(false);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCountRef    = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef   = useRef<string | null>(null);
  const lastCommittedRef = useRef<{ letter: string | null; at: number }>({ letter: null, at: 0 });

  const languageRef     = useRef(language);
  const voiceEnabledRef = useRef(voiceEnabled);
  const accessTokenRef  = useRef<string | null>(null);

  useEffect(() => { languageRef.current     = language;     }, [language]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  useEffect(() => {
    const supabase = createSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      accessTokenRef.current = data.session?.access_token ?? null;
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      accessTokenRef.current = session?.access_token ?? null;
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const commitLetter = useCallback((letter: string, confidence: number) => {
    const committedEntry: TranscriptEntry = {
      id: uid(),
      text: letter,
      confidence,
      timestamp: new Date(),
      language: languageRef.current,
    };

    setTokens((prev) => [...prev, letter]);
    setTranscript((prev) => [
      ...prev.slice(-49),
      committedEntry,
    ]);

    appendHistoryEntry({
      id: committedEntry.id,
      sessionId: sessionIdRef.current ?? 'sess-' + Date.now(),
      text: committedEntry.text,
      confidence: committedEntry.confidence,
      timestamp: committedEntry.timestamp.toISOString(),
      language: committedEntry.language,
    });

    if (voiceEnabledRef.current && 'speechSynthesis' in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(letter);
      u.lang  = 'id-ID';
      u.rate  = 0.95;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, []);

  // ── Sliding window vote ─────────────────────────────────────────────────────
  const voteBuffer = useRef<VoteEntry[]>([]);

  useEffect(() => {
    captureCanvasRef.current = document.createElement('canvas');
    return () => {
      captureCanvasRef.current = null;
    };
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

  // ── Page Visibility API ──────────────────────────────────────────────────
  // Pause the detection loop when the tab is hidden to save CPU/GPU on mobile.
  // If detection was active before hide, it resumes when tab becomes visible.
  const wasDetectingRef = useRef(false);
  const resumeAfterVisibilityRef = useRef(false);
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && appState === 'detecting') {
        wasDetectingRef.current = true;
        if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
        if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
      } else if (!document.hidden && wasDetectingRef.current) {
        wasDetectingRef.current = false;
        resumeAfterVisibilityRef.current = true;
        setAppState('ready');
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [appState]);

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
          width: { ideal: 640 },
          height: { ideal: 480 },
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
    setFps(0); setApiError(false); setDetections([]);
    setSessionStart(null);
    voteBuffer.current = [];
    sessionIdRef.current = null;
    lastCommittedRef.current = { letter: null, at: 0 };
  }, [stopStream]);

  const startDetection = useCallback((force = false) => {
    if (!force && appState !== 'ready') return;
    if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
    if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
    setAppState('detecting');
    setApiError(false);
    setSessionStart(new Date());
    sessionIdRef.current = 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

    fpsCountRef.current = 0;
    fpsIntervalRef.current = setInterval(() => {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
    }, 1000);

    timerRef.current = setInterval(async () => {
      if (isBusy.current) return;
      const video = webcamRef.current?.videoElement;
      const canvas = captureCanvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState < 2) return;

      isBusy.current = true;
      try {
        const frameBlob = await captureFrame(video, canvas, 640);
        if (frameBlob === null) return;

        let accessToken = accessTokenRef.current ?? undefined;
        if (!accessToken) {
          const { data } = await createSupabaseClient().auth.getSession();
          accessToken = data.session?.access_token ?? undefined;
          accessTokenRef.current = accessToken ?? null;
        }

        const yoloResult = await predictFromBlob(frameBlob, {
          baseUrl: API_BASE_URL,
          accessToken,
        });

        if (yoloResult === null) {
          setApiError(true);
          setDetections([]);
          return;
        }

        setApiError(false);
        fpsCountRef.current += 1;

        const nextDetections = yoloResult.detections ?? [];
        setDetections(nextDetections);

        if (nextDetections.length === 0) {
          setCurrentLetter(null); setCurrentConfidence(null);
          voteBuffer.current = [];
          lastCommittedRef.current = { letter: null, at: 0 };
          return;
        }

        const topDetection = nextDetections.reduce((best, current) =>
          current.confidence > best.confidence ? current : best,
        );

        const predictedLetter = topDetection.class;
        const predictedConfidence = topDetection.confidence;

        setCurrentLetter(predictedLetter);
        setCurrentConfidence(predictedConfidence);

        const now = Date.now();
        const canFastCommit = !(
          lastCommittedRef.current.letter === predictedLetter &&
          now - lastCommittedRef.current.at < SAME_LETTER_COOLDOWN_MS
        );

        // Fast-path: immediately commit highly confident predictions.
        if (predictedConfidence >= FAST_COMMIT_THRESHOLD) {
          if (canFastCommit) {
            commitLetter(predictedLetter, predictedConfidence);
            lastCommittedRef.current = { letter: predictedLetter, at: now };
            voteBuffer.current = [];
          }
          return;
        }

        // ── Confidence-weighted vote ───────────────────────────────────
        // Each frame contributes weight=confidence^2, so uncertain frames
        // have much less influence than stable high-confidence frames.
        voteBuffer.current.push({ letter: predictedLetter, confidence: predictedConfidence });
        if (voteBuffer.current.length > VOTE_BUFFER_SIZE) voteBuffer.current.shift();
        if (voteBuffer.current.length < VOTE_BUFFER_SIZE) return;

        const scores: Record<string, number> = {};
        const confidencesByLetter: Record<string, number[]> = {};
        for (const entry of voteBuffer.current) {
          const weight = Math.pow(entry.confidence, 2);
          scores[entry.letter] = (scores[entry.letter] ?? 0) + weight;
          (confidencesByLetter[entry.letter] ??= []).push(entry.confidence);
        }

        const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return;

        const [winner, winnerWeight] = sorted[0];
        const totalWeight = Object.values(scores).reduce((a, b) => a + b, 0);
        if (totalWeight <= 0) return;
        if (winnerWeight / totalWeight < WEIGHTED_VOTE_THRESHOLD) return;

        const winnerConf = confidencesByLetter[winner] ?? [predictedConfidence];
        const committedConfidence = winnerConf.reduce((a, b) => a + b, 0) / winnerConf.length;

        const canVoteCommit = !(
          lastCommittedRef.current.letter === winner &&
          now - lastCommittedRef.current.at < SAME_LETTER_COOLDOWN_MS
        );
        if (!canVoteCommit) return;

        voteBuffer.current = []; // reset after commit so the same letter isn't repeated immediately
        commitLetter(winner, committedConfidence);
        lastCommittedRef.current = { letter: winner, at: now };
      } finally { isBusy.current = false; }
    }, DETECTION_INTERVAL);
  }, [appState, commitLetter]);

  useEffect(() => {
    if (appState !== 'ready' || !resumeAfterVisibilityRef.current) return;
    resumeAfterVisibilityRef.current = false;
    const timeoutId = setTimeout(() => startDetection(true), 300);
    return () => clearTimeout(timeoutId);
  }, [appState, startDetection]);

  const stopDetection = useCallback(() => {
    if (timerRef.current)       { clearInterval(timerRef.current);       timerRef.current = null; }
    if (fpsIntervalRef.current) { clearInterval(fpsIntervalRef.current); fpsIntervalRef.current = null; }
    isBusy.current = false; fpsCountRef.current = 0;
    setDetections([]); setCurrentLetter(null); setCurrentConfidence(null); setFps(0);
    voteBuffer.current = [];
    sessionIdRef.current = null;
    lastCommittedRef.current = { letter: null, at: 0 };
    if (appState === 'detecting') setAppState('ready');
  }, [appState]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    setIsMirrored(next === 'user');
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

  const handleSpeakEntry = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsTtsError(false);
    const u = new SpeechSynthesisUtterance(text);
    u.lang    = 'id-ID';
    u.rate    = prefs.ttsSpeed;
    u.volume  = prefs.ttsVolume;
    u.onend   = () => setIsSpeaking(false);
    u.onerror = () => { setIsSpeaking(false); setIsTtsError(true); };
    window.speechSynthesis.speak(u);
  }, [prefs.ttsSpeed, prefs.ttsVolume]);

  const handleLogout = useCallback(async () => {
    const supabase = createSupabaseClient();
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

      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground [--workspace-mobile-nav-offset:calc(70px+env(safe-area-inset-bottom,0px)+2px)] md:[--workspace-mobile-nav-offset:0px]">
        <header
          role="banner"
          className="flex h-14 shrink-0 items-center justify-between border-b border-border/30 bg-background px-4 md:px-5"
        >
          <Logo size="sm" />

          <div className="flex items-center gap-2">
            {isActive && (
              <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success/70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
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

        {/*
          2-column grid:
            Col 1 — Camera        (~65%)
            Col 2 — Sidebar       (~35%): Translation + Transcript stacked
          On mobile: stacks vertically.
        */}
        <main
          className="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          style={{ minHeight: 0, height: 'calc(100dvh - 56px - var(--workspace-mobile-nav-offset, 0px))' }} // 56px = h-14 header
        >
          {/* ── Col 1: Camera ───────────────────────────────────────────── */}
          <div
            className="relative flex h-[38svh] min-h-[220px] flex-col overflow-hidden border-b border-border/30 bg-gradient-to-br from-background via-muted/40 to-background p-2.5 sm:h-[42svh] sm:min-h-[250px] sm:p-3 md:h-full md:border-b-0 md:border-r md:p-6"
            style={{ minHeight: 0 }}
          >
            <div
              className="relative flex-1 w-full max-w-5xl mx-auto rounded-3xl border border-border/40 bg-card/40 shadow-[0_25px_70px_-35px_rgba(0,0,0,0.65)] overflow-hidden backdrop-blur-md"
              style={{ minHeight: 0 }}
            >
              <WebcamCapture
                ref={webcamRef}
                state={appState}
                isMirrored={isMirrored}
                detections={detections}
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
            </div>
          </div>

          {/* ── Col 2: Sidebar (Translation + Transcript) ───────────────── */}
          <div className="flex h-full flex-col overflow-y-auto" style={{ minHeight: 0 }}>
            {/* Translation panel */}
            <div
              aria-label="Real-time translation"
              className="shrink-0 flex flex-col gap-4 border-b border-border/30 bg-card/20 p-4"
            >
              <DetectionStatus state={mapCameraStateToDetectionStatus(appState)} fps={fps} showFps />

              <PredictionBadge
                letter={currentLetter}
                confidence={currentConfidence}
                isDetecting={isActive}
                hasHand={detections.length > 0}
                textScale={prefs.textScale}
              />

              {/* Flow indicator */}
              <div className="flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/35">
                  builds into
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              <SentenceBuilder
                tokens={tokens}
                isSpeaking={isSpeaking}
                onDeleteLast={() => setTokens((prev) => prev.slice(0, -1))}
                onClearAll={() => setTokens([])}
                onSpeak={handleSpeak}
                onAddSpace={() => setTokens((prev) => [...prev, ' '])}
                isTtsError={isTtsError}
                textScale={prefs.textScale}
              />
            </div>

            {/* Practice guide */}
            <div className="shrink-0 border-b border-border/30 bg-card/10 p-4">
              <PracticeGuide />
            </div>

            {/* Transcript fills remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <PredictionDisplay
                transcript={transcript}
                appState={appState}
                onClearTranscript={() => setTranscript([])}
                sessionStart={sessionStart}
                onSpeakEntry={handleSpeakEntry}
              />
            </div>
          </div>
        </main>
        <MobileBottomNav reserveSpace={false} />
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

