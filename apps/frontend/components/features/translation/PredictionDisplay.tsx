'use client';

import { useEffect, useRef } from 'react';
import { CameraOff, Hand, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
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
}

function getConfidenceLabel(value: number): {
  label: string;
  dotClass: string;
  pillClass: string;
} {
  if (value >= 0.92) {
    return {
      label:     'High confidence',
      dotClass:  'bg-success',
      pillClass: 'bg-success/10 text-success',
    };
  }
  if (value >= 0.65) {
    return {
      label:     'Likely correct',
      dotClass:  'bg-warning',
      pillClass: 'bg-warning/10 text-warning-foreground',
    };
  }
  return {
    label:     'Uncertain',
    dotClass:  'bg-destructive',
    pillClass: 'bg-destructive/10 text-destructive',
  };
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

function TranscriptLine({
  entry,
  isLatest,
}: {
  entry: TranscriptEntry;
  isLatest: boolean;
}) {
  const time = entry.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
        <p
          className={[
            'text-sm leading-relaxed',
            isLatest ? 'font-medium text-foreground' : 'text-foreground/75',
          ].join(' ')}
        >
          {entry.text}
        </p>
        <ConfidencePill value={entry.confidence} />
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

function EmptyState({ appState }: { appState: CameraState }) {
  const messages: Partial<Record<CameraState, { icon: React.ReactNode; text: string }>> = {
    idle: {
      icon: <CameraOff className="h-4 w-4" />,
      text: 'Enable your camera to begin.',
    },
    requesting: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: 'Waiting for camera permission…',
    },
    loading: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: 'Loading hand detection model…',
    },
    ready: {
      icon: <Hand className="h-4 w-4" />,
      text: 'Press the hand button to start detecting.',
    },
    detecting: {
      icon: <Hand className="h-4 w-4 text-primary" />,
      text: 'Show a hand sign in front of your camera…',
    },
    'error-permission': {
      icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      text: 'Camera permission is required.',
    },
    'error-device': {
      icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
      text: 'No camera was detected.',
    },
  };

  const msg = messages[appState];
  if (!msg) return null;

  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-center">
      <span className="text-muted-foreground/35">{msg.icon}</span>
      <p className="max-w-44 text-xs leading-relaxed text-muted-foreground/60">{msg.text}</p>
    </div>
  );
}

export default function PredictionDisplay({
  transcript,
  appState,
  onClearTranscript,
}: PredictionDisplayProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript.length > 0) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [transcript]);

  const latest = transcript[transcript.length - 1] ?? null;

  return (
    <section
      aria-label="Translation transcript"
      aria-live="polite"
      aria-atomic="false"
      className={[
        'flex flex-col border-t border-border/30 bg-background',
        // ↓ was md:w-[360px] — too narrow for prediction badge + sentence builder + transcript
        'md:w-[420px] md:border-t-0 md:border-l',
      ].join(' ')}
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
          {transcript.length > 0 && (
            <span
              aria-label={`${transcript.length} entries`}
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums leading-none"
            >
              {transcript.length}
            </span>
          )}
        </div>

        {transcript.length > 0 && (
          <button
            onClick={onClearTranscript}
            aria-label="Clear transcript"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Scrollable entry list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3"
        role="log"
        aria-label="Translation output log"
      >
        {transcript.length === 0 ? (
          <EmptyState appState={appState} />
        ) : (
          <div className="space-y-2">
            {transcript.map((entry, i) => (
              <TranscriptLine
                key={entry.id}
                entry={entry}
                isLatest={i === transcript.length - 1}
              />
            ))}
            <div ref={scrollEndRef} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Latest prediction footer */}
      <div className="shrink-0 border-t border-border/30 bg-card/50 px-5 py-3.5">
        {latest ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Latest
              </p>
              <p className="text-base font-semibold leading-snug">{latest.text}</p>
            </div>
            <ConfidencePill value={latest.confidence} />
          </div>
        ) : (
          <div aria-hidden="true" className="select-none opacity-0">
            <p className="text-[10px]">&nbsp;</p>
            <p className="text-base">&nbsp;</p>
          </div>
        )}
      </div>
    </section>
  );
}