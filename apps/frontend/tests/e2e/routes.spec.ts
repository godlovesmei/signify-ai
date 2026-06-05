import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("TC-005 landing and public documentation routes load", async ({ page }) => {
  for (const route of ["/", "/how-it-works", "/research", "/terms-condition"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  }
});

test("TC-026 metadata and referenced public assets are valid", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SignifyAI/);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  await expect(page.locator('script[type="application/ld+json"]')).not.toContainText(
    "SearchAction",
  );

  for (const path of ["/manifest.webmanifest", "/hero.png", "/signify-icon.svg"]) {
    expect((await request.get(path)).ok()).toBe(true);
  }
});
