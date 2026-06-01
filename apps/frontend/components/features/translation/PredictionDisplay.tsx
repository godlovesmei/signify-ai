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

/* ═══════════════════════════════════════════════════════════════════════════
   COHERE DESIGN SYSTEM TOKENS (DESIGN.md)
   Mapped for a stark, controlled editorial AI command center.
   ═══════════════════════════════════════════════════════════════════════════ */

const COLORS = {
  action: "var(--cohere-ink)",
  actionText: "var(--cohere-canvas)",
  canvas: "var(--cohere-canvas)",
  stone: "var(--cohere-stone)",
  hairline: "var(--cohere-hairline)",
  ink: "var(--cohere-ink)",
  muted: "var(--cohere-muted)",
  slate: "var(--cohere-slate)",
};

const TYPE = {
  h1: "text-[32px] leading-[1.2] tracking-normal font-normal font-[var(--font-sans)]",
  mono: "text-[14px] leading-[1.4] tracking-normal font-normal font-[var(--font-mono)] uppercase",
  body: "text-[16px] leading-[1.5] tracking-normal font-normal font-[var(--font-sans)]",
  micro: "text-[12px] leading-[1.4] tracking-normal font-normal font-[var(--font-sans)]",
};

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
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

function TechnicalLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`${TYPE.mono} ${className}`} style={{ color: COLORS.muted }}>
      {children}
    </span>
  );
}

function ConfidenceIndicator({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-[1px] w-16 overflow-hidden"
        style={{ backgroundColor: COLORS.hairline }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: COLORS.action }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5, ease: "circOut" }}
        />
      </div>
      <span className={TYPE.mono} style={{ color: COLORS.slate }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: PREDICTION DISPLAY
   ═══════════════════════════════════════════════════════════════════════════ */

export function PredictionDisplay({
  transcript,
  onSpeakEntry,
}: PredictionDisplayProps) {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = () => {
    if (transcript.length === 0) return;
    const content = transcript.map(e => 
      `[${e.timestamp.toISOString()}] ${e.text} (conf: ${e.confidence.toFixed(2)})`
    ).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signify-session-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const text = transcript.map(e => e.text).join(" ");
    if (navigator.share) {
      try { await navigator.share({ title: "Signify AI Transcript", text }); } catch {}
    }
  };

  return (
    <div 
      className="flex min-h-full flex-col selection:bg-cohere-ink selection:text-cohere-canvas"
      style={{ backgroundColor: COLORS.canvas, borderColor: COLORS.hairline }}
    >
      <main 
        ref={scrollContainerRef}
        className="flex-1 min-h-[280px] space-y-10 overflow-y-auto px-4 py-8 scroll-smooth scrollbar-none md:px-6 lg:px-8"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {transcript.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[220px] flex-col items-center justify-center space-y-6 py-10"
            >
              <Activity size={48} strokeWidth={0.5} style={{ color: COLORS.hairline }} />
              <div className="text-center space-y-2">
                <p className={TYPE.body} style={{ color: COLORS.muted }}>
                  Belum ada riwayat.
                </p>
                <div className="text-sm" style={{ color: COLORS.slate }}>
                  Mulai kamera, lalu arahkan tangan.
                </div>
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
                <div 
                  className="flex items-center justify-between border-b pb-3 mb-6"
                  style={{ borderColor: COLORS.hairline }}
                >
                  <div className="flex items-center gap-8">
                    <TechnicalLabel>
                      {entry.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </TechnicalLabel>
                    <ConfidenceIndicator value={entry.confidence} />
                  </div>

                  <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => onSpeakEntry?.(entry.text)}
                      className="p-1 hover:opacity-60 transition-opacity"
                      style={{ color: COLORS.slate }}
                    >
                      <Volume2 size={16} strokeWidth={1.5} />
                    </button>
                    <button 
                      onClick={() => handleCopy(entry.text, entry.id)}
                      className="p-1 hover:opacity-60 transition-opacity"
                      style={{ color: COLORS.slate }}
                    >
                      {copiedId === entry.id ? <Check size={16} /> : <Copy size={16} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <h3 className={TYPE.h1} style={{ color: COLORS.ink }}>
                  {entry.text}
                </h3>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </main>

      <footer
        className="border-t p-4 md:p-6"
        style={{ backgroundColor: COLORS.stone, borderColor: COLORS.hairline }}
      >
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            disabled={transcript.length === 0}
            className={`flex-1 h-12 flex items-center justify-center gap-2 border transition-colors disabled:opacity-20 ${TYPE.body}`}
            style={{ 
              borderColor: COLORS.action,
              color: COLORS.action,
              borderRadius: "32px",
              fontWeight: 500,
            }}
          >
            <Download size={14} />
            <span className="text-[13px]">Unduh</span>
          </button>

          <button 
            onClick={handleShare}
            disabled={transcript.length === 0}
            className={`flex-1 h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-20 text-white ${TYPE.body}`}
            style={{ 
              backgroundColor: COLORS.action,
              color: COLORS.actionText,
              borderRadius: "32px",
              fontWeight: 500,
            }}
          >
            <Share2 size={14} />
            <span className="text-[13px]">Bagikan</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default PredictionDisplay;
