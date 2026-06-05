import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const getUser = vi.fn();
const exchangeCodeForSession = vi.fn();

vi.mock("@/utils/supabase/middleware", () => ({
  createClient: () => ({
    supabase: { auth: { getUser } },
    supabaseResponse: NextResponse.next(),
  }),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { exchangeCodeForSession },
  }),
}));

describe("auth route integration", () => {
  beforeEach(() => {
    getUser.mockReset();
    exchangeCodeForSession.mockReset();
  });

  it("TC-004 redirects unauthenticated workspace access and preserves return path", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");

    const response = await proxy(
      new NextRequest("https://signify.local/history?page=2"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://signify.local/?login=1&next=%2Fhistory%3Fpage%3D2",
    );
  });

  it("TC-002 allows authenticated users to access workspace routes", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { proxy } = await import("@/proxy");

    const response = await proxy(
      new NextRequest("https://signify.local/translate"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("TC-001 redirects a failed OAuth exchange with a plain error signal", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("invalid") });
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(
      new NextRequest("https://signify.local/auth/callback?code=bad"),
    );

    expect(response.headers.get("location")).toBe(
      "https://signify.local/?error=auth_callback_failed",
    );
  });

  it("TC-024 blocks an external OAuth callback destination", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(
      new NextRequest(
        "https://signify.local/auth/callback?code=ok&next=https://evil.example",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://signify.local/translate",
    );
  });
});
