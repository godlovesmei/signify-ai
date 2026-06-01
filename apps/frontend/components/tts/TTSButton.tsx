'use client';

import { Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import TTSSpeakingIndicator from './TTSSpeakingIndicator';
import { motion, AnimatePresence } from 'motion/react';

const APPLE_SPRING = { stiffness: 260, damping: 30 };

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

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        type="button"
        onClick={onSpeak}
        disabled={isEmpty || isSpeaking}
        className={cn(
          'flex items-center justify-center rounded-full border border-[var(--cohere-hairline)] dark:border-zinc-800 transition-all duration-200',
          isCompact ? 'h-8 w-8' : 'h-9 px-5 gap-3',
          isSpeaking 
            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black border-zinc-900 dark:border-zinc-100' 
            : 'bg-[var(--cohere-stone)] dark:bg-zinc-900 text-[var(--cohere-ink)] dark:text-zinc-300 hover:bg-[var(--cohere-hairline)] dark:hover:bg-zinc-800',
          isEmpty && !isSpeaking && 'opacity-30 cursor-not-allowed',
          hasError && !isSpeaking && 'text-red-500 border-red-500/20'
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
              {!isCompact && <span className="text-[11px] font-sans font-medium uppercase tracking-tight">Read Aloud</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {!isCompact && (
        <div className="hidden sm:flex flex-col ml-2">
           <span className="text-[10px] uppercase tracking-widest text-[var(--cohere-muted)] font-mono">
             {isSpeaking ? "Analyzing..." : "Indonesia v4"}
           </span>
        </div>
      )}
    </div>
  );
}
