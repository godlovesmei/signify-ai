'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CameraOff, Check, Copy, FileText, Hand, Loader2, Share2, ShieldAlert, Trash2, Volume2 } from 'lucide-react';
import type { CameraState } from './WebcamCapture';

export interface TranscriptEntry {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
  language: string;
}

export interface PredictionDisplayProps {
  transcript: TranscriptEntry[];
  appState: CameraState;
  onClearTranscript: () => void;
  /** Set when detection session starts; drives the session timer. */
  sessionStart?: Date | null;
  /** Called when user taps the Speak button on a transcript entry. */
  onSpeakEntry?: (text: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m   = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type ClockListener = () => void;

const secondClockListeners = new Set<ClockListener>();
let secondClockInterval: ReturnType<typeof setInterval> | null = null;

function emitSecondClockTick() {
  for (const listener of secondClockListeners) {
    listener();
  }
}

function subscribeToSecondClock(listener: ClockListener) {
  secondClockListeners.add(listener);

  if (secondClockInterval === null) {
    secondClockInterval = setInterval(() => {
      emitSecondClockTick();
    }, 1000);
  }

  return () => {
    secondClockListeners.delete(listener);
    if (secondClockListeners.size === 0 && secondClockInterval !== null) {
      clearInterval(secondClockInterval);
      secondClockInterval = null;
    }
  };
}

function getSecondClockSnapshot() {
  return Math.floor(Date.now() / 1000);
}

function useNowSecond() {
  return useSyncExternalStore(subscribeToSecondClock, getSecondClockSnapshot, () => 0);
}

function getConfidenceLabel(value: number): {
  label: string;
  dotClass: string;
  pillClass: string;
} {
  if (value >= 0.92) {
    return { label: 'High confidence', dotClass: 'bg-success',     pillClass: 'bg-success/10 text-success' };
  }
  if (value >= 0.65) {
    return { label: 'Likely correct',  dotClass: 'bg-warning',     pillClass: 'bg-warning/10 text-warning-foreground' };
  }
  return {   label: 'Uncertain',       dotClass: 'bg-destructive', pillClass: 'bg-destructive/10 text-destructive' };
}

function ConfidencePill({ value }: { value: number }) {
  const { label, dotClass, pillClass } = getConfidenceLabel(value);
  return (
    <span
      title={`${Math.round(value * 100)}% model confidence`}
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5',
        'text-xs font-semibold leading-none',
        pillClass,
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', dotClass].join(' ')} aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Transcript line ───────────────────────────────────────────────────────────

function TranscriptLine({
  entry,
  isLatest,
  onCopy,
  onSpeak,
  isCopied,
}: {
  entry: TranscriptEntry;
  isLatest: boolean;
  onCopy: () => void;
  onSpeak?: () => void;
  isCopied: boolean;
}) {
  const time = entry.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={[
        'group flex flex-col gap-1.5 rounded-xl px-3.5 py-3 transition-colors duration-150',
        isLatest
          ? 'bg-primary/6 ring-1 ring-inset ring-primary/20'
          : 'ring-1 ring-inset ring-border/40 hover:bg-muted/40',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={[
            'flex-1 text-sm leading-relaxed',
            isLatest ? 'font-medium text-foreground' : 'text-foreground/75',
          ].join(' ')}
        >
          {entry.text}
        </p>
        <ConfidencePill value={entry.confidence} />
      </div>

      <div className="flex items-center justify-between gap-2">
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

        {/* Per-entry actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {onSpeak && (
            <button
              type="button"
              onClick={onSpeak}
              aria-label={`Speak: ${entry.text}`}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              <Volume2 className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onCopy}
            aria-label={isCopied ? 'Copied!' : `Copy: ${entry.text}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            {isCopied
              ? <Check className="h-3 w-3 text-success" aria-hidden="true" />
              : <Copy className="h-3 w-3" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ appState }: { appState: CameraState }) {
  const messages: Partial<Record<CameraState, { icon: React.ReactNode; text: string }>> = {
    idle: {
      icon: <CameraOff className="h-5 w-5" />,
      text: 'Enable your camera to begin.',
    },
    requesting: {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      text: 'Waiting for camera permission…',
    },
    loading: {
      icon: <Loader2 className="h-5 w-5 animate-spin" />,
      text: 'Loading hand detection model…',
    },
    ready: {
      icon: <Hand className="h-5 w-5" />,
      text: 'Press the hand button to start detecting.',
    },
    detecting: {
      icon: <Hand className="h-5 w-5 text-primary" />,
      text: 'Show a hand sign in front of your camera…',
    },
    'error-permission': {
      icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      text: 'Camera permission is required.',
    },
    'error-device': {
      icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
      text: 'No camera was detected.',
    },
  };

  const msg = messages[appState];
  if (!msg) return null;

  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center gap-4 text-center px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground/40">
        {msg.icon}
      </div>
      <p className="max-w-44 text-sm leading-relaxed text-muted-foreground/60">{msg.text}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PredictionDisplay({
  transcript,
  appState,
  onClearTranscript,
  sessionStart,
  onSpeakEntry,
}: PredictionDisplayProps) {
  const scrollEndRef            = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const nowSecond               = useNowSecond();

  const elapsed = useMemo(() => {
    if (!sessionStart) return 0;
    return Math.max(0, nowSecond - Math.floor(sessionStart.getTime() / 1000));
  }, [nowSecond, sessionStart]);

  // Auto-scroll on new entry
  useEffect(() => {
    if (transcript.length > 0) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  function handleCopyEntry(entry: TranscriptEntry) {
    navigator.clipboard.writeText(entry.text).catch(() => {});
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleExport() {
    if (transcript.length === 0) return;
    const lines = transcript.map(
      (e) => `[${e.timestamp.toLocaleTimeString()}] ${e.text} (${e.language}, ${Math.round(e.confidence * 100)}%)`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `signify-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    const text = transcript.map((e) => e.text).join(' ').trim();
    if (!text) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SignifyAI Transcript', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
    } catch { /* user cancelled */ }
  }

  const hasEntries = transcript.length > 0;

  return (
    <section
      aria-label="Translation transcript"
      aria-live="polite"
      aria-atomic="false"
      className="flex flex-col overflow-hidden bg-background"
      style={{ minHeight: 0 }}
    >
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="shrink-0 text-muted-foreground" aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-semibold">Transcript</span>
          {hasEntries && (
            <span
              aria-label={`${transcript.length} entries`}
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums leading-none"
            >
              {transcript.length}
            </span>
          )}
        </div>

        {/* Session timer */}
        {sessionStart && (
          <span
            aria-label={`Session duration: ${formatElapsed(elapsed)}`}
            className="font-mono text-xs tabular-nums text-muted-foreground/50"
          >
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {/* Scrollable entry list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-label="Translation output log"
      >
        {!hasEntries ? (
          <EmptyState appState={appState} />
        ) : (
          <div className="space-y-2">
            {transcript.map((entry, i) => (
              <TranscriptLine
                key={entry.id}
                entry={entry}
                isLatest={i === transcript.length - 1}
                onCopy={() => handleCopyEntry(entry)}
                onSpeak={onSpeakEntry ? () => onSpeakEntry(entry.text) : undefined}
                isCopied={copiedId === entry.id}
              />
            ))}
            <div ref={scrollEndRef} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 border-t border-border/30 bg-card/50 px-4 py-3">
        {hasEntries ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              aria-label="Export transcript as .txt"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Export .txt
            </button>

            <button
              type="button"
              onClick={onClearTranscript}
              aria-label="Clear transcript history"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive hover:border-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="Share transcript"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              Share
            </button>
          </div>
        ) : (
          /* Spacer so layout height stays consistent */
          <div aria-hidden="true" className="h-8 opacity-0" />
        )}
      </div>
    </section>
  );
}
