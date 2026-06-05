import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("TC-004 unauthenticated protected route redirects and preserves a safe return path", async ({
  page,
}) => {
  await page.goto("/history?page=2");

  await expect(page).toHaveURL(/\/\?login=1&next=%2Fhistory%3Fpage%3D2$/);
  await expect(page.getByRole("dialog", { name: "Sign in to continue." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close sign in" })).toBeFocused();
});

test("TC-001 invalid OAuth callback returns a generic login error signal", async ({
  page,
}) => {
  await page.goto("/auth/callback?next=https://evil.example");

  await expect(page).toHaveURL(/\/\?error=auth_callback_failed$/);
});
