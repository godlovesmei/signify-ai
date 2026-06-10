import { expect, test as setup } from "@playwright/test";

const authState = "tests/e2e/.auth/user.json";

setup("TC-002 valid Google OAuth callback creates authenticated storage state", async ({
  page,
}) => {
  await page.goto("/history?from=e2e");
  await expect(page.getByRole("dialog", { name: "Sign in to continue." })).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Continue with Google" }).click();

  await expect(page).toHaveURL(/\/history\?from=e2e$/);
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();
  await page.context().storageState({ path: authState });
});
