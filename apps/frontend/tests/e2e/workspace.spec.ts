import { expect, test } from "@playwright/test";

test("TC-003 logout clears the session and returns to the landing page", async ({
  page,
}) => {
  await page.goto("/history");
  await expect(
    page.getByRole("heading", { name: "Riwayat", exact: true }),
  ).toBeVisible();

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

test("TC-028 mobile workspace exposes Settings in the bottom navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/translate");

  await page.getByRole("button", { name: "Pengaturan" }).click();

  await expect(page.getByRole("dialog", { name: "Pengaturan" })).toBeVisible();
});

test("TC-028 tablet workspace exposes Settings in the bottom navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/translate");

  await page.getByRole("button", { name: "Pengaturan" }).click();

  await expect(page.getByRole("dialog", { name: "Pengaturan" })).toBeVisible();
});

test("TC-002 authenticated landing sign-in CTA opens the workspace and exposes the repository link", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Masuk" }).first().click();
  await expect(page).toHaveURL(/\/translate$/);
  await expect(
    page.getByRole("dialog", { name: "Masuk untuk melanjutkan." }),
  ).toHaveCount(0);

  await page.goto("/");
  const repositoryLink = page
    .getByRole("link", {
      name: "GitHub repository godlovesmei/signify-ai",
    })
    .first();

  await expect(repositoryLink).toHaveAttribute(
    "href",
    "https://github.com/godlovesmei/signify-ai",
  );
  await expect(repositoryLink).toHaveAttribute("target", "_blank");
  await expect(page.getByRole("button", { name: "Minta akses" })).toHaveCount(0);
});
