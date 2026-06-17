import { expect, test } from "@playwright/test";

test("TC-003 logout clears the session and returns to the landing page", async ({
  page,
}) => {
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Riwayat" })).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();

  await expect(page).toHaveURL("/");
  await page.goto("/history");
  await expect(page.getByRole("dialog", { name: "Masuk untuk melanjutkan." })).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("TC-006 authenticated translation workspace exposes its initial camera state", async ({
  page,
}) => {
  await page.goto("/translate");

  await expect(page.getByLabel("Kamera penerjemah")).toBeVisible();
  await expect(page.getByText("Kecepatan")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Aktifkan kamera" })).toBeVisible();
});

test("TC-002 authenticated landing auth CTAs open the workspace", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Masuk" }).first().click();
  await expect(page).toHaveURL(/\/translate$/);
  await expect(
    page.getByRole("dialog", { name: "Masuk untuk melanjutkan." }),
  ).toHaveCount(0);

  await page.goto("/");
  await page.getByRole("button", { name: "Minta akses" }).first().click();
  await expect(page).toHaveURL(/\/translate$/);
  await expect(
    page.getByRole("dialog", { name: "Masuk untuk melanjutkan." }),
  ).toHaveCount(0);
});
