import { expect, test } from "@playwright/test";

test("TC-003 logout clears the session and returns to the landing page", async ({
  page,
}) => {
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL("/");
  await page.goto("/history");
  await expect(page).toHaveURL(/\/\?login=1&next=%2Fhistory$/);
});

test("TC-006 authenticated translation workspace exposes its initial camera state", async ({
  page,
}) => {
  await page.goto("/translate");

  await expect(page.getByRole("heading", { name: "Kamera" })).toBeVisible();
  await expect(page.getByText("Arahkan tangan ke kamera.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aktifkan kamera" })).toBeVisible();
});
