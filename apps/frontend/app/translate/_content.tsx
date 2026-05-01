"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";

import {
  WebcamCapture,
  PredictionDisplay,
  PredictionBadge,
  SentenceBuilder,
  DetectionStatus,
  type WebcamCaptureHandle,
  type CameraState,
  type TranscriptEntry,
} from "@/components/features/translation";
import SettingsDrawer, { type MediaDeviceOption } from "@/components/layout/SettingsDrawer";
import MobileBottomNav from "@/components/layout/mobile-nav/MobileBottomNav";
import WorkspaceTopNav from "@/components/layout/WorkspaceTopNav";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useTheme } from "@/hooks/useTheme";
import { captureFrame } from "@/lib/imagePreprocess";
import { predictFromBlob, type TranslateDetection } from "@/lib/translateApi";
import { mapCameraStateToDetectionStatus } from "@/lib/translateState";
import { appendHistoryEntry } from "@/lib/userData";
import PracticeGuide from "@/components/features/translation/PracticeGuide";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MODEL_INIT_MS = 2400;
const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
const DETECTION_INTERVAL = IS_MOBILE ? 300 : 200;
const VOTE_BUFFER_SIZE = 3;
const WEIGHTED_VOTE_THRESHOLD = 0.67;
const FAST_COMMIT_THRESHOLD = 0.92;
const SAME_LETTER_COOLDOWN_MS = 900;

type Language = "ASL" | "BISINDO";
type VoteEntry = { letter: string; confidence: number };

let _id = 0;
function uid() {
  return `entry-${Date.now()}-${++_id}`;
}

export default function TranslatePageContent() {
  const prefs = useAccessibilityPrefs();
  const { theme, setTheme } = useTheme();
  const [appState, setAppState] = useState<CameraState>("idle");
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsError, setIsTtsError] = useState(false);
  const [fps, setFps] = useState(0);
  const [language] = useState<Language>("BISINDO");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [apiError, setApiError] = useState(false);
  const [detections, setDetections] = useState<TranslateDetection[]>([]);

  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy = useRef(false);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastCommittedRef = useRef<{ letter: string | null; at: number }>({
    letter: null,
    at: 0,
  });

  const languageRef = useRef(language);
  const voiceEnabledRef = useRef(voiceEnabled);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

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
    setTranscript((prev) => [...prev.slice(-49), committedEntry]);

    appendHistoryEntry({
      id: committedEntry.id,
      sessionId: sessionIdRef.current ?? "sess-" + Date.now(),
      text: committedEntry.text,
      confidence: committedEntry.confidence,
      timestamp: committedEntry.timestamp.toISOString(),
      language: committedEntry.language,
    });

    if (voiceEnabledRef.current && "speechSynthesis" in window) {
      setIsSpeaking(true);
      const u = new SpeechSynthesisUtterance(letter);
      u.lang = "id-ID";
      u.rate = 0.95;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    }
  }, []);

  const voteBuffer = useRef<VoteEntry[]>([]);

  useEffect(() => {
    captureCanvasRef.current = document.createElement("canvas");
    return () => {
      captureCanvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((d) => {
        const videoInputs = d.filter((x) => x.kind === "videoinput");
        setDevices(videoInputs.map((x) => ({ deviceId: x.deviceId, label: x.label })));
        if (videoInputs.length > 0) setSelectedDeviceId(videoInputs[0].deviceId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasDetectingRef = useRef(false);
  const resumeAfterVisibilityRef = useRef(false);
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && appState === "detecting") {
        wasDetectingRef.current = true;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (fpsIntervalRef.current) {
          clearInterval(fpsIntervalRef.current);
          fpsIntervalRef.current = null;
        }
      } else if (!document.hidden && wasDetectingRef.current) {
        wasDetectingRef.current = false;
        resumeAfterVisibilityRef.current = true;
        setAppState("ready");
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [appState]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = webcamRef.current?.videoElement;
    if (video) video.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (facing: "user" | "environment" = facingMode, deviceId?: string) => {
      setAppState("requesting");
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
          video: videoConstraints,
          audio: false,
        });
        streamRef.current = stream;
        const video = webcamRef.current?.videoElement;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setAppState("loading");
        setTimeout(() => setAppState("ready"), MODEL_INIT_MS);
      } catch (err: unknown) {
        const e = err as { name?: string };
        setAppState(
          e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError"
            ? "error-permission"
            : "error-device"
        );
      }
    },
    [facingMode, stopStream]
  );

  const handleReset = useCallback(() => {
    stopStream();
    if (timerRef.current) clearInterval(timerRef.current);
    if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    isBusy.current = false;
    fpsCountRef.current = 0;
    setAppState("idle");
    setTranscript([]);
    setTokens([]);
    setCurrentLetter(null);
    setCurrentConfidence(null);
    setIsSpeaking(false);
    setIsTtsError(false);
    setFps(0);
    setApiError(false);
    setDetections([]);
    setSessionStart(null);
    voteBuffer.current = [];
    sessionIdRef.current = null;
    lastCommittedRef.current = { letter: null, at: 0 };
  }, [stopStream]);

  const startDetection = useCallback(
    (force = false) => {
      if (!force && appState !== "ready") return;
      if (timerRef.current) clearInterval(timerRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      setAppState("detecting");
      setApiError(false);
      setSessionStart(new Date());
      sessionIdRef.current =
        "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

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
            setCurrentLetter(null);
            setCurrentConfidence(null);
            voteBuffer.current = [];
            lastCommittedRef.current = { letter: null, at: 0 };
            return;
          }

          const topDetection = nextDetections.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
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

          if (predictedConfidence >= FAST_COMMIT_THRESHOLD) {
            if (canFastCommit) {
              commitLetter(predictedLetter, predictedConfidence);
              lastCommittedRef.current = { letter: predictedLetter, at: now };
              voteBuffer.current = [];
            }
            return;
          }

          voteBuffer.current.push({
            letter: predictedLetter,
            confidence: predictedConfidence,
          });
          if (voteBuffer.current.length > VOTE_BUFFER_SIZE)
            voteBuffer.current.shift();
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
          const committedConfidence =
            winnerConf.reduce((a, b) => a + b, 0) / winnerConf.length;

          const canVoteCommit = !(
            lastCommittedRef.current.letter === winner &&
            now - lastCommittedRef.current.at < SAME_LETTER_COOLDOWN_MS
          );
          if (!canVoteCommit) return;

          voteBuffer.current = [];
          commitLetter(winner, committedConfidence);
          lastCommittedRef.current = { letter: winner, at: now };
        } finally {
          isBusy.current = false;
        }
      }, DETECTION_INTERVAL);
    },
    [appState, commitLetter]
  );

  useEffect(() => {
    if (appState !== "ready" || !resumeAfterVisibilityRef.current) return;
    resumeAfterVisibilityRef.current = false;
    const timeoutId = setTimeout(() => startDetection(true), 300);
    return () => clearTimeout(timeoutId);
  }, [appState, startDetection]);

  const stopDetection = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
    isBusy.current = false;
    fpsCountRef.current = 0;
    setDetections([]);
    setCurrentLetter(null);
    setCurrentConfidence(null);
    setFps(0);
    voteBuffer.current = [];
    sessionIdRef.current = null;
    lastCommittedRef.current = { letter: null, at: 0 };
    if (appState === "detecting") setAppState("ready");
  }, [appState]);

  const flipCamera = useCallback(() => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    setIsMirrored(next === "user");
    stopDetection();
    startCamera(next);
  }, [facingMode, stopDetection, startCamera]);

  const handleSpeak = useCallback(() => {
    const sentence = tokens.join("");
    if (!sentence.trim() || isSpeaking) return;
    if (!("speechSynthesis" in window)) {
      setIsTtsError(true);
      return;
    }
    setIsTtsError(false);
    setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(sentence);
    u.lang = "id-ID";
    u.rate = prefs.ttsSpeed;
    u.volume = prefs.ttsVolume;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => {
      setIsSpeaking(false);
      setIsTtsError(true);
    };
    window.speechSynthesis.speak(u);
  }, [tokens, isSpeaking, prefs.ttsSpeed, prefs.ttsVolume]);

  const handleSpeakEntry = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      setIsSpeaking(true);
      setIsTtsError(false);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = prefs.ttsSpeed;
      u.volume = prefs.ttsVolume;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => {
        setIsSpeaking(false);
        setIsTtsError(true);
      };
      window.speechSynthesis.speak(u);
    },
    [prefs.ttsSpeed, prefs.ttsVolume]
  );

  const handleLogout = useCallback(async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  const renderSentenceBuilder = (variant: "panel" | "sticky" = "panel") => (
    <SentenceBuilder
      tokens={tokens}
      isSpeaking={isSpeaking}
      onDeleteLast={() => setTokens((prev) => prev.slice(0, -1))}
      onClearAll={() => setTokens([])}
      onSpeak={handleSpeak}
      onAddSpace={() => setTokens((prev) => [...prev, " "])}
      isTtsError={isTtsError}
      textScale={prefs.textScale}
      variant={variant}
    />
  );

  const isLive = appState === "ready" || appState === "detecting";
  const isActive = appState === "detecting";
  const topNavActions =
    isActive || isLive ? (
      <div className="flex items-center gap-1.5">
        {isActive && <span className="badge-live">Live</span>}
        {isLive && (
          <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline-flex">
            {language}
          </span>
        )}
      </div>
    ) : undefined;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <WorkspaceTopNav
          onPreferencesClick={() => setShowSettings(true)}
          actions={topNavActions}
        />

        {/* ═══════════════════════════════════════════════════════════════
            MAIN — Translate grid
            ═══════════════════════════════════════════════════════════════ */}
        <main className="translate-grid workspace-height">
          {/* ── Camera Workspace ─────────────────────────────────────── */}
          <section className="camera-workspace p-3 pb-2 md:p-5">
            <div className="translate-camera-shell relative w-full max-w-5xl mx-auto rounded-2xl md:rounded-3xl overflow-hidden border border-border/80 dark:border-white/10 shadow-depth-4 bg-card/95 dark:bg-black/40">
              {/* Scanline */}
              {isActive && (
                <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan z-20 pointer-events-none" />
              )}

              {/* Reticle Corners */}
              <div
                className={[
                  "absolute inset-0 pointer-events-none z-10 transition-all duration-500",
                  isActive ? "opacity-100" : "opacity-0",
                ].join(" ")}
              >
                <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-lg transition-all duration-300" />
                <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-lg transition-all duration-300" />
                <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-lg transition-all duration-300" />
                <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-lg transition-all duration-300" />
              </div>

              {/* Detection Badge */}
              <div
                className={[
                  "absolute top-5 left-5 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[11px] font-mono uppercase tracking-wider transition-all duration-500",
                  isActive && detections.length > 0
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2",
                ].join(" ")}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Hand Detected
              </div>

              {/* Confidence Ring (bottom-center) */}
              <div
                className={[
                  "pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500",
                  isActive && currentConfidence !== null
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-90",
                ].join(" ")}
              >
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={
                        (currentConfidence ?? 0) > 0.85
                          ? "#10b981"
                          : (currentConfidence ?? 0) > 0.6
                          ? "#06b6d4"
                          : "#8b5cf6"
                      }
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      strokeDashoffset={
                        264 - (264 * (currentConfidence ?? 0))
                      }
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white tabular-nums">
                      {currentConfidence !== null
                        ? Math.round(currentConfidence * 100) + "%"
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* FPS Counter (bottom-left) */}
              <div className="absolute bottom-5 left-5 z-30 flex items-center gap-2 px-2.5 py-1 rounded-lg glass text-[10px] font-mono text-muted-foreground">
                <Zap className="w-3 h-3 text-warning" />
                <span className="tabular-nums">{fps} FPS</span>
              </div>

              {/* Webcam */}
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
          </section>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <section className="translate-results-panel flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border/70 dark:border-white/5 md:border-t-0 md:border-l">
            {/* Real-time Detection */}
            <div className="shrink-0 flex flex-col gap-4 border-b border-border/70 dark:border-white/5 p-4 md:p-5">
              <div className="rounded-2xl border border-border/80 bg-card/70 p-3 dark:border-white/10 dark:bg-white/[0.03] md:p-4">
                <div className="mb-4 flex items-center justify-end">
                  <div className="flex items-center gap-2">
                    <div
                      className="relative flex h-2.5 w-2.5"
                      aria-hidden="true"
                    >
                      {(appState === "detecting" ||
                        appState === "loading" ||
                        appState === "requesting") && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
                      )}
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex h-4 items-end gap-0.5">
                      {[0, 0.1, 0.2, 0.3, 0.4].map((delay) => (
                        <div
                          key={delay}
                          className={[
                            "w-0.5 rounded-full bg-primary/60",
                            isActive ? "animate-wave-bar" : "h-1 opacity-40",
                          ].join(" ")}
                          style={{
                            animationDelay: `${delay}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <DetectionStatus
                    state={mapCameraStateToDetectionStatus(appState)}
                    fps={fps}
                    showFps={false}
                  />

                  <PredictionBadge
                    letter={currentLetter}
                    confidence={currentConfidence}
                    isDetecting={isActive}
                    hasHand={detections.length > 0}
                    textScale={prefs.textScale}
                  />
                </div>
              </div>

              {/* Flow indicator */}
              <div className="hidden items-center gap-3 md:flex" aria-hidden="true">
                <div className="h-px flex-1 bg-border/80 dark:bg-white/5" />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/45">
                  builds into
                </span>
                <div className="h-px flex-1 bg-border/80 dark:bg-white/5" />
              </div>

              <div className="hidden md:block">
                {renderSentenceBuilder("panel")}
              </div>
            </div>

            {/* Practice Guide */}
            <div className="shrink-0 border-b border-border/70 dark:border-white/5 p-5">
              <PracticeGuide />
            </div>

            {/* Transcript */}
            <div className="flex-1 min-h-[18rem] overflow-hidden">
              <PredictionDisplay
                transcript={transcript}
                appState={appState}
                onClearTranscript={() => setTranscript([])}
                sessionStart={sessionStart}
                onSpeakEntry={handleSpeakEntry}
              />
            </div>
          </section>
        </main>

        <div className="translate-sticky-sentence md:hidden">
          {renderSentenceBuilder("sticky")}
        </div>

        <MobileBottomNav reserveSpace={false} />
        <SettingsDrawer
          open={showSettings}
          onClose={() => setShowSettings(false)}
          theme={theme}
          onThemeChange={setTheme}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={(id) => {
            setSelectedDeviceId(id);
            startCamera(facingMode, id);
          }}
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
          voiceEnabled={voiceEnabled}
          onVoiceEnabledChange={setVoiceEnabled}
          onLogout={handleLogout}
        />
      </div>
  );
}
