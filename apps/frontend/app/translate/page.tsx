'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Hand,
  Loader2,
  Mic,
  RotateCcw,
  Settings,
  ShieldAlert,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';

type AppState =
  | 'idle'
  | 'requesting'
  | 'loading'
  | 'ready'
  | 'detecting'
  | 'error-permission'
  | 'error-device';

interface TranscriptEntry {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
  language: 'ASL' | 'BISINDO';
}

type Language = 'ASL' | 'BISINDO';

const SIMULATED_PHRASES: Array<{ text: string; confidence: number }> = [
  { text: 'Hello, my name is Maya.',          confidence: 0.97 },
  { text: 'I need help with my order.',       confidence: 0.93 },
  { text: 'Thank you for understanding.',     confidence: 0.98 },
  { text: 'Can you please speak slowly?',     confidence: 0.91 },
  { text: 'Where is the nearest exit?',       confidence: 0.95 },
  { text: 'I would like to place an order.',  confidence: 0.89 },
];

const MODEL_INIT_DURATION_MS = 2400;
const DETECTION_INTERVAL_MS  = 3200;

let _idCounter = 0;
function uid() { return `entry-${Date.now()}-${++_idCounter}`; }

function ConfidenceBadge({ value }: { value: number }) {
  const pct  = Math.round(value * 100);
  const high = value >= 0.92;
  const mid  = value >= 0.8 && value < 0.92;

  return (
    <span
      title={`Recognition confidence: ${pct}%`}
      className={[
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
        high ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
             : mid  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      ].join(' ')}
    >
      {pct}%
    </span>
  );
}

function ScanOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
        <span
          key={pos}
          className={[
            'absolute h-6 w-6 border-white/60',
            pos === 'tl' ? 'top-5 left-5 border-t border-l rounded-tl-md'
          : pos === 'tr' ? 'top-5 right-5 border-t border-r rounded-tr-md'
          : pos === 'bl' ? 'bottom-22 left-5 border-b border-l rounded-bl-md'
          :                'bottom-22 right-5 border-b border-r rounded-br-md',
          ].join(' ')}
        />
      ))}
      <span className="absolute left-5 right-5 h-px bg-linear-to-r from-transparent via-white/20 to-transparent animate-[scanline_2.8s_ease-in-out_infinite]" />
    </div>
  );
}

function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400/70 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
    </span>
  );
}

function TranscriptLine({ entry, isLatest }: { entry: TranscriptEntry; isLatest: boolean }) {
  const time = entry.timestamp.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div
      className={[
        'flex flex-col gap-1 rounded-xl px-3.5 py-3 transition-colors duration-150',
        isLatest
          ? 'bg-primary/6 ring-1 ring-inset ring-primary/20'
          : 'ring-1 ring-inset ring-border/40 hover:bg-muted/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={[
          'text-sm leading-relaxed',
          isLatest ? 'font-medium text-foreground' : 'text-foreground/75',
        ].join(' ')}>
          {entry.text}
        </p>
        <ConfidenceBadge value={entry.confidence} />
      </div>
      <div className="flex items-center gap-1.5">
        <time
          className="text-[11px] text-muted-foreground/50 tabular-nums"
          dateTime={entry.timestamp.toISOString()}
        >
          {time}
        </time>
        <span className="text-[11px] text-muted-foreground/30" aria-hidden="true">·</span>
        <span className="text-[11px] text-muted-foreground/50">{entry.language}</span>
      </div>
    </div>
  );
}

interface SettingsPanelProps {
  language: Language;
  onLanguageChange: (l: Language) => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onClose: () => void;
}

function SettingsPanel({
  language, onLanguageChange, voiceEnabled, onVoiceToggle, onClose,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-90 rounded-t-2xl border border-border/40 bg-card shadow-xl shadow-black/8 focus:outline-none md:rounded-2xl animate-[slideUp_0.22s_ease]"
      >
        <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close settings"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
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
                className="w-full appearance-none rounded-xl border border-border/50 bg-background px-4 py-2.5 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ASL">American Sign Language (ASL)</option>
                <option value="BISINDO">Indonesian Sign Language (BISINDO)</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Voice Output</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Speak translations aloud</p>
            </div>
            <Button
              role="switch"
              aria-checked={voiceEnabled}
              onClick={onVoiceToggle}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                voiceEnabled ? 'bg-primary' : 'bg-border',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                  voiceEnabled ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </Button>
          </div>

          <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 px-4 py-3 dark:border-amber-500/15 dark:bg-amber-500/5">
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              Best results in well-lit conditions.{' '}
              <Link
                href="/how-it-works#limitations"
                className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 hover:no-underline"
              >
                Learn more <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  type, onRetry,
}: {
  type: 'error-permission' | 'error-device';
  onRetry: () => void;
}) {
  const isPermission = type === 'error-permission';
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 px-8 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/8 ring-1 ring-rose-500/15">
        <ShieldAlert className="h-6 w-6 text-rose-500" aria-hidden="true" />
      </div>
      <div>
        <h3 className="mb-2 text-base font-semibold text-foreground">
          {isPermission ? 'Camera Access Denied' : 'No Camera Found'}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isPermission
            ? 'Signify needs camera access to detect sign language. Please allow it in your browser settings and try again.'
            : 'We could not detect a camera on your device. Please connect one and try again.'}
        </p>
      </div>
      {isPermission && (
        <div className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-3.5 text-left">
          <p className="mb-1.5 text-xs font-semibold text-foreground">To allow camera access:</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Click the lock icon in your browser address bar → Site settings → Camera → Allow.
          </p>
        </div>
      )}
      <Button
        onClick={onRetry}
        className="h-10 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <RotateCcw className="mr-2 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}

function IdlePrompt({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-7 px-8 py-12 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
        <Camera className="h-7 w-7 text-primary" aria-hidden="true" />
        <span
          aria-hidden="true"
          className="absolute -inset-2.5 rounded-[22px] border border-primary/10 animate-[pulseRing_3s_ease-in-out_infinite]"
        />
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">Start Translating</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Position your hands in frame. Signify will recognize your signs and display
          the translation in real time.
        </p>
      </div>

      <ul
        className="w-full space-y-2.5 text-left"
        role="list"
        aria-label="Tips for best results"
      >
        {[
          'Face a light source for best accuracy',
          'Keep both hands within the frame',
          'Sign at a natural, comfortable pace',
        ].map((tip) => (
          <li key={tip} className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary/50" aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>

      <button
        onClick={onStart}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Camera className="h-4 w-4" aria-hidden="true" />
        Enable Camera
      </button>

      <p className="text-xs text-muted-foreground/60">
        Camera feed is processed locally and never stored.{' '}
        <Link
          href="/how-it-works"
          className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          Learn how it works
        </Link>
      </p>
    </div>
  );
}

function LoadingState() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const raf = () => {
      const p = Math.min(((Date.now() - start) / MODEL_INIT_DURATION_MS) * 100, 95);
      setProgress(p);
      if (p < 95) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, []);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-5 px-8 py-12 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <div>
        <h3 className="mb-1 text-base font-semibold text-foreground">Initialising Model</h3>
        <p className="text-sm text-muted-foreground">Just a moment on first load.</p>
      </div>
      <div className="w-full space-y-1.5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="AI model loading progress"
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-right text-[11px] text-muted-foreground/50 tabular-nums">
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

function EmptyTranscript({ appState }: { appState: AppState }) {
  const messages: Partial<Record<AppState, { icon: React.ReactNode; text: string }>> = {
    idle:               { icon: <CameraOff className="h-4 w-4" />,                          text: 'Enable your camera to begin.' },
    requesting:         { icon: <Loader2 className="h-4 w-4 animate-spin" />,                text: 'Waiting for permission…' },
    loading:            { icon: <Loader2 className="h-4 w-4 animate-spin" />,                text: 'Loading AI model…' },
    ready:              { icon: <Hand className="h-4 w-4" />,                                text: 'Press the hand button to detect.' },
    detecting:          { icon: <Hand className="h-4 w-4 text-primary" />,                   text: 'Listening for signs…' },
    'error-permission': { icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,           text: 'Camera permission required.' },
    'error-device':     { icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,           text: 'No camera detected.' },
  };

  const msg = messages[appState];
  if (!msg) return null;

  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-center">
      <span className="text-muted-foreground/35">{msg.icon}</span>
      <p className="max-w-40 text-xs leading-relaxed text-muted-foreground/60">{msg.text}</p>
    </div>
  );
}

function IconBtn({
  onClick,
  disabled,
  label,
  children,
  variant = 'ghost',
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
  variant?: 'ghost' | 'overlay';
}) {
  const base = [
    'flex items-center justify-center rounded-xl transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-30',
  ].join(' ');

  const styles = {
    ghost:   'h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-primary',
    overlay: 'h-10 w-10 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-black',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${base} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export default function TranslatePage() {
  const [appState, setAppState]                     = useState<AppState>('idle');
  const [transcript, setTranscript]                 = useState<TranscriptEntry[]>([]);
  const [language, setLanguage]                     = useState<Language>('ASL');
  const [voiceEnabled, setVoiceEnabled]             = useState(false);
  const [facingMode, setFacingMode]                 = useState<'user' | 'environment'>('user');
  const [showSettings, setShowSettings]             = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef       = useRef<HTMLVideoElement>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const detectionTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEnd  = useRef<HTMLDivElement>(null);
  const phraseIndex    = useRef(0);

  useEffect(() => {
    if (transcript.length > 0) {
      transcriptEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    navigator.mediaDevices?.enumerateDevices()
      .then((d) => setHasMultipleCameras(d.filter((x) => x.kind === 'videoinput').length > 1))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (detectionTimer.current) clearInterval(detectionTimer.current);
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setAppState('requesting');
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setAppState('loading');
      setTimeout(() => setAppState('ready'), MODEL_INIT_DURATION_MS);
    } catch (err: unknown) {
      const e = err as { name?: string };
      setAppState(
        e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError'
          ? 'error-permission'
          : 'error-device'
      );
    }
  }, [facingMode, stopStream]);

  const handleReset = useCallback(() => {
    stopStream();
    if (detectionTimer.current) { clearInterval(detectionTimer.current); detectionTimer.current = null; }
    setAppState('idle');
    setTranscript([]);
    phraseIndex.current = 0;
  }, [stopStream]);

  const startDetection = useCallback(() => {
    if (appState !== 'ready') return;
    setAppState('detecting');
    detectionTimer.current = setInterval(() => {
      const phrase = SIMULATED_PHRASES[phraseIndex.current % SIMULATED_PHRASES.length];
      phraseIndex.current++;
      setTranscript((prev) => [
        ...prev.slice(-49),
        { id: uid(), text: phrase.text, confidence: phrase.confidence, timestamp: new Date(), language },
      ]);
      if (voiceEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(phrase.text);
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    }, DETECTION_INTERVAL_MS);
  }, [appState, language, voiceEnabled]);

  const stopDetection = useCallback(() => {
    if (detectionTimer.current) { clearInterval(detectionTimer.current); detectionTimer.current = null; }
    if (appState === 'detecting') setAppState('ready');
  }, [appState]);

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    stopDetection();
    startCamera(next);
  }, [facingMode, stopDetection, startCamera]);

  const isLive      = appState === 'ready' || appState === 'detecting';
  const isDetecting = appState === 'detecting';
  const isError     = appState === 'error-permission' || appState === 'error-device';
  const latestEntry = transcript[transcript.length - 1] ?? null;

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { top: 1.25rem; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: calc(100% - 5.5rem); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.07; transform: scale(1.06); }
        }
        @keyframes entryIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
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
            {isDetecting && <LiveDot />}
            <h1 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
              {isDetecting ? 'Detecting' : 'Translate'}
            </h1>
            {isLive && (
              <span className="hidden rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 md:inline-flex">
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <IconBtn
              onClick={() => setVoiceEnabled((v) => !v)}
              disabled={!isLive}
              label={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
              variant="ghost"
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </IconBtn>
            <IconBtn
              onClick={() => setShowSettings(true)}
              disabled={!isLive}
              label="Open settings"
              variant="ghost"
            >
              <Settings className="h-4 w-4" />
            </IconBtn>
          </div>
        </header>

        <main
          id="translate-main"
          className="flex flex-1 flex-col overflow-hidden md:flex-row"
          style={{ minHeight: 0 }}
        >

          <section
            aria-label="Camera feed"
            className="relative flex flex-col bg-neutral-950 md:flex-1"
            style={{ minHeight: 0 }}
          >
            <video
              ref={videoRef}
              className={[
                'h-full w-full object-cover transition-opacity duration-300',
                facingMode === 'user' ? '-scale-x-100' : '',
                isLive ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              autoPlay
              muted
              playsInline
              aria-label="Live camera feed"
            />

            {isDetecting && <ScanOverlay />}

            {!isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                {appState === 'idle' && (
                  <IdlePrompt onStart={() => startCamera()} />
                )}
                {(appState === 'requesting' || appState === 'loading') && (
                  <LoadingState />
                )}
                {isError && (
                  <ErrorState
                    type={appState as 'error-permission' | 'error-device'}
                    onRetry={() => startCamera()}
                  />
                )}
              </div>
            )}

            {isLive && (
              <div
                role="toolbar"
                aria-label="Camera controls"
                className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 pb-6 pt-14 bg-gradient-to-t from-black/60 via-black/15 to-transparent"
              >
                <IconBtn onClick={handleReset} label="Stop and reset" variant="overlay">
                  <RotateCcw className="h-4 w-4" />
                </IconBtn>

                <Button
                  onClick={isDetecting ? stopDetection : startDetection}
                  aria-label={isDetecting ? 'Stop detection' : 'Start detection'}
                  aria-pressed={isDetecting}
                  className={[
                    'flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    isDetecting
                      ? 'bg-rose-500 ring-1 ring-rose-400/40 hover:bg-rose-600 focus-visible:ring-rose-400'
                      : 'bg-primary ring-1 ring-primary/30 hover:bg-primary/90 focus-visible:ring-primary shadow-lg shadow-black/30',
                  ].join(' ')}
                >
                  {isDetecting
                    ? <Square className="h-4 w-4 fill-white text-white" aria-hidden="true" />
                    : <Hand   className="h-5 w-5 text-white" aria-hidden="true" />
                  }
                </Button>

                <IconBtn
                  onClick={flipCamera}
                  disabled={!hasMultipleCameras}
                  label="Switch camera"
                  variant="overlay"
                >
                  <FlipHorizontal className="h-4 w-4" />
                </IconBtn>
              </div>
            )}

            {isLive && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-sm">
                <Hand className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                {language}
              </div>
            )}

            {isLive && voiceEnabled && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm">
                <Mic className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                Voice
              </div>
            )}
          </section>

          <section
            aria-label="Translation transcript"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
            className="flex flex-col border-t border-border/30 bg-background md:w-[360px] md:border-t-0 md:border-l"
            style={{ minHeight: 0 }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 text-muted-foreground" aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="text-sm font-semibold text-foreground">Transcript</span>
                {transcript.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums leading-none">
                    {transcript.length}
                  </span>
                )}
              </div>
              {transcript.length > 0 && (
                <button
                  onClick={() => { setTranscript([]); phraseIndex.current = 0; }}
                  aria-label="Clear transcript"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3"
              role="log"
              aria-label="Translation output"
            >
              {transcript.length === 0 ? (
                <EmptyTranscript appState={appState} />
              ) : (
                <div className="space-y-2">
                  {transcript.map((entry, i) => (
                    <div key={entry.id} className="entry-enter">
                      <TranscriptLine
                        entry={entry}
                        isLatest={i === transcript.length - 1}
                      />
                    </div>
                  ))}
                  <div ref={transcriptEnd} aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-border/30 bg-card/50 px-5 py-4">
              {latestEntry ? (
                <>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Latest
                  </p>
                  <p className="text-base font-semibold leading-snug text-foreground">
                    {latestEntry.text}
                  </p>
                </>
              ) : (
                <div aria-hidden="true" className="select-none opacity-0">
                  <p className="text-[10px]">&nbsp;</p>
                  <p className="text-base">&nbsp;</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

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