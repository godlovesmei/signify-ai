"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import {
  clearHistoryEntries,
  getHistorySessions,
  removeHistorySession,
  type HistorySession,
} from "@/lib/userData";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPageContent() {
  const [sessions, setSessions] = useState<HistorySession[]>(() => getHistorySessions());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  function refreshSessions() {
    setSessions(getHistorySessions());
  }

  function handleDeleteSession(sessionId: string) {
    removeHistorySession(sessionId);
    if (expandedSessionId === sessionId) setExpandedSessionId(null);
    refreshSessions();
  }

  function handleClearAll() {
    clearHistoryEntries();
    setExpandedSessionId(null);
    refreshSessions();
  }

  async function copySessionText(session: HistorySession) {
    try {
      await navigator.clipboard.writeText(session.text.trim());
      setCopiedSessionId(session.sessionId);
      setTimeout(() => setCopiedSessionId(null), 1500);
    } catch {
      setCopiedSessionId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <PageHeader
        title="History"
        description={`${sessions.length} saved session${sessions.length === 1 ? "" : "s"}`}
        actions={
          sessions.length > 0 && (
            <Button onClick={handleClearAll} variant="outline" size="sm">
              Clear all
            </Button>
          )
        }
        className="mb-6"
      />

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Belum ada history</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mulai deteksi di halaman Translate. Setiap huruf yang berhasil di-commit akan otomatis tersimpan.
          </p>
          <Button asChild className="mt-5">
            <Link href="/translate">Go to Translate</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.sessionId;
            const confidence = Math.round(session.averageConfidence * 100);

            return (
              <article key={session.sessionId} className="rounded-2xl border border-border bg-card p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Session {formatDate(session.startedAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {session.entries.length} entries • avg confidence {confidence}% • {session.language}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copySessionText(session)}
                      variant="outline"
                      size="icon"
                      disabled={!session.text.trim()}
                      aria-label={copiedSessionId === session.sessionId ? "Copied" : "Copy transcript"}
                      title={copiedSessionId === session.sessionId ? "Copied" : "Copy transcript"}
                    >
                      {copiedSessionId === session.sessionId ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
                      variant="ghost"
                      size="icon"
                      aria-label={isExpanded ? "Hide full transcript" : "View full transcript"}
                      title={isExpanded ? "Hide full transcript" : "View full transcript"}
                    >
                      {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSession(session.sessionId)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      aria-label="Delete session"
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div
                  className={[
                    "mt-3 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm leading-relaxed",
                    isExpanded ? "history-session-full" : "history-session-preview",
                  ].join(" ")}
                >
                  {session.text || "(empty transcript)"}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}