"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Zap, Activity, Terminal, Layers } from "lucide-react";

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
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { captureFrame } from "@/lib/imagePreprocess";
import { predictFromBlob, type TranslateDetection } from "@/lib/translateApi";
import {
  createLetterAccumulatorState,
  mapCameraStateToDetectionStatus,
  reduceLetterAccumulator,
  type LetterAccumulatorConfig,
} from "@/lib/translateState";
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
const RELEASE_FRAME_COUNT = 3;
const LETTER_ACCUMULATOR_CONFIG: LetterAccumulatorConfig = {
  voteBufferSize: VOTE_BUFFER_SIZE,
  weightedVoteThreshold: WEIGHTED_VOTE_THRESHOLD,
  fastCommitThreshold: FAST_COMMIT_THRESHOLD,
  releaseFrameCount: RELEASE_FRAME_COUNT,
};

type Language = "ASL" | "BISINDO";

let _id = 0;
function uid() {
  return `entry-${Date.now()}-${++_id}`;
}

/**
 * Technical Status Value component for the Cohere system.
 */
function StatusValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5 border-l border-[#d9d9dd] pl-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#75758a] leading-none text-nowrap">{label}</p>
      <p className="text-[12px] font-medium text-[#17171c] tracking-tight truncate">{value}</p>
    </div>
  );
}

export default function TranslatePageContent() {
  const prefs = useAccessibilityPrefs();
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
  const [voiceEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);
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
    setSessionStart(null);
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
      setSessionStart(new Date());
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

  const isLive = appState === "ready" || appState === "detecting";
  const isActive = appState === "detecting";

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden selection:bg-[#ffad9b] selection:text-[#17171c]">
      {/* 
        Top Navigation / Technical Header 
        High editorial space, minimal distractions. 
      */}
      <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#d9d9dd] px-8 bg-white z-50">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#75758a] leading-none mb-1.5">
              Protocol // Signify_AI
            </span>
            <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[#17171c] font-medium">
              BISINDO_INTERPRETER_V3.0_PROD
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-6 border-l border-[#d9d9dd] pl-12">
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#75758a]">Active_Engine</p>
              <p className="text-[13px] font-medium text-[#17171c]">YOLOv11_Direct_RGB</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#75758a]">Language</p>
              <p className="text-[13px] font-medium text-[#17171c]">{language}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3 px-4 py-2 bg-[#eeece7] rounded-sm border border-[#d9d9dd]">
              <div className={`size-1.5 rounded-full ${isActive ? 'bg-[#003c33] shadow-[0_0_8px_rgba(0,60,51,0.4)]' : 'bg-[#93939f]'}`} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#17171c]">
                {isActive ? 'Live_Transmission' : 'Standby_Mode'}
              </span>
           </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 divide-x divide-[#d9d9dd]">
        {/* Visual Stream Column */}
        <section className="flex-[1.4] relative flex flex-col bg-[#eeece7] overflow-hidden">
          <div className="flex-1 flex flex-col p-8 md:p-10 overflow-y-auto">
            <div className="max-w-[1000px] w-full mx-auto space-y-8">
              <div className="flex items-baseline justify-between border-b border-[#d9d9dd] pb-6">
                <div>
                  <h2 className="text-[32px] tracking-tight text-[#17171c] font-normal leading-none font-unica">Vision Interface</h2>
                  <p className="text-[15px] text-[#616161] mt-2 max-w-md font-unica">Neural interpretation of manual gestural sequences in real-time environment.</p>
                </div>
                <div className="text-right font-mono">
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-[#75758a] mb-1">Inference_Rate</span>
                  <span className="text-xl tabular-nums text-[#17171c]">{fps} <span className="text-[10px] opacity-40">FPS</span></span>
                </div>
              </div>

              {/* The Media Interface */}
              <div className="relative aspect-video w-full rounded-md overflow-hidden bg-black border border-[#d9d9dd] shadow-2xl transition-all duration-700">
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
                
                {/* Minimal HUD overlay for Confidence which is critical for interpretation */}
                {isActive && currentConfidence !== null && (
                  <div className="absolute top-8 right-8 z-[35]">
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-3 rounded-sm font-mono text-white min-w-[140px]">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] opacity-50">Signal_Quality</span>
                        <span className="text-xs font-bold">{Math.round(currentConfidence * 100)}%</span>
                      </div>
                      <div className="h-0.5 w-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-white transition-all duration-300" 
                          style={{ width: `${currentConfidence * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Status Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <StatusValue label="Engine_Module" value="bisindo_v3_rgb" />
                <StatusValue label="Input_Source" value={`${facingMode.toUpperCase()}_ARRAY`} />
                <StatusValue label="Processing" value="QUANTIZED_INT8" />
                <StatusValue label="Data_State" value={detections.length > 0 ? "TRANSCEIVING" : "POLLING"} />
              </div>
            </div>
          </div>
          
          {/* Practice Guide at the bottom of visual space */}
          <div className="px-8 md:px-10 pb-10">
             <div className="max-w-[1000px] w-full mx-auto border-t border-[#d9d9dd] pt-10">
                <PracticeGuide />
             </div>
          </div>
        </section>

        {/* Interpretation Ledger Column */}
        <section className="flex-1 flex flex-col bg-white">
          {/* Live Analysis Terminal Slot */}
          <div className="p-10 border-b border-[#d9d9dd]">
            <header className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-3">
                 <Terminal className="size-3.5 text-[#75758a]" />
                 <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#75758a]">Session_Buffer</h3>
               </div>
               <div className="flex items-center gap-1">
                 <div className="size-1 bg-[#d9d9dd]" />
                 <div className="size-1 bg-[#d9d9dd]" />
                 <div className="size-1 bg-[#17171c]" />
               </div>
            </header>

            <div className="flex flex-col items-center justify-center min-h-[160px]">
              <PredictionBadge
                letter={currentLetter}
                confidence={currentConfidence}
                isDetecting={isActive}
                hasHand={detections.length > 0}
                textScale={prefs.textScale}
              />
            </div>
          </div>

          {/* Sequence Assembler */}
          <div className="p-10 border-b border-[#d9d9dd] bg-[#eeece7]/20">
            <div className="mb-6 flex items-center gap-3">
              <Layers className="size-3.5 text-[#75758a]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#75758a]">Sequence_Assembly</span>
              <div className="h-px flex-1 bg-[#d9d9dd]" />
            </div>
            {renderSentenceBuilder("panel")}
          </div>

          {/* Interpretation Log */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-10 py-6 border-b border-[#d9d9dd] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Activity className="size-3.5 text-[#75758a]" />
                <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#75758a]">Interpretation_History</h3>
              </div>
              <button 
                onClick={() => setTranscript([])}
                className="font-mono text-[9px] uppercase tracking-widest text-[#75758a] hover:text-[#17171c] transition-colors"
              >
                Clear_Log
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PredictionDisplay
                transcript={transcript}
                appState={appState}
                onClearTranscript={() => setTranscript([])}
                sessionStart={sessionStart}
                onSpeakEntry={handleSpeakEntry}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Mobile assembly footer - persistent control */}
      <div className="md:hidden border-t border-[#d9d9dd] bg-white p-6 z-50">
        {renderSentenceBuilder("sticky")}
      </div>
    </div>
  );
}