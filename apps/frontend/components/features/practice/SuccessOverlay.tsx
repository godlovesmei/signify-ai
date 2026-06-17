'use client';

import { cn } from '@/lib/utils';
import { type AlphabetLetter } from '@/lib/userData';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';

interface SuccessOverlayProps {
  show: boolean;
  letter: AlphabetLetter;
}

export function SuccessOverlay({ show, letter }: SuccessOverlayProps) {
  const t = useTranslations('workspace.practice');

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-x-0 h-1 z-0 bg-white"
          />

          <div className="relative">
            <motion.h1
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
              className={cn(
                'relative z-10 select-none font-display text-[12rem] font-normal text-white md:text-[20rem]',
              )}
            >
              {letter}
            </motion.h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="absolute -bottom-6 left-0 h-1 bg-white"
            />
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-16 left-0 right-0 text-center text-mono-label text-[12px] text-white"
            >
              {t('mastered')}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
