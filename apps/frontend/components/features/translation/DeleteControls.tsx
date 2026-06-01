"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface DeleteControlsProps {
  onDeleteLast: () => void;
  onClearAll: () => void;
  disabled?: boolean;
  size?: "default" | "compact";
}

export default function DeleteControls({
  onDeleteLast,
  onClearAll,
  disabled = false,
  size = "default",
}: DeleteControlsProps) {
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!confirming) return;
    timerRef.current = setTimeout(() => setConfirming(false), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [confirming]);

  useEffect(() => {
    if (!disabled) return;
    setConfirming(false);
  }, [disabled]);

  function handleClearClick() {
    if (disabled) return;
    if (confirming) {
      onClearAll();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  const isCompact = size === "compact";

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Text editing controls">
      <button
        type="button"
        onClick={onDeleteLast}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-full border border-[var(--cohere-hairline)] dark:border-zinc-800 transition-all duration-200",
          isCompact ? "h-8 w-8" : "h-9 w-9",
          "bg-[var(--cohere-stone)] dark:bg-zinc-900 text-[var(--cohere-ink)] dark:text-zinc-300",
          "hover:bg-[var(--cohere-hairline)] dark:hover:bg-zinc-800",
          disabled && "opacity-30 cursor-not-allowed"
        )}
      >
        <Delete className="size-4" />
      </button>

      <button
        type="button"
        onClick={handleClearClick}
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded-full border border-[var(--cohere-hairline)] dark:border-zinc-800 px-4 transition-all duration-200 font-sans font-medium",
          isCompact ? "h-8" : "h-9",
          disabled && "opacity-30 cursor-not-allowed",
          confirming 
            ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-950/20" 
            : "bg-[var(--cohere-stone)] dark:bg-zinc-900 text-[var(--cohere-ink)] dark:text-zinc-300 hover:bg-[var(--cohere-hairline)] dark:hover:bg-zinc-800"
        )}
      >
        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.div
              key="confirming"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <X className="size-4" />
              <span className="uppercase text-[10px]">Confirm?</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <X className="size-4" />
              <span className="uppercase text-[10px]">Clear</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
