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
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Flash & Particle effect placeholder via radial gradient */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-x-0 h-1 z-0 bg-white"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 bg-emerald-500/20 mix-blend-color-dodge blur-[120px]"
          />

          {/* Big letter */}
          <div className="relative">
            <motion.h1
              initial={{ scale: 0.2, opacity: 0, rotate: -20, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, rotate: 0, filter: 'blur(0px)' }}
              exit={{ scale: 2, opacity: 0, rotate: 10, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
              className={cn(
                'text-[12rem] md:text-[20rem] font-black text-white select-none relative z-10',
                'drop-shadow-[0_0_80px_rgba(16,185,129,0.5)]',
              )}
            >
              {letter}
            </motion.h1>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="absolute -bottom-6 left-0 h-2 bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.8)]"
            />
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-16 left-0 right-0 text-center text-[10px] font-black uppercase tracking-[0.8em] text-emerald-400"
            >
              Mastered
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}