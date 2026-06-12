import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAccountProfile } from "@/lib/accountData";
import { createClient } from "@/utils/supabase/client";

vi.mock("@/utils/supabase/client", () => ({ createClient: vi.fn() }));

describe("accountData", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("TC-019 maps authenticated account data directly from Google OAuth metadata", async () => {
    const from = vi.fn();

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
                name: "QA Signify",
                picture: "https://example.test/avatar.png",
              },
            },
          },
          error: null,
        }),
      },
      from,
    } as never);

    await expect(getAccountProfile()).resolves.toMatchObject({
      id: "user-1",
      displayName: "QA Signify",
      email: "qa@signify.local",
      avatarUrl: "https://example.test/avatar.png",
      verified: true,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("TC-019 returns no avatar URL when Google OAuth does not provide a picture", async () => {
    const from = vi.fn();

    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "meiske@example.test",
              email_confirmed_at: "2026-06-05T00:00:00.000Z",
              created_at: "2026-06-01T00:00:00.000Z",
              last_sign_in_at: "2026-06-05T00:00:00.000Z",
              user_metadata: {
                name: "Meiske",
              },
            },
          },
          error: null,
        }),
      },
      from,
    } as never);

    await expect(getAccountProfile()).resolves.toMatchObject({
      displayName: "Meiske",
      avatarUrl: null,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("TC-019 returns null when no authenticated profile exists", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as never);

    await expect(getAccountProfile()).resolves.toBeNull();
  });
});
