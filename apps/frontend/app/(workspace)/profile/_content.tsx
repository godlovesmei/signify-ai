"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  History,
  Languages,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Volume2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  createDefaultPracticeStats,
  getHistorySessions,
  getPracticeStats,
  getTranslationHistoryTotals,
  type HistorySession,
  type PracticeStats,
} from "@/lib/userData";
import {
  TEXT_SCALE_OPTIONS,
  useAccessibilityPrefs,
} from "@/hooks/useAccessibilityPrefs";
import { getAccountProfile } from "@/lib/accountData";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

type ProfileState = {
  displayName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
  id: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  verified: boolean;
};

const FALLBACK_PROFILE: ProfileState = {
  displayName: "Nama User",
  email: "user@signify.ai",
  initials: "NU",
  avatarUrl: null,
  id: null,
  createdAt: null,
  lastSignInAt: null,
  verified: false,
};

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "U";
}

function formatUtcDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatUtcDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
}

function formatCompactId(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function describeTextScale(scale: number) {
  const match = Object.entries(TEXT_SCALE_OPTIONS).find(([, value]) =>
    Math.abs(value - scale) < 0.001
  );
  return match ? `${match[0]} (${scale.toFixed(2)}x)` : `${scale.toFixed(2)}x`;
}

function MetricTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-5">
      <div className="flex items-center gap-3 text-cohere-slate">
        <span className="flex size-10 items-center justify-center rounded-sm bg-cohere-stone">
          {icon}
        </span>
        <span className="text-mono-label text-[11px]">{label}</span>
      </div>
      <p className="mt-6 text-[40px] leading-none text-cohere-ink tabular-nums">{value}</p>
      <p className="mt-3 text-[13px] leading-[1.4] text-cohere-body-muted">{helper}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  subtle,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  subtle?: string;
}) {
  return (
    <div className="flex gap-4 border-t border-cohere-hairline pt-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-cohere-stone text-cohere-slate">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-mono-label text-[11px] text-cohere-slate">{label}</p>
        <p className="mt-1 break-words text-[14px] text-cohere-ink">{value}</p>
        {subtle && <p className="mt-1 text-[12px] text-cohere-slate">{subtle}</p>}
      </div>
    </div>
  );
}

function ShortcutButton({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-sm border border-cohere-hairline bg-cohere-canvas p-4 transition-colors hover:bg-cohere-stone"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-cohere-stone text-cohere-ink">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] text-cohere-ink">{label}</span>
        <span className="block text-[12px] text-cohere-slate">{description}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-cohere-slate" />
    </Link>
  );
}

function ActivityCardItem({ session }: { session: HistorySession }) {
  const confidence = Math.round(session.averageConfidence * 100);
  const preview = session.text.trim() || "(empty transcript)";
  const truncatedPreview =
    preview.length > 100 ? `${preview.slice(0, 100).trimEnd()}...` : preview;

  return (
    <article className="border-t border-cohere-hairline py-5">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-cohere-stone text-cohere-slate">
          <History className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[14px] text-cohere-ink">
              Session {formatUtcDateTime(session.endedAt)}
            </h3>
            <span className="rounded-[30px] border border-cohere-hairline px-2.5 py-1 text-[12px] text-cohere-slate">
              {session.language}
            </span>
          </div>
          <p className="mt-3 text-[14px] leading-[1.5] text-cohere-body-muted">{truncatedPreview}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-cohere-slate">
            <span>{session.entryCount} frames</span>
            <span>{confidence}% confidence</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function LetterFocusRow({
  letter,
  attempts,
  accuracy,
  maxAttempts,
}: {
  letter: string;
  attempts: number;
  accuracy: number;
  maxAttempts: number;
}) {
  const width = maxAttempts === 0 ? 0 : Math.max(8, Math.round((attempts / maxAttempts) * 100));

  return (
    <div className="border-t border-cohere-hairline py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-sm bg-cohere-primary text-[20px] text-white">
            {letter}
          </div>
          <div>
            <p className="text-[14px] text-cohere-ink">Gesture {letter}</p>
            <p className="text-[12px] text-cohere-slate">
              {attempts} iterations · {accuracy}% accuracy
            </p>
          </div>
        </div>
        <span className="text-[12px] text-cohere-slate tabular-nums">#{attempts}</span>
      </div>
      <div className="mt-4 h-1 bg-cohere-hairline">
        <div className="h-full bg-cohere-primary transition-all duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function ProfilePageContent() {
  const [profile, setProfile] = useState<ProfileState>(FALLBACK_PROFILE);
  const [practiceStats, setPracticeStats] = useState<PracticeStats>(
    createDefaultPracticeStats
  );
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [historyTotals, setHistoryTotals] = useState({
    sessionCount: 0,
    entryCount: 0,
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const prefs = useAccessibilityPrefs();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [account, stats, history, totals] = await Promise.all([
        getAccountProfile(),
        getPracticeStats(),
        getHistorySessions({ pageSize: 3 }),
        getTranslationHistoryTotals(),
      ]);

      setPracticeStats(stats);
      setHistorySessions(history.sessions);
      setHistoryTotals(totals);
      if (account) {
        setProfile({
          displayName: account.displayName,
          email: account.email,
          initials: getInitials(account.displayName),
          avatarUrl: account.avatarUrl,
          id: account.id,
          createdAt: account.createdAt,
          lastSignInAt: account.lastSignInAt,
          verified: account.verified,
        });
      }
    } catch {
      setLoadError(true);
      toast.error("Profile analytics could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const totalSessions = historyTotals.sessionCount;
  const totalEntries = historyTotals.entryCount;
  const practiceAccuracy =
    practiceStats.totalAttempts === 0
      ? 0
      : Math.round(
          (practiceStats.correctAttempts / practiceStats.totalAttempts) * 100
        );
  const topLetters = Object.entries(practiceStats.byLetter)
    .map(([letter, stats]) => ({
      letter,
      attempts: stats.attempts,
      correct: stats.correct,
      accuracy:
        stats.attempts === 0 ? 0 : Math.round((stats.correct / stats.attempts) * 100),
    }))
    .filter((item) => item.attempts > 0)
    .sort((a, b) => b.attempts - a.attempts || b.correct - a.correct)
    .slice(0, 4);

  const accountRows = [
    {
      icon: <Mail className="h-4 w-4" />,
      label: "Email",
      value: profile.email,
      subtle: "Primary login address",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      label: "Verification",
      value: profile.verified ? "Verified" : "Pending verification",
      subtle: profile.verified ? "Signed in with a verified account" : "Verify the address in your inbox",
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: "Member since",
      value: formatUtcDate(profile.createdAt),
      subtle: "Account created in Supabase Auth",
    },
    {
      icon: <History className="h-4 w-4" />,
      label: "Last sign-in",
      value: formatUtcDateTime(profile.lastSignInAt),
      subtle: "Most recent authentication event",
    },
    {
      icon: <User className="h-4 w-4" />,
      label: "Account ID",
      value: formatCompactId(profile.id),
      subtle: "Useful when referencing support or logs",
    },
    {
      icon: <Languages className="h-4 w-4" />,
      label: "Primary language",
      value: "BISINDO",
      subtle: "Workspace translation target",
    },
  ];

  const accessibilityRows = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      label: "High contrast",
      value: prefs.highContrast ? "On" : "Off",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "Text scale",
      value: describeTextScale(prefs.textScale),
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "TTS speed",
      value: `${prefs.ttsSpeed.toFixed(2)}x`,
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      label: "TTS volume",
      value: `${Math.round(prefs.ttsVolume * 100)}%`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 p-4 md:p-8">
      <PageHeader
        title="Profile"
        description="Account details, translation history, practice analytics, and workspace preferences."
        actions={
          isLoading ? (
            <Loader2 className="size-5 animate-spin text-cohere-slate" aria-label="Loading profile" />
          ) : loadError ? (
            <Button onClick={() => void loadProfile()} variant="outline" size="sm">
              <RefreshCw className="size-4" />
              Retry
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[22px] border border-cohere-hairline bg-cohere-canvas p-6 md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-cohere-primary text-[40px] text-white">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{profile.initials}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-mono-label text-[12px] text-cohere-slate">Operator ID</p>
              <h2 className="mt-3 font-display text-[44px] leading-none text-cohere-ink">
                {profile.displayName}
              </h2>
              <p className="mt-3 text-[14px] text-cohere-slate">
                Sync status: {practiceAccuracy >= 80 ? "Optimized" : practiceAccuracy >= 50 ? "Nominal" : "Initializing"}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {accountRows.map((row) => (
              <InfoRow key={row.label} {...row} />
            ))}
          </div>
        </section>

        <div className="grid gap-5">
          <MetricTile
            icon={<Sparkles className="size-5" />}
            label="Precision"
            value={`${practiceAccuracy}%`}
            helper="Overall practice accuracy"
          />
          <MetricTile
            icon={<Target className="size-5" />}
            label="Streak"
            value={practiceStats.currentStreak.toString()}
            helper="Current gesture streak"
          />
        </div>
      </div>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-mono-label text-[12px] text-cohere-slate">Gesture analytics</p>
            <h3 className="mt-2 text-[32px] leading-[1.2]">Most practiced letters</h3>
          </div>
          <Link href="/practice" className="text-[14px] text-cohere-blue underline underline-offset-4">
            Open practice
          </Link>
        </div>
        <div className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-5">
          {topLetters.map((item) => (
            <LetterFocusRow
              key={item.letter}
              letter={item.letter}
              attempts={item.attempts}
              accuracy={item.accuracy}
              maxAttempts={Math.max(...topLetters.map((letter) => letter.attempts), 1)}
            />
          ))}
          {topLetters.length === 0 && (
            <p className="py-10 text-center text-[14px] text-cohere-slate">Awaiting practice telemetry.</p>
          )}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-mono-label text-[12px] text-cohere-slate">Recent activity</p>
              <h3 className="mt-2 text-[32px] leading-[1.2]">Session history</h3>
            </div>
            <div className="text-right text-[12px] text-cohere-slate">
              <p>Total sessions: {totalSessions}</p>
              <p>Total frames: {totalEntries}</p>
            </div>
          </div>
          <div className="rounded-sm border border-cohere-hairline bg-cohere-canvas px-5">
            {historySessions.slice(0, 3).map((session) => (
              <ActivityCardItem key={session.sessionId} session={session} />
            ))}
            {historySessions.length === 0 && (
              <div className="py-12 text-center">
                <History className="mx-auto size-8 text-cohere-slate" />
                <p className="mt-4 text-[14px] text-cohere-slate">No synced translation sessions yet.</p>
                <Button asChild variant="secondary" className="mt-2">
                  <Link href="/translate">Initialize translate</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-8">
          <section>
            <p className="text-mono-label text-[12px] text-cohere-slate">Quick access</p>
            <div className="mt-4 space-y-3">
              <ShortcutButton
                href="/translate"
                label="Translate"
                description="Return to translation core"
                icon={<Languages className="size-4" />}
              />
              <ShortcutButton
                href="/history"
                label="History"
                description="View complete session logs"
                icon={<History className="size-4" />}
              />
              <ShortcutButton
                href="/reference"
                label="Reference"
                description="Browse all sign definitions"
                icon={<BookOpen className="size-4" />}
              />
            </div>
          </section>

          <section>
            <p className="text-mono-label text-[12px] text-cohere-slate">Preferences</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {accessibilityRows.map((row) => (
                <div key={row.label} className="rounded-sm border border-cohere-hairline bg-cohere-stone p-4">
                  <div className="text-cohere-slate">{row.icon}</div>
                  <p className="mt-3 text-[12px] text-cohere-slate">{row.label}</p>
                  <p className="mt-1 text-[14px] text-cohere-ink">{row.value}</p>
                </div>
              ))}
            </div>
          </section>

          <Button
            variant="outline"
            className="h-14 w-full text-cohere-error hover:text-cohere-error"
            onClick={async () => {
              setIsLoggingOut(true);
              try {
                const supabase = createSupabaseClient();
                await supabase.auth.signOut();
              } finally {
                window.location.href = "/";
              }
            }}
            disabled={isLoggingOut}
          >
            <LogOut className="size-4" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
