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
        "flex flex-col border transition-all duration-300",
        "bg-[var(--cohere-canvas)] dark:bg-zinc-950",
        "border-[var(--cohere-hairline)] dark:border-zinc-800",
        isSticky
          ? "h-full gap-2 rounded-md p-3"
          : "gap-3 rounded-lg p-4",
        isSpeaking && "border-zinc-900 dark:border-zinc-100",
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
          <span className="select-none text-[10px] uppercase tracking-wider text-[var(--cohere-muted)] font-mono py-1">
            History Empty
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
                  "inline-flex shrink-0 items-center justify-center rounded-sm border",
                  isSticky ? "h-7 w-7" : "h-8 w-8",
                  "font-mono text-xs transition-all duration-150",
                  "border-[var(--cohere-hairline)] dark:border-zinc-800",
                  "bg-[var(--cohere-stone)] dark:bg-zinc-900 text-[var(--cohere-ink)] dark:text-zinc-300",
                  isLatest && "font-bold border-zinc-900 dark:border-zinc-100 underline underline-offset-4 decoration-1"
                )}
              >
                {token === " " ? "\u00A0" : token}
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
          "rounded-md border border-[var(--cohere-hairline)] dark:border-zinc-800 bg-transparent",
          "font-sans leading-relaxed break-words transition-colors duration-300",
          isSticky
            ? "min-h-11 flex-1 overflow-y-auto px-3 py-2"
            : "min-h-[52px] px-4 py-3",
          isEmpty ? "text-[var(--cohere-muted)] italic" : "text-[var(--cohere-ink)] dark:text-zinc-100"
        )}
        style={{ fontSize: sentenceFontSize }}
      >
        {isEmpty ? "Interpretation appears here…" : sentence}
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
                "flex items-center gap-1.5 rounded-full border border-[var(--cohere-hairline)] dark:border-zinc-800 transition-all duration-200",
                "bg-[var(--cohere-stone)] dark:bg-zinc-900 text-[var(--cohere-ink)] dark:text-zinc-300",
                "hover:bg-[var(--cohere-hairline)] dark:hover:bg-zinc-800",
                isSticky ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
                "font-sans font-medium"
              )}
            >
              <span aria-hidden="true" className="font-mono text-base leading-none">
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
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--cohere-muted)]">
              {sentence.length} TOKENS
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
