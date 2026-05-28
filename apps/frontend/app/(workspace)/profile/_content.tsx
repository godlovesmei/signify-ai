"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  History,
  Languages,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ALPHABET_LETTERS,
  getHistorySessions,
  getPracticeStats,
  type HistorySession,
  type PracticeStats,
} from "@/lib/userData";
import {
  TEXT_SCALE_OPTIONS,
  useAccessibilityPrefs,
} from "@/hooks/useAccessibilityPrefs";
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

function createEmptyPracticeStats(): PracticeStats {
  const byLetter = ALPHABET_LETTERS.reduce((accumulator, letter) => {
    accumulator[letter] = { attempts: 0, correct: 0 };
    return accumulator;
  }, {} as PracticeStats["byLetter"]);

  return {
    totalAttempts: 0,
    correctAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: null,
    byLetter,
  };
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
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function describeTextScale(scale: number) {
  const match = Object.entries(TEXT_SCALE_OPTIONS).find(([, value]) =>
    Math.abs(value - scale) < 0.001
  );

  if (match) {
    return `${match[0]} (${scale.toFixed(2)}x)`;
  }

  return `${scale.toFixed(2)}x`;
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
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-[0_12px_28px_-24px_rgba(var(--shadow-color),0.45)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/70">
        {helper}
      </p>
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
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">
          {value}
        </p>
        {subtle && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">{subtle}</p>
        )}
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
    <Button
      asChild
      variant="glass"
      size="sm"
      className="h-auto min-h-14 w-full justify-start rounded-2xl px-4 py-3 text-left"
    >
      <Link href={href}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="block text-xs font-normal leading-relaxed text-muted-foreground">
            {description}
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/55" />
      </Link>
    </Button>
  );
}

function ActivityCardItem({ session }: { session: HistorySession }) {
  const confidence = Math.round(session.averageConfidence * 100);
  const preview = session.text.trim() || "(empty transcript)";
  const truncatedPreview =
    preview.length > 86 ? `${preview.slice(0, 86).trimEnd()}…` : preview;

  return (
    <article className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-[0_12px_28px_-24px_rgba(var(--shadow-color),0.45)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <History className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Session {formatUtcDateTime(session.endedAt)}
            </h3>
            <span className="rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
              {session.language}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {truncatedPreview}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground/70">
            <span>{session.entries.length} entries</span>
            <span>•</span>
            <span>Avg confidence {confidence}%</span>
            <span>•</span>
            <span>Started {formatUtcDateTime(session.startedAt)}</span>
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
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card text-base font-semibold text-foreground shadow-[0_10px_22px_-18px_rgba(var(--shadow-color),0.45)]">
            {letter}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Letter {letter}
            </p>
            <p className="text-xs text-muted-foreground">
              {attempts} attempts • {accuracy}% accuracy
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {attempts}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfilePageContent() {
  const [profile, setProfile] = useState<ProfileState>(FALLBACK_PROFILE);
  const [practiceStats, setPracticeStats] = useState<PracticeStats>(() =>
    createEmptyPracticeStats()
  );
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const prefs = useAccessibilityPrefs();

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getUser();

      if (!active) return;

      setPracticeStats(getPracticeStats());
      setHistorySessions(getHistorySessions());

      const authUser = data.user;
      if (!authUser) return;

      const metadata = (authUser.user_metadata ?? {}) as Record<
        string,
        string | undefined
      >;
      const fullName =
        metadata.full_name?.trim() ||
        metadata.name?.trim() ||
        metadata.display_name?.trim() ||
        metadata.username?.trim() ||
        "";
      const email = authUser.email ?? FALLBACK_PROFILE.email;
      const displayName = fullName || email.split("@")[0] || FALLBACK_PROFILE.displayName;

      setProfile({
        displayName,
        email,
        initials: getInitials(displayName),
        avatarUrl:
          metadata.avatar_url ?? metadata.picture ?? metadata.avatar ?? null,
        id: authUser.id ?? null,
        createdAt: authUser.created_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
        verified: Boolean(authUser.email_confirmed_at),
      });
    }

    loadProfile().catch(() => {
      if (!active) return;
      setPracticeStats(getPracticeStats());
      setHistorySessions(getHistorySessions());
    });

    return () => {
      active = false;
    };
  }, []);

  const totalSessions = historySessions.length;
  const totalEntries = historySessions.reduce(
    (sum, session) => sum + session.entries.length,
    0
  );
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

  const latestActivityAt =
    historySessions[0]?.endedAt ?? practiceStats.lastPlayedAt ?? profile.lastSignInAt;
  const latestSession = historySessions[0] ?? null;

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
      subtle: profile.verified
        ? "Signed in with a verified account"
        : "Verify the address in your inbox",
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
      subtle: prefs.highContrast
        ? "Contrast is boosted across the workspace"
        : "Toggle in Settings for a sharper UI",
    },
    {
      icon: <Target className="h-4 w-4" />,
      label: "Text scale",
      value: describeTextScale(prefs.textScale),
      subtle: "Controls prediction and sentence sizing",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "TTS speed",
      value: `${prefs.ttsSpeed.toFixed(2)}x`,
      subtle: "Speech output speed for generated sentences",
    },
    {
      icon: <Flame className="h-4 w-4" />,
      label: "TTS volume",
      value: `${Math.round(prefs.ttsVolume * 100)}%`,
      subtle: "Playback loudness for spoken output",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-primary/5 via-primary/0 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-8 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 space-y-6">
        <PageHeader
          title="Profile"
          description="Workspace summary, local progress, and accessibility preferences."
        />

        <Card className="relative overflow-hidden border-border/60 bg-card/90 shadow-[0_18px_45px_-35px_rgba(var(--shadow-color),0.45)] backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-400" />
          <div className="pointer-events-none absolute -left-20 top-[-4rem] h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <CardContent className="relative p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/85 to-cyan-500 font-display text-2xl font-bold text-primary-foreground shadow-[0_20px_40px_-24px_rgba(var(--glow-primary),0.75)] ring-1 ring-primary/20">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    profile.initials
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                      {profile.displayName}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      {profile.verified ? "Verified" : "Pending verification"}
                    </span>
                  </div>

                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </p>

                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Your profile brings together account identity, local progress,
                    accessibility settings, and the fastest routes back into the
                    workspace. It is the control center for translating, practicing,
                    and reviewing history.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                      <Languages className="h-3.5 w-3.5" />
                      BISINDO workspace
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Local history enabled
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                      Browser-first privacy
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild size="sm" className="rounded-xl px-4">
                      <Link href="/translate">
                        <Sparkles className="h-4 w-4" />
                        Continue translating
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="rounded-xl px-4">
                      <Link href="/history">
                        <History className="h-4 w-4" />
                        Open history
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[380px] lg:grid-cols-2">
                <MetricTile
                  icon={<History className="h-4 w-4" />}
                  label="Saved sessions"
                  value={String(totalSessions)}
                  helper={
                    totalEntries > 0
                      ? `${totalEntries} transcript entries saved locally`
                      : "No transcript history yet"
                  }
                />
                <MetricTile
                  icon={<Target className="h-4 w-4" />}
                  label="Practice attempts"
                  value={String(practiceStats.totalAttempts)}
                  helper={
                    practiceStats.totalAttempts > 0
                      ? `${practiceStats.correctAttempts} correct attempts`
                      : "Start practice to build this metric"
                  }
                />
                <MetricTile
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Accuracy"
                  value={`${practiceAccuracy}%`}
                  helper={
                    practiceStats.bestStreak > 0
                      ? `Best streak ${practiceStats.bestStreak}`
                      : "Keep practicing to raise the score"
                  }
                />
                <MetricTile
                  icon={<Flame className="h-4 w-4" />}
                  label="Current streak"
                  value={String(practiceStats.currentStreak)}
                  helper={
                    latestActivityAt
                      ? `Last active ${formatUtcDateTime(latestActivityAt)}`
                      : "No activity recorded yet"
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <History className="h-4 w-4 text-primary" />
                  Recent activity
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  The latest translation sessions and local progress snapshots.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestSession ? (
                  <ActivityCardItem session={latestSession} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      No saved activity yet
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Start a translation session or complete a practice run to
                      populate this timeline with local data.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href="/translate">Open Translate</Link>
                      </Button>
                      <Button asChild variant="glass" size="sm" className="rounded-xl">
                        <Link href="/practice">Start Practice</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {historySessions.slice(1, 3).map((session) => (
                  <ActivityCardItem key={session.sessionId} session={session} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Target className="h-4 w-4 text-primary" />
                  Practice focus
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Letters you trained most often, sorted by local attempt count.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {topLetters.length > 0 ? (
                  <div className="space-y-3">
                    {topLetters.map((letter) => (
                      <LetterFocusRow
                        key={letter.letter}
                        letter={letter.letter}
                        attempts={letter.attempts}
                        accuracy={letter.accuracy}
                        maxAttempts={topLetters[0]?.attempts ?? letter.attempts}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Languages className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      No practice data yet
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Your strongest letters will appear here after a few practice
                      rounds.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <Button asChild variant="outline" size="sm" className="rounded-xl">
                        <Link href="/practice">Open Practice</Link>
                      </Button>
                      <Button asChild variant="glass" size="sm" className="rounded-xl">
                        <Link href="/reference">Review Reference</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Account details
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Identity and session data pulled from your authenticated account.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {accountRows.map((row) => (
                  <InfoRow
                    key={row.label}
                    icon={row.icon}
                    label={row.label}
                    value={row.value}
                    subtle={row.subtle}
                  />
                ))}

                <div className="mt-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Workspace shortcuts
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <ShortcutButton
                      href="/translate"
                      label="Translate"
                      description="Open the live camera workspace"
                      icon={<Sparkles className="h-4 w-4" />}
                    />
                    <ShortcutButton
                      href="/practice"
                      label="Practice"
                      description="Train the alphabet and feedback loop"
                      icon={<Target className="h-4 w-4" />}
                    />
                    <ShortcutButton
                      href="/history"
                      label="History"
                      description="Review saved translation sessions"
                      icon={<History className="h-4 w-4" />}
                    />
                    <ShortcutButton
                      href="/reference"
                      label="Reference"
                      description="Open the sign reference library"
                      icon={<BookOpen className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-md">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Accessibility preferences
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These settings mirror what is active across the workspace.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {accessibilityRows.map((row) => (
                  <InfoRow
                    key={row.label}
                    icon={row.icon}
                    label={row.label}
                    value={row.value}
                    subtle={row.subtle}
                  />
                ))}

                <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4 text-sm leading-relaxed text-muted-foreground">
                  Need to change camera, mirror, voice, or contrast behavior? Those
                  controls live in Translate and Settings so the profile stays clean.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}