"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("workspace.translate");
  const sentence = tokens.join("");
  const isEmpty = tokens.length === 0;
  const stripRef = useRef<HTMLDivElement>(null);
  const isSticky = variant === "sticky";

  useEffect(() => {
    if (stripRef.current) {
      stripRef.current.scrollLeft = stripRef.current.scrollWidth;
    }
  }, [tokens.length]);

  // Responsive font size
  const sentenceFontSize = isSticky
    ? `${Math.max(0.875, Math.min(1.25, 1.05 * textScale))}rem`
    : `${Math.max(1, Math.min(1.5, 1.25 * textScale))}rem`;

  return (
    <div
      aria-label={t("sentenceBuilder")}
      className={cn(
        "flex flex-col border transition-all duration-300",
        "bg-cohere-canvas",
        "border-cohere-hairline",
        isSticky
          ? "h-full gap-2 rounded-md p-2.5 sm:gap-2 sm:p-3"
          : "gap-2.5 rounded-sm p-3 sm:gap-3 sm:p-4",
        isSpeaking && "border-cohere-primary",
        className
      )}
    >
      {isSpeaking && (
        <span className="sr-only" aria-live="assertive" aria-atomic="true">
          {t("speaking", { sentence })}
        </span>
      )}

      {/* Token history strip */}
      <div
        ref={stripRef}
        className={cn(
          "flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          isSticky && "min-h-6 sm:min-h-7"
        )}
        aria-label={t("confirmedLetters")}
        role="list"
      >
        {isEmpty ? (
          <span className="select-none py-1 font-mono text-[10px] uppercase tracking-normal text-cohere-muted">
            {t("emptyLetters")}
          </span>
        ) : (
          tokens.map((token, i) => {
            const isLatest = i === tokens.length - 1;
            return (
              <span
                key={i}
                role="listitem"
                aria-label={`${token}${isLatest ? ", latest" : ""}`}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] transition-all duration-150 sm:text-xs",
                  isSticky
                    ? "h-6 w-6 sm:h-7 sm:w-7"
                    : "h-7 w-7 sm:h-8 sm:w-8",
                  "border-cohere-hairline",
                  "bg-cohere-stone text-cohere-ink",
                  isLatest &&
                    "border-cohere-primary underline underline-offset-4 decoration-1"
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
        aria-label={t("builtSentence")}
        className={cn(
          "rounded-sm border border-cohere-hairline bg-transparent",
          "break-words font-sans leading-relaxed transition-colors duration-300",
          isSticky
            ? "min-h-9 flex-1 overflow-y-auto px-2.5 py-1.5 sm:min-h-11 sm:px-3 sm:py-2"
            : "min-h-[44px] px-3 py-2 sm:min-h-[52px] sm:px-4 sm:py-3",
          isEmpty
            ? "italic text-cohere-muted"
            : "text-cohere-ink"
        )}
        style={{ fontSize: sentenceFontSize }}
      >
        {isEmpty ? t("emptySentence") : sentence}
      </div>

      {/* Quick actions */}
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          isSticky ? "flex-nowrap" : "flex-wrap sm:flex-nowrap"
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onAddSpace && (
            <button
              type="button"
              onClick={onAddSpace}
              aria-label={t("addSpace")}
              className={cn(
                "flex items-center gap-1 rounded-[30px] border border-cohere-hairline transition-colors duration-200",
                "bg-cohere-stone text-cohere-ink",
                "hover:bg-cohere-hairline",
                "h-9 px-2.5 text-[11px] font-medium sm:h-9 sm:px-4 sm:text-sm",
                "min-w-[44px] touch-manipulation"
              )}
            >
              <span
                aria-hidden="true"
                className="font-mono text-sm leading-none sm:text-base"
              >
                ⎵
              </span>
              <span className="hidden sm:inline">{t("space")}</span>
            </button>
          )}
          <DeleteControls
            onDeleteLast={onDeleteLast}
            onClearAll={onClearAll}
            disabled={isEmpty}
            size={isSticky ? "compact" : "default"}
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isEmpty && !isSticky && (
            <span className="hidden font-mono text-[10px] uppercase tracking-normal text-cohere-muted sm:inline">
              {t("characters", { count: sentence.length })}
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
