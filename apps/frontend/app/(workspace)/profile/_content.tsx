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
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8 glass-panel shadow-2xl transition-all hover:bg-white/[0.05] group">
      <div className="flex items-center gap-4 text-white/40">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/60 group-hover:bg-white group-hover:text-black transition-all">
          {icon}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
          {label}
        </span>
      </div>
      <p className="mt-8 text-5xl font-black tracking-tighter tabular-nums text-white">
        {value}
      </p>
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20">
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
    <div className="flex items-start gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]">
      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          {label}
        </p>
        <p className="mt-1.5 break-words text-sm font-black text-white">
          {value}
        </p>
        {subtle && (
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/10">{subtle}</p>
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
      className="h-auto min-h-20 w-full justify-start rounded-3xl px-6 py-4 border border-white/5 bg-white/[0.03] glass-panel hover:bg-white hover:text-black transition-all group"
    >
      <Link href={href}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 group-hover:bg-black group-hover:text-white transition-all">
          {icon}
        </span>
        <span className="ml-4 min-w-0 flex-1 text-left">
          <span className="block text-sm font-black uppercase tracking-widest transition-colors">
            {label}
          </span>
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-black/40 transition-colors">
            {description}
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 opacity-20 group-hover:opacity-100 transition-all" />
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
    <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl transition-all hover:bg-white/[0.05] hover:-translate-y-1">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40">
          <History className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60">
              Session Trace {formatUtcDateTime(session.endedAt)}
            </h3>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
              {session.language}
            </span>
          </div>
          <p className="text-sm font-black leading-relaxed text-white">
            {truncatedPreview}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
            <span className="flex items-center gap-2">
              <Sparkles className="size-3" /> {session.entries.length} Frames
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3" /> {confidence}% Confidence
            </span>
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
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.05]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black text-xl font-black text-white shadow-3xl tracking-tighter">
            {letter}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white">
              Gesture {letter}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              {attempts} iterations • {accuracy}% accuracy
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 tabular-nums">
          #{attempts}
        </span>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700"
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
    <div className="relative mx-auto w-full max-w-7xl space-y-12 p-6 md:p-12">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 space-y-16">
        <PageHeader
          title="Neural Profile"
          description="Workspace telemetry, gesture analytics, and engine preferences."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main ID Card */}
          <div className="lg:col-span-8">
            <Card className="relative overflow-hidden rounded-[3.5rem] border border-white/5 bg-white/[0.03] shadow-3xl glass-panel">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-white" />
              <CardContent className="relative p-10 md:p-16">
                <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                  <div className="relative shrink-0 mx-auto lg:mx-0">
                    <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2.5rem] bg-black font-black text-4xl text-white shadow-3xl border border-white/10 p-1">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt={profile.displayName}
                          className="size-full object-cover rounded-[2.2rem]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="tracking-tighter">{profile.initials}</span>
                      )}
                    </div>
                    {profile.verified && (
                      <div className="absolute -bottom-2 -right-2 rounded-2xl bg-emerald-500 p-2 text-white shadow-lg border-2 border-black">
                        <ShieldCheck className="size-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-center lg:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-3">Operator ID</p>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2">
                      {profile.displayName}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-6 font-mono">
                      SYNC_STATUS: {practiceAccuracy >= 80 ? 'OPTIMIZED' : practiceAccuracy >= 50 ? 'NOMINAL' : 'INITIALIZING'}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                         LATENCY: 24MS
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/40">
                         STABILITY: 99.8%
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                         ENCRYPTED
                      </div>
                    </div>
                  </div>
                </div>

                 <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {accountRows.map((row) => (
                     <InfoRow key={row.label} {...row} />
                   ))}
                 </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <MetricTile
              icon={<Sparkles className="size-6" />}
              label="Intelligence"
              value={`${practiceAccuracy}%`}
              helper="Overall prediction precision"
            />
            <MetricTile
              icon={<Flame className="size-6" />}
              label="Momentum"
              value={practiceStats.currentStreak.toString()}
              helper="Current gesture accuracy streak"
            />
            <div className="flex-1 rounded-[2.5rem] border border-white/5 bg-emerald-500/5 p-8 flex flex-col justify-center items-center text-center">
               <ShieldCheck className="size-12 text-emerald-400/20 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/40">Neural Firewall Active</p>
               <p className="mt-2 text-[9px] font-bold text-white/10 max-w-[180px]">Your translation data is processed locally for maximum privacy.</p>
            </div>
          </div>
        </div>

        {/* Intelligence Section */}
        <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Telemetry</p>
              <h3 className="text-3xl font-black tracking-tighter text-white">Gesture Analytics</h3>
            </div>
            <Link href="/practice" className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors">
              Session Entry →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topLetters.map((item) => (
              <LetterFocusRow
                key={item.letter}
                letter={item.letter}
                attempts={item.attempts}
                accuracy={item.accuracy}
                maxAttempts={Math.max(...topLetters.map(l => l.attempts), 1)}
              />
            ))}
            {topLetters.length === 0 && (
              <div className="col-span-full rounded-3xl border-2 border-dashed border-white/5 p-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 uppercase">Awaiting practice telemetry...</p>
              </div>
            )}
          </div>
        </section>

        {/* Global Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
              <div className="px-2 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Sync Trace</p>
                  <h3 className="text-3xl font-black tracking-tighter text-white">Recent Activity</h3>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    Total Sessions: <span className="text-white font-mono">{totalSessions}</span>
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-0.5">
                    Total Frames: <span className="text-white font-mono">{totalEntries}</span>
                  </p>
                </div>
              </div>
             
             <div className="space-y-4">
                {historySessions.slice(0, 3).map((session) => (
                   <ActivityCardItem key={session.sessionId} session={session} />
                ))}
                {historySessions.length === 0 && (
                  <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 p-20 text-center">
                    <History className="size-12 text-white/5 mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">No traces detected in local buffer</p>
                    <Button asChild variant="link" className="mt-4 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                      <Link href="/translate">Initialize Translate →</Link>
                    </Button>
                  </div>
                )}
             </div>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <div className="space-y-8">
              <div className="px-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Navigation</p>
                 <h3 className="text-2xl font-black tracking-tighter text-white">Quick Access</h3>
               </div>
               <div className="space-y-4">
                 <ShortcutButton
                   href="/translate"
                   label="Studio Matrix"
                   description="Return to translation core"
                   icon={<Languages />}
                 />
                 <ShortcutButton
                   href="/history"
                   label="Archive Vault"
                   description="View complete session logs"
                   icon={<BookOpen />}
                 />
                 <ShortcutButton
                   href="/reference"
                   label="Gesture library"
                   description="Browse all sign definitions"
                   icon={<BookOpen />}
                 />
               </div>
             </div>

             <div className="space-y-8 pt-8 border-t border-white/5">
              <div className="px-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3">Engine</p>
                 <h3 className="text-2xl font-black tracking-tighter text-white">Workspace Preferences</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 {accessibilityRows.map((row) => (
                   <div key={row.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left">
                     <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{row.label}</p>
                     <p className="mt-1 text-xs font-black text-white">{row.value}</p>
                   </div>
                 ))}
               </div>
             </div>

             <div className="pt-12 border-t border-white/5">
                <Button
                  variant="outline"
                  className="w-full h-20 rounded-[1.8rem] border-white/5 bg-white/[0.02] text-white/20 font-black uppercase tracking-[0.3em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-all group"
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
                  <LogOut className="size-5 mr-4 group-hover:-translate-x-1 transition-transform" />
                  {isLoggingOut ? "DISCONNECTING..." : "TERMINATE SESSION"}
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}