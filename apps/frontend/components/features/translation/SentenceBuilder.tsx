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
        "bg-[var(--cohere-canvas)]",
        "border-[var(--cohere-hairline)]",
        isSticky
          ? "h-full gap-2 rounded-md p-3"
          : "gap-3 rounded-sm p-4",
        isSpeaking && "border-[var(--cohere-primary)]",
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
          <span className="select-none text-[10px] uppercase tracking-normal text-[var(--cohere-muted)] font-mono py-1">
            Belum ada huruf
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
                  "border-[var(--cohere-hairline)]",
                  "bg-[var(--cohere-stone)] text-[var(--cohere-ink)]",
                  isLatest && "border-[var(--cohere-primary)] underline underline-offset-4 decoration-1"
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
          "rounded-sm border border-[var(--cohere-hairline)] bg-transparent",
          "font-sans leading-relaxed break-words transition-colors duration-300",
          isSticky
            ? "min-h-11 flex-1 overflow-y-auto px-3 py-2"
            : "min-h-[52px] px-4 py-3",
          isEmpty ? "text-[var(--cohere-muted)] italic" : "text-[var(--cohere-ink)]"
        )}
        style={{ fontSize: sentenceFontSize }}
      >
        {isEmpty ? "Hasil muncul di sini..." : sentence}
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
                "flex items-center gap-1.5 rounded-[30px] border border-[var(--cohere-hairline)] transition-colors duration-200",
                "bg-[var(--cohere-stone)] text-[var(--cohere-ink)]",
                "hover:bg-[var(--cohere-hairline)]",
                isSticky ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
                "font-sans font-medium"
              )}
            >
              <span aria-hidden="true" className="font-mono text-base leading-none">
                ⎵
              </span>
              <span>Spasi</span>
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
            <span className="font-mono text-[10px] uppercase tracking-normal text-[var(--cohere-muted)]">
              {sentence.length} karakter
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
