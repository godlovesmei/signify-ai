'use client';

import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TTSSpeakingIndicator from './TTSSpeakingIndicator';

export interface TTSButtonProps {
  /** The sentence text that will be spoken. */
  sentence: string;
  /** Whether TTS is currently playing. */
  isSpeaking: boolean;
  /** Whether TTS playback failed on the last attempt. */
  hasError?: boolean;
  onSpeak: () => void;
  className?: string;
}

export default function TTSButton({
  sentence,
  isSpeaking,
  hasError = false,
  onSpeak,
  className,
}: TTSButtonProps) {
  const isEmpty   = sentence.trim().length === 0;
  const isDisabled = isEmpty || isSpeaking;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onSpeak}
        disabled={isDisabled}
        aria-label={
          isSpeaking  ? 'Speaking…'
          : isEmpty   ? 'Build a sentence first'
          : 'Read aloud in Bahasa Indonesia'
        }
        aria-busy={isSpeaking}
        title={
          isSpeaking  ? 'Speaking…'
          : isEmpty   ? 'Build a sentence first'
          : 'Read aloud in Bahasa Indonesia'
        }
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1',

          // Disabled — empty sentence
          isEmpty && !hasError && [
            'cursor-not-allowed border-border bg-muted text-muted-foreground/30 opacity-50',
          ],

          // Error state
          hasError && !isSpeaking && [
            'border-destructive/40 bg-destructive/8 text-destructive',
            'hover:bg-destructive/12',
          ],

          // Speaking / active
          isSpeaking && [
            'border-primary/40 bg-primary/10 text-primary',
          ],

          // Idle — ready to speak
          !isEmpty && !isSpeaking && !hasError && [
            'border-border bg-muted text-muted-foreground',
            'hover:bg-muted/80 hover:text-foreground hover:border-border/80',
            'active:scale-[0.97]',
          ],
        )}
      >
        {isSpeaking
          ? <TTSSpeakingIndicator active={true} className="text-primary" />
          : <Volume2 className="h-4 w-4" aria-hidden="true" />
        }
      </button>

      {/* TTS language badge — always visible, informs researchers/devs of active locale */}
      <span
        aria-label="Text-to-speech language: Bahasa Indonesia"
        className={cn(
          'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums tracking-wide',
          isSpeaking
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground',
        )}
      >
        ID
      </span>

      {/* Error message */}
      {hasError && !isSpeaking && (
        <p role="alert" className="text-xs text-destructive">
          TTS unavailable. Check your device volume.
        </p>
      )}
    </div>
  );
}