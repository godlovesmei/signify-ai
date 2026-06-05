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
    const id = setTimeout(() => setConfirming(false), 0);
    return () => clearTimeout(id);
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
        aria-label="Delete last letter"
        onClick={onDeleteLast}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-[30px] border border-[var(--cohere-hairline)] transition-colors duration-200",
          isCompact ? "h-8 w-8" : "h-9 w-9",
          "bg-[var(--cohere-stone)] text-[var(--cohere-ink)]",
          "hover:bg-[var(--cohere-hairline)]",
          disabled && "opacity-30 cursor-not-allowed"
        )}
      >
        <Delete className="size-4" />
      </button>

      <button
        type="button"
        aria-label={confirming ? "Confirm clear sentence" : "Clear sentence"}
        onClick={handleClearClick}
        disabled={disabled}
        className={cn(
          "relative flex items-center justify-center rounded-[30px] border border-[var(--cohere-hairline)] px-4 font-sans font-medium transition-colors duration-200",
          isCompact ? "h-8" : "h-9",
          disabled && "opacity-30 cursor-not-allowed",
          confirming 
            ? "border-[var(--cohere-error)] bg-white text-[var(--cohere-error)]" 
            : "bg-[var(--cohere-stone)] text-[var(--cohere-ink)] hover:bg-[var(--cohere-hairline)]"
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
              <span className="text-[10px]">Yakin?</span>
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
              <span className="text-[10px]">Hapus</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
