"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Layers, Terminal } from "lucide-react";

import {
  WebcamCapture,
  PredictionDisplay,
  PredictionBadge,
  SentenceBuilder,
  type WebcamCaptureHandle,
  type CameraState,
  type TranscriptEntry,
} from "@/components/features/translation";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { captureFrame } from "@/lib/imagePreprocess";
import { predictFromBlob, type TranslateDetection } from "@/lib/translateApi";
import {
  createLetterAccumulatorState,
  reduceLetterAccumulator,
  type LetterAccumulatorConfig,
} from "@/lib/translateState";
import { appendHistoryEntry } from "@/lib/userData";
import PracticeGuide from "@/components/features/translation/PracticeGuide";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const MODEL_INIT_MS = 2400;
const IS_MOBILE = typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);
const DETECTION_INTERVAL = IS_MOBILE ? 300 : 200;
const VOTE_BUFFER_SIZE = 3;
const WEIGHTED_VOTE_THRESHOLD = 0.67;
const FAST_COMMIT_THRESHOLD = 0.92;
const RELEASE_FRAME_COUNT = 3;
const LETTER_ACCUMULATOR_CONFIG: LetterAccumulatorConfig = {
  voteBufferSize: VOTE_BUFFER_SIZE,
  weightedVoteThreshold: WEIGHTED_VOTE_THRESHOLD,
  fastCommitThreshold: FAST_COMMIT_THRESHOLD,
  releaseFrameCount: RELEASE_FRAME_COUNT,
};

type Language = "ASL" | "BISINDO";
type MobileTab = "hasil" | "kalimat" | "riwayat";

let _id = 0;
function uid() {
  return `entry-${Date.now()}-${++_id}`;
}

export default function TranslatePageContent() {
  const prefs = useAccessibilityPrefs();
  const [appState, setAppState] = useState<CameraState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [currentLetter, setCurrentLetter] = useState<string | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsError, setIsTtsError] = useState(false);
  const [fps, setFps] = useState(0);
  const [language] = useState<Language>("BISINDO");
  const [voiceEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [detections, setDetections] = useState<TranslateDetection[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("hasil");

  const webcamRef = useRef<WebcamCaptureHandle>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isBusy = useRef(false);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fpsCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const letterAccumulatorRef = useRef(createLetterAccumulatorState());

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

  useEffect(() => {
    captureCanvasRef.current = document.createElement("canvas");
    return () => {
      captureCanvasRef.current = null;
    };
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
    async (facing: "user" | "environment" = facingMode) => {
      setAppState("requesting");
      setApiError(false);
      stopStream();
      try {
        const videoConstraints: MediaTrackConstraints = {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        };
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
    letterAccumulatorRef.current = createLetterAccumulatorState();
    sessionIdRef.current = null;
  }, [stopStream]);

  const startDetection = useCallback(
    (force = false) => {
      if (!force && appState !== "ready") return;
      if (timerRef.current) clearInterval(timerRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      setAppState("detecting");
      setApiError(false);
      sessionIdRef.current =
        "sess-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      letterAccumulatorRef.current = createLetterAccumulatorState();

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
            const nextAccumulator = reduceLetterAccumulator(
              letterAccumulatorRef.current,
              { letter: null, confidence: null },
              LETTER_ACCUMULATOR_CONFIG
            );
            letterAccumulatorRef.current = nextAccumulator.state;
            return;
          }

          const topDetection = nextDetections.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
          );

          const predictedLetter = topDetection.class;
          const predictedConfidence = topDetection.confidence;

          setCurrentLetter(predictedLetter);
          setCurrentConfidence(predictedConfidence);

          const nextAccumulator = reduceLetterAccumulator(
            letterAccumulatorRef.current,
            { letter: predictedLetter, confidence: predictedConfidence },
            LETTER_ACCUMULATOR_CONFIG
          );
          letterAccumulatorRef.current = nextAccumulator.state;
          if (nextAccumulator.commit) {
            commitLetter(
              nextAccumulator.commit.letter,
              nextAccumulator.commit.confidence
            );
          }
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
    letterAccumulatorRef.current = createLetterAccumulatorState();
    sessionIdRef.current = null;
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

  const isActive = appState === "detecting";

  const TABS = [
    { key: "hasil" as MobileTab, label: "Hasil", icon: Terminal },
    { key: "kalimat" as MobileTab, label: "Kalimat", icon: Layers },
    { key: "riwayat" as MobileTab, label: "Riwayat", icon: Activity },
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cohere-canvas text-cohere-ink selection:bg-cohere-coral-soft selection:text-cohere-primary">
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row lg:divide-x lg:divide-cohere-hairline">
        {/* ═══════════════════════════════════════════════════════
            LEFT COLUMN: Kamera + Panduan
            Mobile: Full width
            Desktop: flex-[1.4]
            ═══════════════════════════════════════════════════════ */}
        <section className="relative flex min-h-0 flex-col overflow-hidden bg-cohere-stone lg:flex-[1.4]">
          <div className="flex flex-1 flex-col overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[960px] space-y-4 sm:space-y-5 md:space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-2 border-b border-cohere-hairline pb-3 sm:flex-row sm:items-end sm:justify-between sm:pb-4">
                <div className="min-w-0">
                  <h2 className="font-display text-xl leading-none text-cohere-ink sm:text-2xl md:text-[28px]">
                    Kamera
                  </h2>
                  <p className="mt-1.5 max-w-md text-xs leading-5 text-cohere-body-muted sm:mt-2 sm:text-sm sm:leading-6">
                    Arahkan tangan ke kamera. Hasilnya muncul di panel kanan.
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="mb-0.5 block text-[10px] text-cohere-slate sm:text-[11px]">
                    Kecepatan
                  </span>
                  <span className="text-lg tabular-nums text-cohere-ink sm:text-xl">
                    {fps}{" "}
                    <span className="text-[9px] opacity-40 sm:text-[10px]">FPS</span>
                  </span>
                </div>
              </div>

              {/* Webcam Container */}
              <div className="relative w-full overflow-hidden rounded-md border border-cohere-hairline bg-cohere-primary transition-colors duration-300 sm:rounded-lg lg:rounded-[22px]">
                <div className="aspect-square sm:aspect-video">
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
                    fps={fps}
                  />
                </div>

                {/* Confidence Overlay */}
                {isActive && currentConfidence !== null && (
                  <div className="absolute right-3 top-3 z-[35] sm:right-4 sm:top-4 md:right-5 md:top-5">
                    <div className="min-w-[112px] rounded-sm border border-white/15 bg-cohere-primary/70 px-2.5 py-1.5 text-cohere-canvas backdrop-blur-sm sm:min-w-[128px] sm:px-3 sm:py-2">
                      <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-2">
                        <span className="text-[10px] opacity-60 sm:text-[11px]">
                          Keyakinan
                        </span>
                        <span className="text-[11px] font-bold sm:text-xs">
                          {Math.round(currentConfidence * 100)}%
                        </span>
                      </div>
                      <div className="h-0.5 w-full overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-cohere-canvas transition-all duration-300"
                          style={{ width: `${currentConfidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Practice Guide */}
          <div className="px-3 pb-4 sm:px-4 sm:pb-6 md:px-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-[960px] border-t border-cohere-hairline pt-4 sm:pt-5 md:pt-6">
              <PracticeGuide />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            RIGHT COLUMN: Hasil + Kalimat + Riwayat
            Mobile: Tab-based navigation
            Desktop: All panels visible
            ═══════════════════════════════════════════════════════ */}
        <section className="flex min-h-0 flex-1 flex-col bg-cohere-canvas">
          {/* Mobile Tab Navigation */}
          <div className="flex shrink-0 border-b border-cohere-hairline bg-cohere-canvas lg:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMobileTab(tab.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 py-3 text-[11px] font-medium transition-colors",
                  mobileTab === tab.key
                    ? "border-b-2 border-cohere-ink text-cohere-ink"
                    : "text-cohere-slate hover:text-cohere-body-muted"
                )}
              >
                <tab.icon className="size-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ═══════ DESKTOP: All panels visible ═══════ */}
          <div className="hidden min-h-0 flex-1 flex-col lg:flex">
            {/* Hasil Saat Ini */}
            <div className="border-b border-cohere-hairline p-6 lg:p-8">
              <header className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="size-3.5 text-cohere-slate" />
                  <h3 className="text-mono-label text-[11px] text-cohere-slate">
                    Hasil saat ini
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <div className="size-1 bg-cohere-hairline" />
                  <div className="size-1 bg-cohere-hairline" />
                  <div className="size-1 bg-cohere-ink" />
                </div>
              </header>
              <div className="flex min-h-[150px] flex-col items-center justify-center">
                <PredictionBadge
                  letter={currentLetter}
                  confidence={currentConfidence}
                  isDetecting={isActive}
                  hasHand={detections.length > 0}
                  textScale={prefs.textScale}
                />
              </div>
            </div>

            {/* Susun Kalimat */}
            <div className="border-b border-cohere-hairline bg-cohere-stone/40 p-6 lg:p-8">
              <div className="mb-4 flex items-center gap-3">
                <Layers className="size-3.5 text-cohere-slate" />
                <span className="text-mono-label text-[11px] text-cohere-slate">
                  Susun kalimat
                </span>
                <div className="h-px flex-1 bg-cohere-hairline" />
              </div>
              {renderSentenceBuilder("panel")}
            </div>

            {/* Riwayat */}
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-cohere-hairline px-6 py-4 lg:px-8">
                <div className="flex items-center gap-3">
                  <Activity className="size-3.5 text-cohere-slate" />
                  <h3 className="text-mono-label text-[11px] text-cohere-slate">
                    Riwayat
                  </h3>
                </div>
                <button
                  onClick={() => setTranscript([])}
                  className="text-[11px] font-medium text-cohere-slate transition-colors hover:text-cohere-ink"
                >
                  Bersihkan
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <PredictionDisplay
                  transcript={transcript}
                  onSpeakEntry={handleSpeakEntry}
                />
              </div>
            </div>
          </div>

          {/* ═══════ MOBILE: Tab Content ═══════ */}
          <div className="flex min-h-0 flex-1 flex-col lg:hidden">
            {/* Tab: Hasil */}
            {mobileTab === "hasil" && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
                <div className="flex flex-1 flex-col items-center justify-center">
                  <PredictionBadge
                    letter={currentLetter}
                    confidence={currentConfidence}
                    isDetecting={isActive}
                    hasHand={detections.length > 0}
                    textScale={prefs.textScale}
                  />
                </div>
              </div>
            )}

            {/* Tab: Kalimat */}
            {mobileTab === "kalimat" && (
              <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Layers className="size-3.5 text-cohere-slate" />
                  <span className="text-mono-label text-[11px] text-cohere-slate">
                    Susun kalimat
                  </span>
                  <div className="h-px flex-1 bg-cohere-hairline" />
                </div>
                {renderSentenceBuilder("panel")}
              </div>
            )}

            {/* Tab: Riwayat */}
            {mobileTab === "riwayat" && (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-cohere-hairline px-4 py-3 sm:px-6">
                  <div className="flex items-center gap-3">
                    <Activity className="size-3.5 text-cohere-slate" />
                    <h3 className="text-mono-label text-[11px] text-cohere-slate">
                      Riwayat
                    </h3>
                  </div>
                  <button
                    onClick={() => setTranscript([])}
                    className="text-[11px] font-medium text-cohere-slate transition-colors hover:text-cohere-ink"
                  >
                    Bersihkan
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <PredictionDisplay
                    transcript={transcript}
                    onSpeakEntry={handleSpeakEntry}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Sticky Sentence Builder */}
      <div
        className={cn(
          "shrink-0 border-t border-cohere-hairline bg-cohere-canvas p-3 sm:p-4 lg:hidden",
          mobileTab === "hasil" && "hidden"
        )}
        style={{
          paddingBottom:
            "calc(12px + var(--workspace-mobile-nav-offset, 0px))",
        }}
      >
        {renderSentenceBuilder("sticky")}
      </div>
    </div>
  );
}