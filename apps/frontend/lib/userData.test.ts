import { describe, expect, it } from "vitest";
import {
  applyPracticeAttempt,
  createDefaultPracticeStats,
  mapHistorySessionRow,
  normalizePracticeStats,
} from "@/lib/userData";

describe("userData mappers", () => {
  it("TC-012 maps a database translation session into the UI contract", () => {
    const session = mapHistorySessionRow({
      average_confidence: 0.82,
      committed_text: "AB",
      ended_at: "2026-06-05T02:00:00.000Z",
      entry_count: 2,
      id: "session-id",
      language: "BISINDO",
      started_at: "2026-06-05T01:00:00.000Z",
    });

    expect(session).toEqual({
      sessionId: "session-id",
      text: "AB",
      startedAt: "2026-06-05T01:00:00.000Z",
      endedAt: "2026-06-05T02:00:00.000Z",
      averageConfidence: 0.82,
      language: "BISINDO",
      entryCount: 2,
    });
  });

  it("TC-017 normalizes missing practice letters and invalid counters", () => {
    const stats = normalizePracticeStats({
      totalAttempts: -10,
      correctAttempts: 2,
      currentStreak: 1,
      bestStreak: 2,
      byLetter: {
        A: { attempts: 3, correct: 8 },
      },
    });

    expect(stats.totalAttempts).toBe(0);
    expect(stats.byLetter.A).toEqual({ attempts: 3, correct: 3 });
    expect(stats.byLetter.B).toEqual({ attempts: 0, correct: 0 });
  });
});

describe("optimistic practice state", () => {
  it("TC-015 records a correct attempt and updates streaks", () => {
    const next = applyPracticeAttempt(createDefaultPracticeStats(), {
      letter: "A",
      correct: true,
      attemptedAt: "2026-06-05T01:00:00.000Z",
    });

    expect(next.totalAttempts).toBe(1);
    expect(next.correctAttempts).toBe(1);
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.byLetter.A).toEqual({ attempts: 1, correct: 1 });
  });

  it("TC-015 resets the current streak after an incorrect attempt", () => {
    const correct = applyPracticeAttempt(createDefaultPracticeStats(), {
      letter: "A",
      correct: true,
      attemptedAt: "2026-06-05T01:00:00.000Z",
    });
    const incorrect = applyPracticeAttempt(correct, {
      letter: "B",
      correct: false,
      attemptedAt: "2026-06-05T01:01:00.000Z",
    });

    expect(incorrect.currentStreak).toBe(0);
    expect(incorrect.bestStreak).toBe(1);
    expect(incorrect.byLetter.B).toEqual({ attempts: 1, correct: 0 });
  });
});
