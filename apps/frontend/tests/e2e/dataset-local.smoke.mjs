// Real local Auth/API smoke test. Credentials arrive through stdin and are never saved.
// Run through supabase/tests/integration/test_dataset_frontend_local.py.
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const input = JSON.parse(readFileSync(0, "utf8"));
const results = [];
let stage = "launch";
let browser;
const directory = resolve("test-results/dataset-local-smoke");
mkdirSync(directory, { recursive: true });
function check(name, condition) {
  if (!condition) throw new Error("assertion");
  results.push({ scenario: name, status: "PASS" });
}
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  let external = 0;
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      external += 1; return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(90000);
  let bearer;
  page.on("request", request => {
    if (request.url().startsWith("http://127.0.0.1:8001/")) {
      const value = request.headers()["authorization"];
      if (value) bearer = value;
    }
  });
  stage = "anonymous route";
  await page.goto("http://localhost:3000/en/contributions/new");
  await page.waitForURL(url => url.pathname === "/en" && url.searchParams.get("login") === "1");
  check("Unauthenticated contribution route redirects to existing login", true);
  check("Anonymous catalog request is rejected", (await page.request.get("http://127.0.0.1:8001/api/v1/dataset/labels")).status() === 401);

  stage = "local password login";
  await page.getByLabel("Local account email").fill(input.actors[0].email);
  await page.getByLabel("Local account password").fill(input.actors[0].password);
  await page.getByRole("button", { name: "Sign in locally", exact: true }).click();
  await page.waitForURL("**/en/contributions/new");
  await page.getByText("Recording configuration is not available", { exact: true }).waitFor();
  check("Real local password sign-in passes AuthGuard and server proxy", Boolean(bearer));
  check("Inactive policy is shown and camera is disabled", await page.getByRole("button", { name: "Enable camera", exact: true }).isDisabled());
  check("Empty real catalog is shown and upload is disabled",
    await page.getByText("No active dataset labels", { exact: false }).isVisible() &&
    await page.getByRole("button", { name: "Submit contribution", exact: true }).isDisabled());
  await page.screenshot({ path: resolve(directory, "new-desktop.png"), fullPage: true });

  stage = "local API contracts";
  const auth = { Authorization: bearer };
  const labels = await page.request.get("http://127.0.0.1:8001/api/v1/dataset/labels", { headers: auth });
  check("Authenticated catalog returns an empty real list", labels.status() === 200 && (await labels.json()).items.length === 0);
  check("Real policy endpoint returns 503", (await page.request.get("http://127.0.0.1:8001/api/v1/dataset/video-policy", { headers: auth })).status() === 503);
  for (const [name, token] of [["invalid", "synthetic-invalid"], ["expired", input.expiredToken]]) {
    check(name + " token returns 401", (await page.request.get("http://127.0.0.1:8001/api/v1/contributions",
      { headers: { Authorization: "Bearer " + token } })).status() === 401);
  }

  stage = "own collection";
  await page.goto("http://localhost:3000/en/contributions");
  await page.getByText("Your collection starts here", { exact: true }).waitFor();
  check("Real own collection returns its empty state", true);
  if (input.otherContribution) {
    stage = "cross-owner denial";
    await page.goto("http://localhost:3000/en/contributions/" + input.otherContribution);
    await page.getByRole("alert").filter({ hasText: "belongs to another account" }).waitFor();
    check("Existing contribution owned by another actor is hidden", true);
    const denied = await page.request.post("http://127.0.0.1:8001/api/v1/contributions/" + input.otherContribution + "/video-access", { headers: auth });
    check("Cross-owner private video access returns 404", denied.status() === 404);
  }

  stage = "mobile layout";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3000/en/contributions/new");
  await page.getByText("Recording configuration is not available", { exact: true }).waitFor();
  check("Mobile contribution navigation is available", await page.getByRole("link", { name: "Contributions", exact: true }).isVisible());
  check("Mobile page has no horizontal overflow", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: resolve(directory, "new-mobile.png"), fullPage: true });

  stage = "second local contributor";
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto("http://localhost:3000/en/contributions");
  await otherPage.getByLabel("Local account email").fill(input.actors[1].email);
  await otherPage.getByLabel("Local account password").fill(input.actors[1].password);
  await otherPage.getByRole("button", { name: "Sign in locally", exact: true }).click();
  await otherPage.waitForURL("**/en/contributions");
  await otherPage.getByText("Your collection starts here", { exact: true }).waitFor();
  check("Second real contributor sees its own empty collection", true);
  await other.close();
  check("Browser data requests stay on loopback origins", external === 0);
  const report = { kind: "real-local-smoke", results, upload_e2e: "NOT RUN: pilot policy/catalog are inactive",
    credentials_persisted: false };
  writeFileSync(resolve(directory, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pass: results.length, fail: 0, upload_e2e: report.upload_e2e }));
} catch (error) {
  writeFileSync(resolve(directory, "report.json"), JSON.stringify({ results, failed_stage: stage, error_name: error.name }, null, 2));
  // Do not print Playwright call logs, passwords, headers, cookies or JWTs.
  console.error(JSON.stringify({ pass: results.length, fail: 1, failed_stage: stage, error_name: error.name }));
  process.exitCode = 1;
} finally { await browser?.close(); }
