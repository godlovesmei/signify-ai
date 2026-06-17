import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";

const authState = "tests/e2e/.auth/user.json";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseHost = new URL(supabaseUrl).hostname.split(".")[0];
const authCookieName = `sb-${supabaseHost}-auth-token`;
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
const sessionCookieValue = `base64-${Buffer.from(
  JSON.stringify({
    access_token: accessToken,
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: "bearer",
    user,
  }),
).toString("base64url")}`;

setup("TC-002 authenticated Supabase state opens protected routes", async ({
  context,
  page,
}) => {
  await context.addCookies(
    ["http://127.0.0.1:3000", "http://localhost:3000"].map((url) => ({
      name: authCookieName,
      value: sessionCookieValue,
      url,
      path: "/",
      expires: now + 3600,
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
  );

  await page.goto("/history?from=e2e");
  await expect(page).toHaveURL(/\/history\?from=e2e$/);
  await expect(page.getByRole("heading", { name: "Riwayat" })).toBeVisible();
  await mkdir(dirname(authState), { recursive: true });
  await page.context().storageState({ path: authState });
});
