"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Layers, Terminal } from "lucide-react";
import { toast } from "sonner";

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
import { appendHistoryEntry, type AlphabetLetter } from "@/lib/userData";
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

function uid() {
  return crypto.randomUUID();
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
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<string | null>(null);
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

    const sessionId = sessionIdRef.current ?? crypto.randomUUID();
    const startedAt =
      sessionStartedAtRef.current ?? committedEntry.timestamp.toISOString();
    sessionIdRef.current = sessionId;
    sessionStartedAtRef.current = startedAt;

    void appendHistoryEntry({
      id: committedEntry.id,
      sessionId,
      letter: committedEntry.text as AlphabetLetter,
      confidence: committedEntry.confidence,
      committedAt: committedEntry.timestamp.toISOString(),
      startedAt,
      language: committedEntry.language as Language,
      commitMethod:
        confidence >= FAST_COMMIT_THRESHOLD ? "fast_commit" : "weighted_vote",
    }).catch(() => {
      toast.error("A translated letter could not be synced.", {
        id: "translation-sync-error",
      });
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
    isBusy.current = false;
    setAppState("idle");
    setTranscript([]);
    setTokens([]);
    setCurrentLetter(null);
    setCurrentConfidence(null);
    setIsSpeaking(false);
    setIsTtsError(false);
    setApiError(false);
    setDetections([]);
    letterAccumulatorRef.current = createLetterAccumulatorState();
    sessionIdRef.current = null;
    sessionStartedAtRef.current = null;
  }, [stopStream]);

  const startDetection = useCallback(
    (force = false) => {
      if (!force && appState !== "ready") return;
      if (timerRef.current) clearInterval(timerRef.current);
      setAppState("detecting");
      setApiError(false);
      sessionIdRef.current = crypto.randomUUID();
      sessionStartedAtRef.current = new Date().toISOString();
      letterAccumulatorRef.current = createLetterAccumulatorState();

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
    isBusy.current = false;
    setDetections([]);
    setCurrentLetter(null);
    setCurrentConfidence(null);
    letterAccumulatorRef.current = createLetterAccumulatorState();
    sessionIdRef.current = null;
    sessionStartedAtRef.current = null;
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

  const renderSentenceBuilder = (
    variant: "panel" | "sticky" = "panel",
    className?: string
  ) => (
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
      className={className}
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
      <main
        className="flex flex-1 flex-col overflow-y-auto lg:min-h-0 lg:flex-row lg:divide-x lg:divide-cohere-hairline lg:overflow-hidden"
        style={{ paddingBottom: "var(--workspace-mobile-nav-offset, 0px)" }}
      >
        {/* ═══════════════════════════════════════════════════════
            LEFT COLUMN: Kamera + Panduan
            Mobile: Full width
            Desktop: flex-[1.4]
            ═══════════════════════════════════════════════════════ */}
        <section className="relative flex shrink-0 flex-col bg-cohere-stone lg:min-h-0 lg:flex-[1.4] lg:overflow-hidden">
          <div className="flex flex-col p-2.5 sm:p-4 md:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:p-6">
            <div className="mx-auto w-full max-w-[960px] space-y-2.5 sm:space-y-3 lg:max-w-[min(820px,calc(100vh_-_184px))]">
              {/* Webcam Container */}
              <div className="relative w-full overflow-hidden rounded-md border border-cohere-hairline bg-cohere-primary transition-colors duration-300 sm:rounded-lg lg:rounded-[22px]">
                <div className="aspect-square sm:aspect-[4/3] md:aspect-[16/10] lg:aspect-square">
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
          <div className="px-2.5 pb-3 sm:px-4 sm:pb-4 md:px-5 lg:px-6 lg:pb-6">
            <div className="mx-auto w-full max-w-[960px] border-t border-cohere-hairline pt-2.5 sm:pt-3 lg:max-w-[min(820px,calc(100vh_-_184px))]">
              <PracticeGuide />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            RIGHT COLUMN: Hasil + Kalimat + Riwayat
            Mobile: Tab-based navigation
            Desktop: All panels visible
            ═══════════════════════════════════════════════════════ */}
        <section className="flex shrink-0 flex-col bg-cohere-canvas lg:min-h-0 lg:flex-1">
          {/* Mobile Tab Navigation */}
          <div className="sticky top-0 z-20 flex shrink-0 border-b border-cohere-hairline bg-cohere-canvas lg:hidden">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                aria-current={mobileTab === tab.key ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors sm:flex-row sm:gap-1.5 sm:py-3 sm:text-[11px]",
                  mobileTab === tab.key
                    ? "border-b-2 border-cohere-ink text-cohere-ink"
                    : "text-cohere-slate hover:text-cohere-body-muted"
                )}
              >
                <tab.icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ═══════ DESKTOP: All panels visible ═══════ */}
          <div className="hidden min-h-0 flex-1 flex-col lg:flex">
            {/* Hasil Saat Ini */}
            <div className="border-b border-cohere-hairline p-5 lg:p-6">
              <div className="flex min-h-[132px] flex-col items-center justify-center">
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
            <div className="border-b border-cohere-hairline bg-cohere-stone/40 p-5 lg:p-6">
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
              <div className="flex items-center justify-between border-b border-cohere-hairline px-5 py-4 lg:px-6">
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
          <div className="lg:hidden">
            {/* Tab: Hasil */}
            {mobileTab === "hasil" && (
              <div className="p-3 sm:p-4 md:p-5">
                <div className="flex min-h-[148px] flex-col items-center justify-center sm:min-h-[172px]">
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
              <div className="p-3 sm:p-4 md:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Layers className="size-3.5 text-cohere-slate" />
                  <span className="text-mono-label text-[11px] text-cohere-slate">
                    Susun kalimat
                  </span>
                  <div className="h-px flex-1 bg-cohere-hairline" />
                </div>
                {renderSentenceBuilder("panel", "rounded-md")}
              </div>
            )}

            {/* Tab: Riwayat */}
            {mobileTab === "riwayat" && (
              <div className="flex min-h-[240px] flex-col">
                <div className="flex items-center justify-between border-b border-cohere-hairline px-3 py-3 sm:px-4 md:px-5">
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
                <div className="min-h-[220px] flex-1 overflow-y-auto">
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
    </div>
  );
}
