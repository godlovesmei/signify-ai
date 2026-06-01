"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye, EyeOff, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
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
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
      <PageHeader
        title="History"
        description={`${sessions.length} saved session${sessions.length === 1 ? "" : "s"}`}
        actions={
          sessions.length > 0 && (
            <Button 
              onClick={handleClearAll} 
              variant="outline" 
              size="sm"
              className="rounded-xl border-border/10 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Clear all
            </Button>
          )
        }
        className="mb-8"
      />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-border/10 bg-card/30 p-12 text-center backdrop-blur-xl">
          <div className="mb-6 rounded-full bg-foreground/5 p-8">
             <History className="size-12 opacity-20" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">No History Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground/60 max-w-[280px] leading-relaxed">
            Your real-time decoded signs will appear here once you start a translation session.
          </p>
          <Button asChild className="mt-8 rounded-2xl px-8 py-6 font-bold shadow-xl shadow-primary/10 transition-all hover:-translate-y-1">
            <Link href="/translate">Start Translation</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.sessionId;
            const confidence = Math.round(session.averageConfidence * 100);

            return (
              <article 
                key={session.sessionId} 
                className="group relative overflow-hidden rounded-[2rem] border border-border/10 bg-card/40 p-5 md:p-6 transition-all hover:bg-card/60"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground/5 text-foreground transition-colors group-hover:bg-foreground">
                       <History className="size-5 transition-colors group-hover:text-background" />
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight">Session {formatDate(session.startedAt)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          {session.entries.length} entries • {session.language}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-foreground/10" />
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          confidence >= 80 ? "text-success" : "text-warning"
                        )}>
                          {confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => copySessionText(session)}
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl hover:bg-foreground/5"
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
                      className="size-10 rounded-xl hover:bg-foreground/5"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteSession(session.sessionId)}
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-4 rounded-2xl bg-foreground/[0.03] p-4 text-sm md:text-base leading-relaxed break-words font-medium text-foreground/80",
                    !isExpanded && "line-clamp-2"
                  )}
                >
                  {session.text || <span className="italic opacity-20">Empty transcript</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}