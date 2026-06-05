"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Eye, Trash2, History, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
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
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const result = await getHistorySessions();
      setSessions(result.sessions);
      setPage(0);
      setHasMore(result.hasMore);
    } catch {
      setLoadError(true);
      toast.error("Translation history could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  async function handleDeleteSession(sessionId: string) {
    const previous = sessions;
    setSessions((current) =>
      current.filter((session) => session.sessionId !== sessionId),
    );
    if (expandedSessionId === sessionId) setExpandedSessionId(null);
    try {
      await removeHistorySession(sessionId);
      toast.success("Translation session deleted.");
    } catch {
      setSessions(previous);
      toast.error("Session deletion failed. Restored the session.");
    }
  }

  async function handleClearAll() {
    const previous = sessions;
    setSessions([]);
    setExpandedSessionId(null);
    try {
      await clearHistoryEntries();
      setHasMore(false);
      toast.success("Translation history cleared.");
    } catch {
      setSessions(previous);
      toast.error("History could not be cleared.");
    }
  }

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getHistorySessions({ page: nextPage });
      setSessions((current) => [...current, ...result.sessions]);
      setPage(nextPage);
      setHasMore(result.hasMore);
    } catch {
      toast.error("More history could not be loaded.");
    } finally {
      setIsLoadingMore(false);
    }
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
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <PageHeader
        title="History"
        description={`${sessions.length} saved session${sessions.length === 1 ? "" : "s"}`}
        actions={
          sessions.length > 0 && (
            <Button onClick={handleClearAll} variant="outline" size="sm" className="hover:text-cohere-error">
              Clear all
            </Button>
          )
        }
        className="mb-8"
      />

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-[22px] border border-cohere-hairline bg-cohere-stone">
          <Loader2 className="size-5 animate-spin text-cohere-slate" aria-label="Loading history" />
        </div>
      ) : loadError ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-[22px] border border-cohere-hairline bg-cohere-stone text-center">
          <p className="text-[16px] text-cohere-body-muted">History is temporarily unavailable.</p>
          <Button onClick={() => void refreshSessions()} variant="outline" className="mt-5">
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[22px] border border-cohere-hairline bg-cohere-stone p-10 text-center md:p-14">
          <div className="mb-6 flex size-14 items-center justify-center rounded-sm bg-cohere-canvas">
            <History className="size-6 text-cohere-slate" />
          </div>
          <h2 className="text-[32px] leading-[1.2]">No history yet</h2>
          <p className="mt-3 max-w-sm text-[16px] leading-[1.5] text-cohere-body-muted">
            Real-time decoded signs will appear here once a translation session starts.
          </p>
          <Button asChild className="mt-8">
            <Link href="/translate">Start translation</Link>
          </Button>
        </div>
      ) : (
        <div className="border-t border-cohere-hairline">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.sessionId;
            const confidence = Math.round(session.averageConfidence * 100);

            return (
              <article key={session.sessionId} className="border-b border-cohere-hairline py-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-cohere-stone text-cohere-ink">
                      <History className="size-5" />
                    </div>
                    <div>
                      <p className="text-[18px] leading-[1.4]">Session {formatDate(session.startedAt)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-cohere-slate">
                        <span>{session.entryCount} entries</span>
                        <span>{session.language}</span>
                        <span className={confidence >= 80 ? "text-cohere-green" : "text-cohere-coral"}>
                          {confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={`Copy session from ${formatDate(session.startedAt)}`}
                      onClick={() => copySessionText(session)}
                      variant="secondary"
                      size="icon-sm"
                    >
                      {copiedSessionId === session.sessionId ? <Check className="size-4 text-cohere-green" /> : <Copy className="size-4" />}
                    </Button>
                    <Button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} session from ${formatDate(session.startedAt)}`}
                      variant="secondary"
                      size="icon-sm"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteSession(session.sessionId)}
                      aria-label={`Delete session from ${formatDate(session.startedAt)}`}
                      variant="secondary"
                      size="icon-sm"
                      className="text-cohere-error hover:text-cohere-error"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "mt-5 rounded-sm bg-cohere-stone p-4 text-[16px] leading-[1.5] text-cohere-ink",
                    !isExpanded && "line-clamp-2"
                  )}
                >
                  {session.text || <span className="italic text-cohere-slate">Empty transcript</span>}
                </div>
              </article>
            );
          })}
          {hasMore && (
            <div className="flex justify-center py-8">
              <Button
                onClick={() => void handleLoadMore()}
                variant="outline"
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="size-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
