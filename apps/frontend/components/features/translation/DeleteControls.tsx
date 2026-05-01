"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const timeoutId = setTimeout(() => setConfirming(false), 0);
    return () => clearTimeout(timeoutId);
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
    <div className="flex items-center gap-1.5" role="group" aria-label="Text editing controls">
      <button
        type="button"
        onClick={onDeleteLast}
        disabled={disabled}
        aria-label="Delete last character"
        className={cn(
          "flex items-center justify-center rounded-xl border transition-all duration-200",
          isCompact ? "h-9 w-9" : "h-10 w-10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/50 focus-visible:ring-offset-1",
          disabled
            ? "cursor-not-allowed border-border/60 dark:border-white/5 bg-muted/55 dark:bg-white/5 text-muted-foreground/30 opacity-50"
            : "border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5 text-muted-foreground/75 hover:bg-warning/10 hover:text-warning hover:border-warning/30 active:scale-[0.97]"
        )}
      >
        <Delete className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={handleClearClick}
        disabled={disabled}
        aria-label={confirming ? "Tap again to confirm clear all" : "Clear all text"}
        aria-pressed={confirming}
        className={cn(
          "flex items-center gap-1.5 rounded-xl transition-all duration-200",
          isCompact ? "h-9 px-2.5 text-xs" : "h-10 px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 focus-visible:ring-offset-1",
          disabled && "cursor-not-allowed text-muted-foreground/20 opacity-50 pointer-events-none",
          !disabled &&
            !confirming &&
            "text-muted-foreground/75 hover:bg-destructive/10 hover:text-destructive border border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5",
          !disabled && confirming && "border border-destructive/40 bg-destructive/10 font-medium text-destructive"
        )}
      >
        <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{confirming ? "Tap again" : "Clear"}</span>
      </button>
    </div>
  );
}
