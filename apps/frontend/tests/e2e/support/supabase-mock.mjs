import http from "node:http";

const port = Number(process.env.SUPABASE_MOCK_PORT ?? 54321);
const now = Math.floor(Date.now() / 1000);
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "qa@signify.local",
  email_confirmed_at: "2026-06-05T00:00:00.000Z",
  created_at: "2026-06-05T00:00:00.000Z",
  last_sign_in_at: "2026-06-05T00:00:00.000Z",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { full_name: "QA Signify", name: "QA Signify" },
  identities: [],
};
const payload = Buffer.from(
  JSON.stringify({
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    email: user.email,
    exp: now + 3600,
  }),
).toString("base64url");
const accessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.test-signature`;
const session = {
  access_token: accessToken,
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  expires_at: now + 3600,
  token_type: "bearer",
  user,
};

function headers(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "content-type": "application/json",
    ...extra,
  };
}

function json(response, status, body, extra = {}) {
  response.writeHead(status, headers(extra));
  response.end(JSON.stringify(body));
}

function isAuthenticated(request) {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return false;

  const token = authorization.slice("Bearer ".length);
  if (token === accessToken) return true;

  const [, encodedPayload] = token.split(".");
  if (!encodedPayload) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
    return (
      payload.sub === user.id &&
      payload.aud === "authenticated" &&
      payload.role === "authenticated" &&
      payload.email === user.email &&
      Number(payload.exp) > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

function restBody(pathname, request) {
  if (pathname.endsWith("/profiles")) {
    return request.headers.accept?.includes("application/vnd.pgrst.object")
      ? { display_name: "QA Signify", avatar_url: null }
      : [{ display_name: "QA Signify", avatar_url: null }];
  }
  if (pathname.endsWith("/user_preferences")) {
    return request.headers.accept?.includes("application/vnd.pgrst.object")
      ? {
          theme: "light",
          high_contrast: false,
          text_scale: 1,
          tts_speed: 1,
          tts_volume: 0.8,
        }
      : [];
  }
  return [];
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, headers());
    response.end();
    return;
  }

  if (url.pathname === "/health") {
    json(response, 200, { status: "ok" });
    return;
  }

  if (url.pathname === "/auth/v1/authorize") {
    const redirectTo = url.searchParams.get("redirect_to");
    if (!redirectTo) {
      json(response, 400, { message: "redirect_to is required" });
      return;
    }
    const callback = new URL(redirectTo);
    callback.searchParams.set("code", "valid-test-code");
    response.writeHead(302, { location: callback.toString() });
    response.end();
    return;
  }

  if (url.pathname === "/auth/v1/token" && request.method === "POST") {
    json(response, 200, { session, user, ...session });
    return;
  }

  if (url.pathname === "/auth/v1/user") {
    if (!isAuthenticated(request)) {
      json(response, 401, { message: "invalid JWT" });
      return;
    }
    json(response, 200, user);
    return;
  }

  if (url.pathname === "/auth/v1/logout" && request.method === "POST") {
    response.writeHead(204, headers());
    response.end();
    return;
  }

  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    if (!isAuthenticated(request)) {
      json(response, 401, { message: "unauthorized" });
      return;
    }
    const rpc = url.pathname.split("/").pop();
    if (rpc === "get_practice_stats" || rpc === "reset_practice_stats") {
      json(response, 200, {
        totalAttempts: 0,
        correctAttempts: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedAt: null,
        byLetter: {},
      });
      return;
    }
    if (rpc === "get_translation_history_totals") {
      json(response, 200, { session_count: 0, entry_count: 0 });
      return;
    }
    json(response, 200, null);
    return;
  }

  if (url.pathname.startsWith("/rest/v1/")) {
    if (!isAuthenticated(request)) {
      json(response, 401, { message: "unauthorized" });
      return;
    }
    json(response, 200, restBody(url.pathname, request), {
      "content-range": "0-0/0",
    });
    return;
  }

  json(response, 404, { message: "not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Supabase test mock listening on http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
