import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendHistoryEntry,
  clearHistoryEntries,
  clearLegacyLocalData,
  getHistorySessions,
  getPracticeStats,
  getTranslationHistoryTotals,
  recordPracticeAttempt,
  removeHistorySession,
  resetPracticeStats,
} from "@/lib/userData";
import { createClient } from "@/utils/supabase/client";

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(),
}));

type SupabaseResponse<T> = {
  data: T;
  error: null;
  status: number;
};

function response<T>(data: T): SupabaseResponse<T> {
  return { data, error: null, status: 200 };
}

function queryBuilder<T>(data: T) {
  const builder = {
    select: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.range.mockResolvedValue(response(data));
  builder.eq.mockResolvedValue(response(data));
  builder.neq.mockResolvedValue(response(data));
  return builder;
}

function clientFor({
  tableData = [],
  rpcData = {},
  userId = "user-1",
}: {
  tableData?: unknown;
  rpcData?: unknown;
  userId?: string | null;
} = {}) {
  const builder = queryBuilder(tableData);
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue(
        response({
          session: userId ? { user: { id: userId } } : null,
        }),
      ),
    },
    from: vi.fn().mockReturnValue(builder),
    rpc: vi.fn().mockResolvedValue(response(rpcData)),
  };
  vi.mocked(createClient).mockReturnValue(client as never);
  return { builder, client };
}

const attempt = {
  id: "attempt-1",
  letter: "A" as const,
  correct: true,
  attemptedAt: "2026-06-05T01:00:00.000Z",
};

describe("Supabase-backed user data contracts", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("TC-012 loads and maps a bounded history page", async () => {
    const row = {
      average_confidence: 0.9,
      committed_text: "AB",
      ended_at: null,
      entry_count: 2,
      id: "session-1",
      language: "BISINDO",
      started_at: "2026-06-05T01:00:00.000Z",
    };
    const { builder } = clientFor({ tableData: [row, row] });

    const page = await getHistorySessions({ page: 1, pageSize: 1 });

    expect(page.sessions).toHaveLength(1);
    expect(page.sessions[0]).toMatchObject({ sessionId: "session-1", text: "AB" });
    expect(page.hasMore).toBe(true);
    expect(builder.range).toHaveBeenCalledWith(1, 2);
  });

  it("TC-013 deletes one history session and clears all sessions", async () => {
    const { builder, client } = clientFor();

    await removeHistorySession("session-1");
    await clearHistoryEntries();

    expect(client.from).toHaveBeenCalledWith("translation_sessions");
    expect(builder.eq).toHaveBeenCalledWith("id", "session-1");
    expect(builder.neq).toHaveBeenCalledWith(
      "id",
      "00000000-0000-0000-0000-000000000000",
    );
  });

  it("TC-012 returns normalized translation and practice totals", async () => {
    const { client } = clientFor({
      rpcData: { session_count: 3, entry_count: 8 },
    });

    await expect(getTranslationHistoryTotals()).resolves.toEqual({
      sessionCount: 3,
      entryCount: 8,
    });
    client.rpc.mockResolvedValueOnce(
      response({
        totalAttempts: 2,
        correctAttempts: 1,
        currentStreak: 0,
        bestStreak: 1,
        byLetter: { A: { attempts: 2, correct: 1 } },
      }),
    );
    const stats = await getPracticeStats();
    expect(stats.totalAttempts).toBe(2);
    expect(stats.byLetter.A).toEqual({ attempts: 2, correct: 1 });
  });

  it("TC-015 TC-016 persists and resets practice progress with the authenticated owner", async () => {
    const { client } = clientFor({
      rpcData: {
        totalAttempts: 1,
        correctAttempts: 1,
        currentStreak: 1,
        bestStreak: 1,
        byLetter: { A: { attempts: 1, correct: 1 } },
      },
    });

    await expect(recordPracticeAttempt(attempt)).resolves.toMatchObject({
      totalAttempts: 1,
    });
    await expect(resetPracticeStats()).resolves.toMatchObject({
      totalAttempts: 1,
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "record_practice_attempt",
      expect.objectContaining({ p_expected_user_id: "user-1", p_letter_code: "A" }),
    );
    expect(client.rpc).toHaveBeenCalledWith("reset_practice_stats", {
      p_expected_user_id: "user-1",
    });
  });

  it("TC-021 appends owned translation entries and rejects ownerless writes", async () => {
    const entry = {
      id: "entry-1",
      sessionId: "session-1",
      letter: "A" as const,
      confidence: 0.95,
      committedAt: "2026-06-05T01:00:01.000Z",
      startedAt: "2026-06-05T01:00:00.000Z",
      language: "BISINDO" as const,
    };
    const { client } = clientFor();
    await appendHistoryEntry(entry);
    expect(client.rpc).toHaveBeenCalledWith(
      "append_translation_entry",
      expect.objectContaining({ p_expected_user_id: "user-1", p_entry_id: "entry-1" }),
    );

    clientFor({ userId: null });
    await expect(
      appendHistoryEntry({ ...entry, id: "entry-2", sessionId: "session-2" }),
    ).rejects.toThrow("Authentication required");
  });

  it("TC-023 clears legacy local-only data after remote sync", () => {
    localStorage.setItem("signify:practice:stats:v1", "stale");
    localStorage.setItem("signify:theme", "dark");

    clearLegacyLocalData();

    expect(localStorage.getItem("signify:practice:stats:v1")).toBeNull();
    expect(localStorage.getItem("signify:theme")).toBe("dark");
  });
});
