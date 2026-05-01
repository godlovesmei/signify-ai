'use client';

import { cn } from '@/lib/utils';
import { type AlphabetLetter } from '@/lib/userData';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessOverlayProps {
  show: boolean;
  letter: AlphabetLetter;
}

export function SuccessOverlay({ show, letter }: SuccessOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Flash effect */}
          <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-emerald-500/10"
          />

          {/* Big letter */}
          <motion.h1
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className={cn(
              'text-[8rem] md:text-[12rem] font-black text-white/90 select-none',
              'drop-shadow-[0_0_60px_rgba(16,185,129,0.3)]',
            )}
          >
            {letter}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}