import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

async function enableTranslateTestApi(page: Page) {
  await page.addInitScript(() => {
    const targetWindow = window as typeof window & {
      __SIGNIFY_E2E__?: boolean;
      speechSynthesis?: SpeechSynthesis;
    };

    targetWindow.__SIGNIFY_E2E__ = true;
    targetWindow.speechSynthesis = {
      speak(utterance: SpeechSynthesisUtterance) {
        setTimeout(() => utterance.onend?.(new Event("end") as SpeechSynthesisEvent), 0);
      },
      cancel() {},
      pause() {},
      resume() {},
      getVoices() {
        return [];
      },
      pending: false,
      speaking: false,
      paused: false,
      onvoiceschanged: null,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true;
      },
    } as SpeechSynthesis;
  });
}

async function waitForTranslateTestApi(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Boolean(
            (window as typeof window & {
              __SIGNIFY_TRANSLATE_TEST_API__?: unknown;
            }).__SIGNIFY_TRANSLATE_TEST_API__,
          ),
      ),
    )
    .toBe(true);
}

async function callTranslateTestApi(
  page: Page,
  callback: string,
  ...args: unknown[]
) {
  await page.evaluate(
    ({ method, values }: { method: string; values: unknown[] }) => {
      const api = (
        window as typeof window & {
          __SIGNIFY_TRANSLATE_TEST_API__?: Record<string, (...input: unknown[]) => void>;
        }
      ).__SIGNIFY_TRANSLATE_TEST_API__;
      api?.[method]?.(...values);
    },
    { method: callback, values: args },
  );
}

test.describe("UAT Acceptance Evidence", () => {
  test("UAT-001 Authentication opens an authenticated workspace", async ({
    page,
  }, testInfo) => {
    await page.goto("/profile");

    await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();
    await expect(page.getByText("qa@signify.local")).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-001-authenticated-profile");
  });

  test("UAT-004 Translate camera reaches a ready state", async ({
    page,
  }, testInfo) => {
    await enableTranslateTestApi(page);
    await page.goto("/translate");
    await waitForTranslateTestApi(page);
    await callTranslateTestApi(page, "setCameraState", "ready");

    await expect(page.getByLabel("Kamera penerjemah")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mulai terjemah" })).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-004-translate-camera-ready");
  });

  test("UAT-005 ONNX browser inference result is shown without FastAPI", async ({
    page,
  }, testInfo) => {
    await enableTranslateTestApi(page);
    await page.route("**/api/v1/translate/predict", (route) => {
      throw new Error(`Unexpected legacy backend request: ${route.request().url()}`);
    });
    await page.goto("/translate");
    await waitForTranslateTestApi(page);
    await callTranslateTestApi(page, "showMockDetection", "A", 0.96);

    await expect(page.locator("[data-detection-box]")).toBeVisible();
    await expect(page.locator("[data-prediction-badge]").first()).toHaveText("A");
    await expect(page.getByText("96%").first()).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-005-browser-inference-result");
  });

  test("UAT-006 Inference recovery shows a clear camera permission error", async ({
    page,
  }, testInfo) => {
    await enableTranslateTestApi(page);
    await page.goto("/translate");
    await waitForTranslateTestApi(page);
    await callTranslateTestApi(page, "setCameraState", "error-permission");

    await expect(page.getByText("Izin kamera ditolak")).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-006-camera-error-recovery");
  });

  test("UAT-007 Sentence builder edits the generated sentence", async ({
    page,
  }, testInfo) => {
    await enableTranslateTestApi(page);
    await page.goto("/translate");
    await waitForTranslateTestApi(page);
    await callTranslateTestApi(page, "setMockSentence", "AKU");

    const sentenceBuilder = page.getByLabel("Penyusun kalimat").first();
    await expect(sentenceBuilder.getByLabel("Kalimat tersusun")).toContainText("AKU");
    await sentenceBuilder.getByRole("button", { name: "Tambah spasi" }).click();
    await sentenceBuilder.getByRole("button", { name: "Hapus huruf terakhir" }).click();
    await sentenceBuilder.getByRole("button", { name: "Bersihkan kalimat" }).click();
    await sentenceBuilder
      .getByRole("button", { name: "Konfirmasi bersihkan kalimat" })
      .click();
    await expect(sentenceBuilder.getByLabel("Kalimat tersusun")).toContainText(
      "Hasil muncul di sini",
    );

    await callTranslateTestApi(page, "setMockSentence", "AKU");
    await attachScreenshot(page, testInfo, "UAT-007-sentence-builder");
  });

  test("UAT-008 Text-to-speech control accepts a built sentence", async ({
    page,
  }, testInfo) => {
    await enableTranslateTestApi(page);
    await page.goto("/translate");
    await waitForTranslateTestApi(page);
    await callTranslateTestApi(page, "setMockSentence", "AKU BISA");

    await page.getByRole("button", { name: "Dengarkan kalimat" }).click();
    await expect(page.getByLabel("Kalimat tersusun")).toContainText("AKU BISA");
    await attachScreenshot(page, testInfo, "UAT-008-text-to-speech");
  });

  test("UAT-009 History shows account-scoped empty state and actions", async ({
    page,
  }, testInfo) => {
    await page.goto("/history");

    await expect(
      page.getByRole("heading", { name: "Riwayat", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Belum ada riwayat")).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-009-history");
  });

  test("UAT-010 Practice and reference pages expose learning progress", async ({
    page,
  }, testInfo) => {
    await page.goto("/practice");
    await expect(page.getByText("Target", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Performa", { exact: true })).toBeVisible();

    await page.goto("/reference");
    await expect(page.getByRole("heading", { name: "Referensi" })).toBeVisible();
    await expect(page.getByAltText("Referensi untuk huruf A")).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-010-practice-reference");
  });

  test("UAT-011 Preferences and profile are visible and adjustable", async ({
    page,
  }, testInfo) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profil" })).toBeVisible();

    await page.getByRole("button", { name: "Pengaturan" }).click();
    await expect(page.getByRole("dialog", { name: "Pengaturan" })).toBeVisible();
    await page.getByRole("radio", { name: "Gelap" }).click();
    await page.getByRole("switch", { name: "Kontras tinggi" }).click();
    await expect(page.getByRole("radio", { name: "Gelap" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await attachScreenshot(page, testInfo, "UAT-011-preferences-profile");
  });

  test("UAT-012 Logout ends the session and protects workspace routes", async ({
    page,
  }, testInfo) => {
    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "Riwayat", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/history");
    await expect(page.getByRole("dialog", { name: "Masuk untuk melanjutkan." })).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-012-logout-protected-route");
  });
});

test.describe("UAT Acceptance Evidence - Anonymous", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("UAT-002 Protected routes redirect anonymous users to login", async ({
    page,
  }, testInfo) => {
    await page.goto("/translate");

    await expect(page.getByRole("dialog", { name: "Masuk untuk melanjutkan." })).toBeVisible();
    await expect(page).toHaveURL("/");
    await attachScreenshot(page, testInfo, "UAT-002-protected-route");
  });

  test("UAT-003 Public routes load without authentication", async ({
    page,
  }, testInfo) => {
    for (const route of ["/", "/how-it-works", "/research", "/terms-condition"]) {
      const response = await page.goto(route);
      expect(response?.ok()).toBe(true);
    }

    await expect(
      page.getByRole("heading", { name: "Syarat & Ketentuan" }),
    ).toBeVisible();
    await attachScreenshot(page, testInfo, "UAT-003-public-routes");
  });
});
