"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  Share2,
  Trash2,
  Volume2,
  Download,
  Activity,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { CameraState } from "./WebcamCapture";

/* ═══════════════════════════════════════════════════════════════════════════
   COHERE DESIGN SYSTEM TOKENS (DESIGN.md)
   Mapped for a stark, controlled editorial AI command center.
   ═══════════════════════════════════════════════════════════════════════════ */

const COLORS = {
  primary: "#17171c",  // Near-Black Primary
  canvas: "#ffffff",   // Canvas White
  stone: "#eeece7",    // Soft Stone
  hairline: "#d9d9dd", // Hairline Rule
  ink: "#212121",      // Body Ink
  muted: "#93939f",    // Muted Slate
  slate: "#75758a",    // Technical Slate
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
  appState: CameraState;
  onClearTranscript: () => void;
  sessionStart?: Date | null;
  onSpeakEntry?: (text: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */

type ClockListener = () => void;
const clockListeners = new Set<ClockListener>();
let clockInterval: ReturnType<typeof setInterval> | null = null;

function subscribeToClock(listener: ClockListener) {
  clockListeners.add(listener);
  if (!clockInterval) {
    clockInterval = setInterval(() => clockListeners.forEach(l => l()), 1000);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

function useSystemTime() {
  return useSyncExternalStore(subscribeToClock, () => Math.floor(Date.now() / 1000), () => 0);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
      <div className="w-16 h-[1px] bg-[#d9d9dd] relative overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-[#17171c]"
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
  appState,
  onClearTranscript,
  sessionStart,
  onSpeakEntry,
}: PredictionDisplayProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const now = useSystemTime();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  const sessionDuration = useMemo(() => {
    if (!sessionStart) return 0;
    return Math.max(0, now - Math.floor(sessionStart.getTime() / 1000));
  }, [sessionStart, now]);

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
      className="flex flex-col h-full border-l selection:bg-[#17171c] selection:text-white"
      style={{ backgroundColor: COLORS.canvas, borderColor: COLORS.hairline }}
    >
      {/* HEADER: Technical Identity & Status */}
      <header 
        className="px-8 py-8 flex items-center justify-between border-b"
        style={{ borderColor: COLORS.hairline }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Maximize2 size={14} style={{ color: COLORS.primary }} />
            <h2 className={TYPE.mono} style={{ color: COLORS.primary }}>
              System_Output
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <TechnicalLabel>Log_Active // {formatDuration(sessionDuration)}</TechnicalLabel>
            {appState === "detecting" && (
              <div className="flex items-center gap-2">
                <div className="size-1 rounded-full animate-pulse" style={{ backgroundColor: COLORS.primary }} />
                <span className={TYPE.mono} style={{ color: COLORS.primary }}>Live</span>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onClearTranscript}
          disabled={transcript.length === 0}
          className="p-2 hover:opacity-50 transition-opacity disabled:opacity-10"
          title="Flush Buffer"
        >
          <Trash2 size={18} strokeWidth={1.5} style={{ color: COLORS.primary }} />
        </button>
      </header>

      {/* STREAM: Editorial List with Hairline Rules */}
      <main 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-8 py-12 space-y-16 scroll-smooth scrollbar-none"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {transcript.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center space-y-6"
            >
              <Activity size={48} strokeWidth={0.5} style={{ color: COLORS.hairline }} />
              <div className="text-center space-y-2">
                <p className={TYPE.body} style={{ color: COLORS.muted }}>
                  Sensor array ready.
                </p>
                <div className={TYPE.mono} style={{ color: COLORS.slate }}>
                  Awaiting movement protocol
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

      {/* FOOTER: Enterprise Actions */}
      <footer 
        className="p-8 space-y-8 border-t"
        style={{ backgroundColor: COLORS.stone, borderColor: COLORS.hairline }}
      >
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            disabled={transcript.length === 0}
            className={`flex-1 h-12 flex items-center justify-center gap-2 border transition-colors disabled:opacity-20 ${TYPE.body}`}
            style={{ 
              borderColor: COLORS.primary, 
              color: COLORS.primary,
              borderRadius: "32px",
              fontWeight: 500,
            }}
          >
            <Download size={14} />
            <span className="uppercase tracking-normal text-[13px]">Export_Log</span>
          </button>

          <button 
            onClick={handleShare}
            disabled={transcript.length === 0}
            className={`flex-1 h-12 flex items-center justify-center gap-2 transition-colors disabled:opacity-20 text-white ${TYPE.body}`}
            style={{ 
              backgroundColor: COLORS.primary, 
              borderRadius: "32px",
              fontWeight: 500,
            }}
          >
            <Share2 size={14} />
            <span className="uppercase tracking-normal text-[13px]">Transmit</span>
          </button>
        </div>

        <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
          <div className="flex items-center gap-3">
             <div className="size-1.5 rounded-full" style={{ backgroundColor: COLORS.primary }} />
             <TechnicalLabel className="text-[#616161]">Signify_Core // v3.0.4</TechnicalLabel>
          </div>
          <TechnicalLabel>Access: Internal_Only</TechnicalLabel>
        </div>
      </footer>
    </div>
  );
}

export default PredictionDisplay;
