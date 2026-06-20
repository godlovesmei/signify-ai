import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { expect, test as setup } from "@playwright/test";

const authState = "tests/e2e/.auth/user.json";
const appBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const appOrigin = new URL(appBaseUrl).origin;
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseHost = new URL(supabaseUrl).hostname.split(".")[0];
const codeVerifierCookieName = `sb-${supabaseHost}-auth-token-code-verifier`;
const codeVerifierCookieValue = `base64-${Buffer.from("valid-test-verifier").toString("base64url")}`;
const expires = Math.floor(Date.now() / 1000) + 3600;

setup("TC-002 authenticated Supabase state opens protected routes", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: codeVerifierCookieName,
      value: codeVerifierCookieValue,
      url: appOrigin,
      expires,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);

  await page.goto("/auth/callback?code=valid-test-code&next=%2Fhistory%3Ffrom%3De2e");

  await expect(page).toHaveURL(/\/history\?from=e2e$/);
  await expect(page.getByRole("heading", { name: "Riwayat" })).toBeVisible();

  await mkdir(dirname(authState), { recursive: true });
  await page.context().storageState({ path: authState });
});
