'use client';

import { Volume2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import TTSSpeakingIndicator from './TTSSpeakingIndicator';
import { motion, AnimatePresence } from 'motion/react';

export interface TTSButtonProps {
  sentence: string;
  isSpeaking: boolean;
  hasError?: boolean;
  onSpeak: () => void;
  className?: string;
  size?: 'default' | 'compact';
}

export default function TTSButton({
  sentence,
  isSpeaking,
  hasError = false,
  onSpeak,
  className,
  size = 'default',
}: TTSButtonProps) {
  const isEmpty   = sentence.trim().length === 0;
  const isCompact = size === 'compact';
  const t = useTranslations('workspace.translate');

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        type="button"
        aria-label={isSpeaking ? t('speakingSentence') : t('speakSentence')}
        onClick={onSpeak}
        disabled={isEmpty || isSpeaking}
        className={cn(
          'flex items-center justify-center rounded-[30px] border border-[var(--cohere-hairline)] transition-colors duration-200',
          isCompact ? 'h-8 w-8' : 'h-9 px-5 gap-3',
          isSpeaking 
            ? 'border-[var(--cohere-ink)] bg-[var(--cohere-ink)] text-[var(--cohere-canvas)]' 
            : 'bg-[var(--cohere-stone)] text-[var(--cohere-ink)] hover:bg-[var(--cohere-hairline)]',
          isEmpty && !isSpeaking && 'opacity-30 cursor-not-allowed',
          hasError && !isSpeaking && 'text-[var(--cohere-error)] border-[color-mix(in_srgb,var(--cohere-error)_20%,transparent)]'
        )}
      >
        <AnimatePresence mode="wait">
          {isSpeaking ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <TTSSpeakingIndicator active={true} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <Volume2 className="size-4" />
              {!isCompact && <span className="text-[11px] font-sans font-medium">{t('listen')}</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {!isCompact && (
        <div className="hidden sm:flex flex-col ml-2">
           <span className="text-[10px] uppercase tracking-normal text-[var(--cohere-muted)] font-mono">
             {isSpeaking ? t('playing') : t('voiceLanguage')}
           </span>
        </div>
      )}
    </div>
  );
}
