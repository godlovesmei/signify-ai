"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import DeleteControls from "./DeleteControls";
import TTSButton from "@/components/tts/TTSButton";

export interface SentenceBuilderProps {
  tokens: string[];
  isSpeaking: boolean;
  onDeleteLast: () => void;
  onClearAll: () => void;
  onSpeak: () => void;
  onAddSpace?: () => void;
  isTtsError?: boolean;
  textScale?: number;
  variant?: "panel" | "sticky";
  className?: string;
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
  variant = "panel",
  className,
}: SentenceBuilderProps) {
  const sentence = tokens.join("");
  const isEmpty = tokens.length === 0;
  const stripRef = useRef<HTMLDivElement>(null);
  const isSticky = variant === "sticky";

  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, [tokens.length]);

  const sentenceFontSize = isSticky
    ? `${Math.max(1, Math.min(1.35, 1.05 * textScale))}rem`
    : `${Math.max(1, 1.25 * textScale)}rem`;

  return (
    <div
      aria-label="Sentence builder"
      className={cn(
        "flex flex-col border bg-card/90 transition-all duration-300",
        isSticky
          ? "h-full gap-2 rounded-xl p-3 shadow-[0_-18px_40px_-28px_rgba(var(--shadow-color),0.8)]"
          : "gap-3 rounded-2xl p-4",
        isSpeaking
          ? "border-primary/30 bg-primary/5 shadow-glow-primary/20"
          : "border-border/80 dark:border-white/10",
        className
      )}
    >
      {isSpeaking && (
        <span className="sr-only" aria-live="assertive" aria-atomic="true">
          Speaking: {sentence}
        </span>
      )}

      {/* Token history strip */}
      <div
        ref={stripRef}
        className={cn(
          "flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isSticky && "min-h-7"
        )}
        aria-label="Confirmed letter history"
        role="list"
      >
        {isEmpty ? (
          <span className="select-none text-xs text-muted-foreground/30 tracking-wide">
            Letters appear here as you sign…
          </span>
        ) : (
          tokens.map((token, i) => {
            const isLatest = i === tokens.length - 1;
            return (
              <span
                key={i}
                role="listitem"
                aria-label={`Letter ${token}${isLatest ? ", latest" : ""}`}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-lg",
                  isSticky ? "h-7 w-7" : "h-8 w-8",
                  "font-display text-sm font-semibold transition-all duration-150",
                  token === " "
                    ? isLatest
                      ? "bg-primary/15 ring-1 ring-primary/30 scale-105"
                      : "bg-muted/70 dark:bg-white/5"
                    : isLatest
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30 scale-105 animate-prediction-pop"
                    : "bg-muted/70 dark:bg-white/5 text-muted-foreground/80"
                )}
              >
                {token === " " ? "·" : token}
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
          "rounded-xl border border-border/70 dark:border-white/5 bg-muted/55 dark:bg-black/20",
          "font-medium leading-relaxed break-words transition-colors duration-300",
          isSticky
            ? "min-h-11 flex-1 overflow-y-auto px-3 py-2"
            : "min-h-[52px] px-4 py-3",
          isEmpty && "text-muted-foreground/45"
        )}
        style={{ fontSize: sentenceFontSize }}
      >
        {isEmpty ? "Your sentence builds here…" : sentence}
      </div>

      {/* Quick actions */}
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          isSticky ? "flex-nowrap" : "flex-wrap"
        )}
      >
        <div className="flex items-center gap-2">
          {onAddSpace && (
            <button
              type="button"
              onClick={onAddSpace}
              aria-label="Add space"
              className={cn(
                "flex items-center gap-1.5 rounded-xl border transition-all duration-200",
                isSticky ? "h-9 px-2.5 text-xs" : "h-10 px-3 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                "border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5 text-muted-foreground/75",
                "hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
                "active:scale-[0.97]"
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">
                ⎵
              </span>
              <span>Space</span>
            </button>
          )}
          <DeleteControls
            onDeleteLast={onDeleteLast}
            onClearAll={onClearAll}
            disabled={isEmpty}
            size={isSticky ? "compact" : "default"}
          />
        </div>

        <div className="flex items-center gap-2">
          {!isEmpty && !isSticky && (
            <span className="font-mono text-xs tabular-nums text-muted-foreground/55">
              {sentence.length} char{sentence.length !== 1 ? "s" : ""}
            </span>
          )}
          <TTSButton
            sentence={sentence}
            isSpeaking={isSpeaking}
            hasError={isTtsError}
            onSpeak={onSpeak}
            size={isSticky ? "compact" : "default"}
          />
        </div>
      </div>
    </div>
  );
}
