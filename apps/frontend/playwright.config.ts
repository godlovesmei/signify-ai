import { defineConfig, devices } from "@playwright/test";

const authState = "tests/e2e/.auth/user.json";
const appHost = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const appPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const appUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${appHost}:${appPort}`;
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  `http://127.0.0.1:${process.env.SUPABASE_MOCK_PORT ?? 54321}`;
const supabasePort = new URL(supabaseUrl).port || "54321";
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE ?? "production";
const appCommand =
  serverMode === "dev"
    ? `pnpm dev --hostname ${appHost} --port ${appPort}`
    : `pnpm build && pnpm start --hostname ${appHost} --port ${appPort}`;

process.env.PLAYWRIGHT_BASE_URL = appUrl;
process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: appUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/e2e/support/supabase-mock.mjs",
      url: `${supabaseUrl}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: {
        ...process.env,
        SUPABASE_MOCK_PORT: supabasePort,
      },
    },
    {
      command: appCommand,
      url: appUrl,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      },
    },
  ],
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: authState },
    },
    {
      name: "firefox",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Firefox"], storageState: authState },
    },
    {
      name: "webkit",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: { ...devices["Desktop Safari"], storageState: authState },
    },
  ],
  outputDir: "test-results",
});
