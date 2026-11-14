import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const getUser = vi.fn();
const exchangeCodeForSession = vi.fn();
const accessInfo = vi.fn();
const authCookies = [
  {
    name: "sb-test-auth-token",
    value: "session-cookie",
    options: { path: "/", httpOnly: true },
  },
];

vi.mock("@/utils/supabase/middleware", () => ({
  createClient: () => ({
    supabase: { auth: { getUser } },
    supabaseResponse: NextResponse.next(),
  }),
}));

vi.mock("@/i18n/middleware", () => ({
  handleI18nRouting: () => ({ headers: new Headers() }),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: async (
    onCookiesSet?: (cookiesToSet: typeof authCookies) => void,
  ) => ({
    rpc: accessInfo,
    auth: {
      exchangeCodeForSession: async (...args: unknown[]) => {
        const result = await exchangeCodeForSession(...args);
        if (!result.error) {
          onCookiesSet?.(authCookies);
        }
        return result;
      },
    },
  }),
}));

describe("auth route integration", () => {
  beforeEach(() => {
    getUser.mockReset();
    exchangeCodeForSession.mockReset();
    accessInfo.mockReset();
    accessInfo.mockResolvedValue({ data: { is_curator: false }, error: null });
  });

  it.each(["/curator", "/admin/curators"])("protects role route %s behind sign in", async pathname => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("https://signify.local" + pathname));
    expect(response.status).toBe(307);
    const destination = new URL(response.headers.get("location")!);
    expect(destination.searchParams.get("login")).toBe("1");
    expect(destination.searchParams.get("next")).toBe(pathname);
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

  it("TC-004 redirects unauthenticated English workspace access with locale", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const { proxy } = await import("@/proxy");

    const response = await proxy(
      new NextRequest("https://signify.local/en/history?page=2"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://signify.local/en?login=1&next=%2Fen%2Fhistory%3Fpage%3D2",
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

  it("TC-002 forwards session cookies when OAuth exchange succeeds", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/callback/route");

    const response = await GET(
      new NextRequest(
        "https://signify.local/auth/callback?code=ok&next=%2Fhistory%3Fpage%3D2",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://signify.local/history?page=2",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "sb-test-auth-token=session-cookie",
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

  it.each([['/translate', '/curator'], ['/en/translate', '/en/curator']])(
    'sends an assigned curator from %s to %s', async (next, expected) => {
      exchangeCodeForSession.mockResolvedValue({ error: null });
      accessInfo.mockResolvedValue({ data: { is_curator: true }, error: null });
      const { GET } = await import('@/app/auth/callback/route');
      const response = await GET(new NextRequest('https://signify.local/auth/callback?code=ok&next=' + encodeURIComponent(next)));
      expect(response.headers.get('location')).toBe('https://signify.local' + expected);
      expect(response.headers.get('set-cookie')).toContain('sb-test-auth-token=session-cookie');
    },
  );

  it('preserves an explicit return path for a curator', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    accessInfo.mockResolvedValue({ data: { is_curator: true }, error: null });
    const { GET } = await import('@/app/auth/callback/route');
    const response = await GET(new NextRequest('https://signify.local/auth/callback?code=ok&next=/history'));
    expect(response.headers.get('location')).toBe('https://signify.local/history');
  });

  it('keeps the login session when role lookup fails', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    accessInfo.mockRejectedValue(new Error('Unavailable'));
    const { GET } = await import('@/app/auth/callback/route');
    const response = await GET(new NextRequest('https://signify.local/auth/callback?code=ok'));
    expect(response.headers.get('location')).toBe('https://signify.local/translate');
    expect(response.headers.get('set-cookie')).toContain('sb-test-auth-token=session-cookie');
  });
});

describe("dataset route protection", () => {
  it.each(["/contributions", "/contributions/new", "/contributions/bff6b03c-a794-431e-b974-a869727b0820", "/en/contributions/new"])(
    "redirects unauthenticated access to %s", async path => {
      getUser.mockResolvedValue({ data: { user: null } });
      const { proxy } = await import("@/proxy");
      const response = await proxy(new NextRequest("http://localhost:3000" + path));
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location")!);
      expect(location.searchParams.get("login")).toBe("1");
      expect(location.searchParams.get("next")).toBe(path);
    });
});
