const HISTORY_STORAGE_KEY = "signify:history:entries:v1";
const PRACTICE_STORAGE_KEY = "signify:practice:stats:v1";
const MAX_HISTORY_ENTRIES = 1200;

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

export interface StoredHistoryEntry {
  id: string;
  sessionId: string;
  text: string;
  confidence: number;
  timestamp: string;
  language: string;
}

export interface HistorySession {
  sessionId: string;
  entries: StoredHistoryEntry[];
  text: string;
  startedAt: string;
  endedAt: string;
  averageConfidence: number;
  language: string;
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

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota and serialization errors.
  }
}

function isValidHistoryEntry(value: unknown): value is StoredHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StoredHistoryEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.sessionId === "string" &&
    typeof entry.text === "string" &&
    typeof entry.confidence === "number" &&
    Number.isFinite(entry.confidence) &&
    typeof entry.timestamp === "string" &&
    typeof entry.language === "string"
  );
}

export function getHistoryEntries(): StoredHistoryEntry[] {
  const parsed = readJson<unknown[]>(HISTORY_STORAGE_KEY, []);
  return parsed
    .filter(isValidHistoryEntry)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

export function appendHistoryEntry(entry: StoredHistoryEntry): void {
  const history = getHistoryEntries();
  history.push(entry);
  const trimmed = history.slice(-MAX_HISTORY_ENTRIES);
  writeJson(HISTORY_STORAGE_KEY, trimmed);
}

export function clearHistoryEntries(): void {
  writeJson<StoredHistoryEntry[]>(HISTORY_STORAGE_KEY, []);
}

export function removeHistorySession(sessionId: string): void {
  const next = getHistoryEntries().filter((entry) => entry.sessionId !== sessionId);
  writeJson(HISTORY_STORAGE_KEY, next);
}

export function getHistorySessions(): HistorySession[] {
  const grouped = new Map<string, StoredHistoryEntry[]>();
  for (const entry of getHistoryEntries()) {
    const list = grouped.get(entry.sessionId) ?? [];
    list.push(entry);
    grouped.set(entry.sessionId, list);
  }

  const sessions: HistorySession[] = [];
  for (const [sessionId, entries] of grouped.entries()) {
    if (entries.length === 0) continue;
    entries.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    const confidenceSum = entries.reduce((sum, item) => sum + item.confidence, 0);
    sessions.push({
      sessionId,
      entries,
      text: entries.map((item) => item.text).join(""),
      startedAt: entries[0].timestamp,
      endedAt: entries[entries.length - 1].timestamp,
      averageConfidence: confidenceSum / entries.length,
      language: entries[entries.length - 1].language,
    });
  }

  return sessions.sort((a, b) => Date.parse(b.endedAt) - Date.parse(a.endedAt));
}

function createDefaultPracticeStats(): PracticeStats {
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

function normalizePracticeStats(raw: unknown): PracticeStats {
  const fallback = createDefaultPracticeStats();
  if (!raw || typeof raw !== "object") return fallback;

  const value = raw as Partial<PracticeStats>;
  const byLetter = { ...fallback.byLetter };

  if (value.byLetter && typeof value.byLetter === "object") {
    for (const letter of ALPHABET_LETTERS) {
      const entry = (value.byLetter as Partial<Record<AlphabetLetter, PracticeLetterStats>>)[letter];
      if (!entry) continue;
      const attempts = Number.isFinite(entry.attempts) ? Math.max(0, entry.attempts) : 0;
      const correct = Number.isFinite(entry.correct) ? Math.max(0, entry.correct) : 0;
      byLetter[letter] = {
        attempts,
        correct: Math.min(correct, attempts),
      };
    }
  }

  return {
    totalAttempts: Number.isFinite(value.totalAttempts) ? Math.max(0, value.totalAttempts ?? 0) : 0,
    correctAttempts: Number.isFinite(value.correctAttempts) ? Math.max(0, value.correctAttempts ?? 0) : 0,
    currentStreak: Number.isFinite(value.currentStreak) ? Math.max(0, value.currentStreak ?? 0) : 0,
    bestStreak: Number.isFinite(value.bestStreak) ? Math.max(0, value.bestStreak ?? 0) : 0,
    lastPlayedAt: typeof value.lastPlayedAt === "string" ? value.lastPlayedAt : null,
    byLetter,
  };
}

export function getPracticeStats(): PracticeStats {
  const parsed = readJson<unknown>(PRACTICE_STORAGE_KEY, createDefaultPracticeStats());
  return normalizePracticeStats(parsed);
}

function persistPracticeStats(stats: PracticeStats): void {
  writeJson(PRACTICE_STORAGE_KEY, stats);
}

export function resetPracticeStats(): PracticeStats {
  const next = createDefaultPracticeStats();
  persistPracticeStats(next);
  return next;
}

export function recordPracticeAttempt(letter: string, correct: boolean): PracticeStats {
  const normalizedLetter = letter.toUpperCase();
  if (!ALPHABET_LETTERS.includes(normalizedLetter as AlphabetLetter)) {
    return getPracticeStats();
  }

  const key = normalizedLetter as AlphabetLetter;
  const current = getPracticeStats();
  const nextByLetter = { ...current.byLetter };
  const currentLetterStats = nextByLetter[key];

  nextByLetter[key] = {
    attempts: currentLetterStats.attempts + 1,
    correct: currentLetterStats.correct + (correct ? 1 : 0),
  };

  const next: PracticeStats = {
    totalAttempts: current.totalAttempts + 1,
    correctAttempts: current.correctAttempts + (correct ? 1 : 0),
    currentStreak: correct ? current.currentStreak + 1 : 0,
    bestStreak: correct ? Math.max(current.bestStreak, current.currentStreak + 1) : current.bestStreak,
    lastPlayedAt: new Date().toISOString(),
    byLetter: nextByLetter,
  };

  persistPracticeStats(next);
  return next;
}
