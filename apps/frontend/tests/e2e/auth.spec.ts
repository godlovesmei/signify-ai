import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("TC-004 unauthenticated protected route redirects and preserves a safe return path", async ({
  page,
}) => {
  await page.goto("/history?page=2");

  await expect(page.getByRole("dialog", { name: "Masuk untuk melanjutkan." })).toBeVisible();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Tutup masuk" })).toBeFocused();
});

test("TC-004 English protected route keeps locale in login redirect", async ({
  page,
}) => {
  await page.goto("/en/history?page=2");

  await expect(page.getByRole("dialog", { name: "Sign in to continue." })).toBeVisible();
  await expect(page).toHaveURL("/en");
  await expect(page.getByRole("button", { name: "Close sign in" })).toBeFocused();
});

test("TC-004 landing start translating opens login without a redirect query", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Mulai menerjemahkan" }).click();

  await expect(page.getByRole("dialog", { name: "Masuk untuk melanjutkan." })).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("TC-001 invalid OAuth callback returns a generic login error signal", async ({
  page,
}) => {
  await page.goto("/auth/callback?next=https://evil.example");

  await expect(page).toHaveURL(/\/\?error=auth_callback_failed$/);
});
