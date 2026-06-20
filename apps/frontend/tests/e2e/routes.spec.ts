import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("TC-005 landing and public documentation routes load", async ({ page }) => {
  for (const route of ["/", "/how-it-works", "/research", "/terms-condition"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : `${route}$`}`));
    await expect(page.locator("body")).toBeVisible();
  }

  for (const route of ["/en", "/en/research", "/en/terms-condition"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("body")).toBeVisible();
  }
});

test("TC-005 canonicalizes default locale prefix", async ({ page, request }) => {
  const response = await request.get("/id/research", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/research");

  await page.goto("/id/terms-condition");
  await expect(page).toHaveURL(/\/terms-condition$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
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
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/?$/);
  await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute(
    "href",
    /\/?$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="x-default"]'),
  ).toHaveAttribute("href", /\/?$/);
  await expect(page.locator('script[type="application/ld+json"]')).not.toContainText(
    "SearchAction",
  );

  await page.goto("/en/research");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/en\/research$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute(
    "href",
    /\/research$/,
  );

  for (const path of ["/manifest.webmanifest", "/hero.png", "/signify-icon.svg"]) {
    expect((await request.get(path)).ok()).toBe(true);
  }
});
