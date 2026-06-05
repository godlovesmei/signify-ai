"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Share2,
  Volume2,
  Download,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface TranscriptEntry {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
  language: string;
}

export interface PredictionDisplayProps {
  transcript: TranscriptEntry[];
  onSpeakEntry?: (text: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function TechnicalLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-normal text-cohere-muted sm:text-[11px]",
        className
      )}
    >
      {children}
    </span>
  );
}

function ConfidenceIndicator({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="relative h-[1px] w-12 overflow-hidden bg-cohere-hairline sm:w-16">
        <motion.div
          className="absolute inset-y-0 left-0 bg-cohere-ink"
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-cohere-slate sm:text-[11px]">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function PredictionDisplay({
  transcript,
  onSpeakEntry,
}: PredictionDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = () => {
    if (transcript.length === 0) return;
    const content = transcript
      .map(
        (e) =>
          `[${e.timestamp.toISOString()}] ${e.text} (conf: ${e.confidence.toFixed(2)})`
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signify-session-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = transcript.map((e) => e.text).join(" ");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Signify AI Transcript", text });
      } catch {}
    }
  };

  return (
    <div className="flex h-full min-h-full flex-col bg-cohere-canvas text-cohere-ink selection:bg-cohere-ink selection:text-cohere-canvas">
      <div
        ref={scrollContainerRef}
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scroll-smooth scrollbar-none sm:space-y-8 sm:px-4 sm:py-6 md:px-6 lg:px-8"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {transcript.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[180px] flex-col items-center justify-center space-y-4 py-8 sm:min-h-[220px] sm:space-y-6 sm:py-10"
            >
              <Activity
                size={40}
                strokeWidth={0.5}
                className="text-cohere-hairline sm:size-12"
              />
              <div className="space-y-1.5 text-center sm:space-y-2">
                <p className="text-sm text-cohere-muted sm:text-base">
                  Belum ada riwayat.
                </p>
                <p className="text-xs text-cohere-slate sm:text-sm">
                  Mulai kamera, lalu arahkan tangan.
                </p>
              </div>
            </motion.div>
          ) : (
            transcript.map((entry) => (
              <motion.section
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative"
              >
                <div className="flex items-center justify-between border-b border-cohere-hairline pb-2 mb-4 sm:pb-3 sm:mb-6">
                  <div className="flex items-center gap-4 sm:gap-8">
                    <TechnicalLabel>
                      {entry.timestamp.toLocaleTimeString([], {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TechnicalLabel>
                    <ConfidenceIndicator value={entry.confidence} />
                  </div>

                  <div className="flex items-center gap-2 opacity-100 transition-opacity duration-300 sm:gap-4 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Speak transcript entry ${entry.text}`}
                      onClick={() => onSpeakEntry?.(entry.text)}
                      className="p-1.5 text-cohere-slate transition-opacity hover:opacity-60 sm:p-1"
                    >
                      <Volume2 size={15} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Copy transcript entry ${entry.text}`}
                      onClick={() => handleCopy(entry.text, entry.id)}
                      className="p-1.5 text-cohere-slate transition-opacity hover:opacity-60 sm:p-1"
                    >
                      {copiedId === entry.id ? (
                        <Check size={15} />
                      ) : (
                        <Copy size={15} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                <h3 className="font-display text-2xl leading-[1.2] tracking-normal text-cohere-ink sm:text-[32px]">
                  {entry.text}
                </h3>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <footer className="shrink-0 border-t border-cohere-hairline bg-cohere-stone p-3 sm:p-4 md:p-6">
        <div className="flex gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Download translation transcript"
            onClick={handleExport}
            disabled={transcript.length === 0}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-cohere-ink text-cohere-ink transition-colors disabled:opacity-20 sm:h-12 sm:gap-2",
              "text-xs font-medium sm:text-sm",
              "hover:bg-cohere-ink hover:text-cohere-canvas"
            )}
          >
            <Download size={13} className="sm:size-[14px]" />
            <span>Unduh</span>
          </button>

          <button
            type="button"
            aria-label="Share translation transcript"
            onClick={handleShare}
            disabled={transcript.length === 0}
            className={cn(
              "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-cohere-ink text-cohere-canvas transition-colors disabled:opacity-20 sm:h-12 sm:gap-2",
              "text-xs font-medium sm:text-sm",
              "hover:bg-cohere-primary"
            )}
          >
            <Share2 size={13} className="sm:size-[14px]" />
            <span>Bagikan</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default PredictionDisplay;
