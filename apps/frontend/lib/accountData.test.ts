import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccountProfile } from "@/lib/accountData";
import { executeSupabaseRequest } from "@/lib/supabaseRequest";
import { createClient } from "@/utils/supabase/client";

vi.mock("@/utils/supabase/client", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabaseRequest", () => ({ executeSupabaseRequest: vi.fn() }));

describe("accountData", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(executeSupabaseRequest).mockReset();
  });

  it("TC-019 maps authenticated profile analytics and metadata fallbacks", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "qa@signify.local",
              email_confirmed_at: "2026-06-05T00:00:00.000Z",
              created_at: "2026-06-01T00:00:00.000Z",
              last_sign_in_at: "2026-06-05T00:00:00.000Z",
              user_metadata: {
                full_name: "QA Signify",
                picture: "https://example.test/avatar.png",
              },
            },
          },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
      })),
    } as never);
    vi.mocked(executeSupabaseRequest).mockResolvedValue({
      display_name: "",
      avatar_url: null,
    });

    await expect(getAccountProfile()).resolves.toMatchObject({
      id: "user-1",
      displayName: "QA Signify",
      email: "qa@signify.local",
      avatarUrl: "https://example.test/avatar.png",
      verified: true,
    });
  });

  it("TC-019 returns null when no authenticated profile exists", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
      })),
    } as never);
    vi.mocked(executeSupabaseRequest).mockResolvedValue(null);

    await expect(getAccountProfile()).resolves.toBeNull();
  });
});
