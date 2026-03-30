'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import DeleteControls from './DeleteControls';
import TTSButton from '@/components/tts/TTSButton';

export interface SentenceBuilderProps {
  tokens: string[];
  isSpeaking: boolean;
  onDeleteLast: () => void;
  onClearAll: () => void;
  onSpeak: () => void;
  /** Appends a space character to the token list. */
  onAddSpace?: () => void;
  /** Pass true when the last TTS attempt threw an error. */
  isTtsError?: boolean;
  textScale?: number;
}

export default function SentenceBuilder({
  tokens,
  isSpeaking,
  onDeleteLast,
  onClearAll,
  onSpeak,
  onAddSpace,
  isTtsError = false,
  textScale = 1,
}: SentenceBuilderProps) {
  const sentence    = tokens.join('');
  const isEmpty     = tokens.length === 0;
  const stripRef    = useRef<HTMLDivElement>(null);

  // Auto-scroll the token strip right whenever a new token is added
  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, [tokens.length]);

  const sentenceFontSize = `${Math.max(1, 1.25 * textScale)}rem`;

  return (
    <div
      aria-label="Sentence builder"
      className={cn(
        'flex flex-col gap-3 rounded-2xl border-2 bg-card p-4',
        'transition-colors duration-300',
        isSpeaking
          ? 'border-primary bg-primary-50 animate-pulse-ring'
          : 'border-border',
      )}
    >
      {/* Screen reader announces speaking state once it starts */}
      {isSpeaking && (
        <span className="sr-only" aria-live="assertive" aria-atomic="true">
          Speaking: {sentence}
        </span>
      )}

      {/* Token history strip */}
      <div
        ref={stripRef}
        className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Confirmed letter history"
        role="list"
      >
        {isEmpty ? (
          <span className="select-none text-xs text-muted-foreground/40 tracking-wide">
            Letters appear here as you sign…
          </span>
        ) : (
          tokens.map((token, i) => {
            const isLatest = i === tokens.length - 1;
            return (
              <span
                key={i}
                role="listitem"
                aria-label={`Letter ${token}${isLatest ? ', latest' : ''}`}
                className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  'font-display text-sm font-semibold transition-all duration-150',
                  token === ' '
                    ? isLatest
                      ? 'bg-primary/15 ring-1 ring-primary/30 scale-105'
                      : 'bg-muted/60'
                    : isLatest
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30 scale-105'
                      : 'bg-muted/60 text-muted-foreground',
                )}
              >
                {token === ' ' ? '·' : token}
              </span>
            );
          })
        )}
      </div>

      {/* Built sentence */}
      <div
        aria-live="polite"
        aria-label="Built sentence"
        className={cn(
          'min-h-[56px] rounded-xl border border-border/50 bg-background/60 px-4 py-3',
          'font-medium leading-relaxed break-words',
          isEmpty && 'text-muted-foreground/40',
        )}
        style={{ fontSize: sentenceFontSize }}
      >
        {isEmpty ? 'Your sentence builds here…' : sentence}
      </div>

      {/* Quick actions: Space + Delete controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onAddSpace && (
            <button
              type="button"
              onClick={onAddSpace}
              aria-label="Add space"
              className={cn(
                'flex h-11 items-center gap-1.5 rounded-xl border px-3 text-sm transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1',
                'border-border bg-muted text-muted-foreground',
                'hover:border-primary/40 hover:bg-primary/8 hover:text-primary',
                'active:scale-[0.97]',
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">⎵</span>
              <span>Space</span>
            </button>
          )}
          <DeleteControls
            onDeleteLast={onDeleteLast}
            onClearAll={onClearAll}
            disabled={isEmpty}
          />
        </div>

        <div className="flex items-center gap-2">
          {!isEmpty && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground/60">
              {sentence.length} char{sentence.length !== 1 ? 's' : ''}
            </span>
          )}
          <TTSButton
            sentence={sentence}
            isSpeaking={isSpeaking}
            hasError={isTtsError}
            onSpeak={onSpeak}
          />
        </div>
      </div>
    </div>
  );
}
