import { executeSupabaseRequest } from "@/lib/supabaseRequest";
import { createSerializedQueue } from "@/lib/serializedQueue";
import { createClient } from "@/utils/supabase/client";

const LEGACY_STORAGE_KEYS = [
  "signify:history:entries:v1",
  "signify:practice:stats:v1",
  "signify:highContrast",
  "signify:textScale",
  "signify:ttsSpeed",
  "signify:ttsVolume",
] as const;

export const HISTORY_PAGE_SIZE = 50;

export const ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export type AlphabetLetter = (typeof ALPHABET_LETTERS)[number];
export type SignLanguage = "ASL" | "BISINDO";

export interface TranslationEntryInput {
  id: string;
  sessionId: string;
  letter: AlphabetLetter;
  confidence: number;
  committedAt: string;
  startedAt: string;
  language: SignLanguage;
  source?: "webcam" | "upload" | "api";
  commitMethod?: "weighted_vote" | "fast_commit" | "manual";
}

export interface HistorySession {
  sessionId: string;
  text: string;
  startedAt: string;
  endedAt: string;
  averageConfidence: number;
  language: SignLanguage;
  entryCount: number;
}

export interface HistoryPage {
  sessions: HistorySession[];
  hasMore: boolean;
}

export interface TranslationHistoryTotals {
  sessionCount: number;
  entryCount: number;
}

export interface PracticeLetterStats {
  attempts: number;
  correct: number;
}

export interface PracticeStats {
  totalAttempts: number;
  correctAttempts: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt: string | null;
  byLetter: Record<AlphabetLetter, PracticeLetterStats>;
}

export interface PracticeAttemptInput {
  id: string;
  letter: AlphabetLetter;
  correct: boolean;
  attemptedAt: string;
  source?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

async function readExpectedUserId(): Promise<string | null> {
  try {
    const { data, error } = await createClient().auth.getSession();
    if (error) return null;
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

function requireExpectedUserId(userId: string | null): string {
  if (!userId) throw new Error("Authentication required before saving user data.");
  return userId;
}

export function createDefaultPracticeStats(): PracticeStats {
  const byLetter = {} as Record<AlphabetLetter, PracticeLetterStats>;
  for (const letter of ALPHABET_LETTERS) {
    byLetter[letter] = { attempts: 0, correct: 0 };
  }

  return {
    totalAttempts: 0,
    correctAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: null,
    byLetter,
  };
}

export function normalizePracticeStats(raw: unknown): PracticeStats {
  const fallback = createDefaultPracticeStats();
  const value = asRecord(raw);
  if (!value) return fallback;

  const rawByLetter = asRecord(value.byLetter);
  const byLetter = { ...fallback.byLetter };
  for (const letter of ALPHABET_LETTERS) {
    const letterValue = asRecord(rawByLetter?.[letter]);
    if (!letterValue) continue;
    const attempts = Math.max(0, finiteNumber(letterValue.attempts));
    const correct = Math.min(
      attempts,
      Math.max(0, finiteNumber(letterValue.correct)),
    );
    byLetter[letter] = { attempts, correct };
  }

  return {
    totalAttempts: Math.max(0, finiteNumber(value.totalAttempts)),
    correctAttempts: Math.max(0, finiteNumber(value.correctAttempts)),
    currentStreak: Math.max(0, finiteNumber(value.currentStreak)),
    bestStreak: Math.max(0, finiteNumber(value.bestStreak)),
    lastPlayedAt:
      typeof value.lastPlayedAt === "string" ? value.lastPlayedAt : null,
    byLetter,
  };
}

export function applyPracticeAttempt(
  current: PracticeStats,
  attempt: Pick<PracticeAttemptInput, "letter" | "correct" | "attemptedAt">,
): PracticeStats {
  const previousLetter = current.byLetter[attempt.letter];
  const currentStreak = attempt.correct ? current.currentStreak + 1 : 0;

  return {
    totalAttempts: current.totalAttempts + 1,
    correctAttempts: current.correctAttempts + (attempt.correct ? 1 : 0),
    currentStreak,
    bestStreak: Math.max(current.bestStreak, currentStreak),
    lastPlayedAt: attempt.attemptedAt,
    byLetter: {
      ...current.byLetter,
      [attempt.letter]: {
        attempts: previousLetter.attempts + 1,
        correct: previousLetter.correct + (attempt.correct ? 1 : 0),
      },
    },
  };
}

export function mapHistorySessionRow(row: {
  average_confidence: number | null;
  committed_text: string;
  ended_at: string | null;
  entry_count: number;
  id: string;
  language: string;
  started_at: string;
}): HistorySession {
  return {
    sessionId: row.id,
    text: row.committed_text,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? row.started_at,
    averageConfidence: row.average_confidence ?? 0,
    language: row.language === "ASL" ? "ASL" : "BISINDO",
    entryCount: row.entry_count,
  };
}

export async function getHistorySessions({
  page = 0,
  pageSize = HISTORY_PAGE_SIZE,
}: {
  page?: number;
  pageSize?: number;
} = {}): Promise<HistoryPage> {
  const safePage = Math.max(0, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const from = safePage * safePageSize;
  const to = from + safePageSize;
  const supabase = createClient();

  const rows = await executeSupabaseRequest(() =>
    supabase
      .from("translation_sessions")
      .select(
        "id, committed_text, started_at, ended_at, average_confidence, language, entry_count",
      )
      .order("ended_at", { ascending: false, nullsFirst: false })
      .range(from, to),
  );

  return {
    sessions: (rows ?? []).slice(0, safePageSize).map(mapHistorySessionRow),
    hasMore: (rows ?? []).length > safePageSize,
  };
}

async function appendTranslationEntryNow(
  entry: TranslationEntryInput,
  expectedUserId: string,
): Promise<void> {
  const supabase = createClient();
  await executeSupabaseRequest(() =>
    supabase.rpc("append_translation_entry", {
      p_expected_user_id: expectedUserId,
      p_entry_id: entry.id,
      p_session_id: entry.sessionId,
      p_letter_code: entry.letter,
      p_confidence: entry.confidence,
      p_language: entry.language,
      p_source: entry.source ?? "webcam",
      p_started_at: entry.startedAt,
      p_committed_at: entry.committedAt,
      p_commit_method: entry.commitMethod ?? "weighted_vote",
    }),
  );
}

const translationQueues = new Map<string, Promise<void>>();

export function appendHistoryEntry(entry: TranslationEntryInput): Promise<void> {
  const previous = translationQueues.get(entry.sessionId) ?? Promise.resolve();
  const expectedUserId = readExpectedUserId();
  const task = previous.catch(() => undefined).then(async () => {
    await appendTranslationEntryNow(
      entry,
      requireExpectedUserId(await expectedUserId),
    );
  });

  translationQueues.set(entry.sessionId, task);
  const cleanup = () => {
    if (translationQueues.get(entry.sessionId) === task) {
      translationQueues.delete(entry.sessionId);
    }
  };
  task.then(cleanup, cleanup);
  return task;
}

export async function removeHistorySession(sessionId: string): Promise<void> {
  const supabase = createClient();
  await executeSupabaseRequest(() =>
    supabase.from("translation_sessions").delete().eq("id", sessionId),
  );
}

export async function clearHistoryEntries(): Promise<void> {
  const supabase = createClient();
  await executeSupabaseRequest(() =>
    supabase
      .from("translation_sessions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"),
  );
}

export async function getTranslationHistoryTotals(): Promise<TranslationHistoryTotals> {
  const supabase = createClient();
  const raw = await executeSupabaseRequest(() =>
    supabase.rpc("get_translation_history_totals"),
  );
  const value = asRecord(raw);
  return {
    sessionCount: Math.max(0, finiteNumber(value?.session_count)),
    entryCount: Math.max(0, finiteNumber(value?.entry_count)),
  };
}

export async function getPracticeStats(): Promise<PracticeStats> {
  const supabase = createClient();
  const raw = await executeSupabaseRequest(() => supabase.rpc("get_practice_stats"));
  return normalizePracticeStats(raw);
}

const practiceWriteQueue = createSerializedQueue();

export function recordPracticeAttempt(
  attempt: PracticeAttemptInput,
): Promise<PracticeStats> {
  const expectedUserId = readExpectedUserId();
  return practiceWriteQueue.enqueue(async () => {
    const supabase = createClient();
    const userId = requireExpectedUserId(await expectedUserId);
    const raw = await executeSupabaseRequest(() =>
      supabase.rpc("record_practice_attempt", {
        p_expected_user_id: userId,
        p_attempt_id: attempt.id,
        p_letter_code: attempt.letter,
        p_is_correct: attempt.correct,
        p_attempted_at: attempt.attemptedAt,
        p_source: attempt.source ?? "practice_page",
      }),
    );
    return normalizePracticeStats(raw);
  });
}

export function resetPracticeStats(): Promise<PracticeStats> {
  const expectedUserId = readExpectedUserId();
  return practiceWriteQueue.enqueue(async () => {
    const supabase = createClient();
    const userId = requireExpectedUserId(await expectedUserId);
    const raw = await executeSupabaseRequest(() =>
      supabase.rpc("reset_practice_stats", {
        p_expected_user_id: userId,
      }),
    );
    return normalizePracticeStats(raw);
  });
}

export function clearLegacyLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}
