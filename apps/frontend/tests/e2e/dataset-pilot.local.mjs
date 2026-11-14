// Approved pilot only: FFmpeg color pattern -> virtual camera -> native MediaRecorder.
// No physical camera, human media, mocked Auth, curation or export requests.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join } from "node:path";
const input = JSON.parse(readFileSync(0, "utf8"));
const API = "http://127.0.0.1:8001";
const AUTH = "http://127.0.0.1:55431";
const results = [];
const attempts = [];
const created = [];
let stage = "launch";
let browser;
let lastApiError = null;
function check(scenario, condition, details = {}) {
  if (!condition) throw new Error("assertion_failed");
  results.push({ scenario, status: "PASS", ...details });
  console.log("PASS " + scenario);
}
const sha = value => createHash("sha256").update(value).digest("hex");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const reportPath = join(input.directory, "report.json");
try {
  if (!input.camera.endsWith("/color-pattern.y4m")) throw new Error("synthetic_camera_required");
  browser = await chromium.launch({ headless: true, args: [
    "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
    "--use-file-for-fake-video-capture=" + input.camera,
  ] });
  const context = await browser.newContext({ permissions: ["camera"], viewport: { width: 1365, height: 1000 } });
  let outside = 0;
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && !["127.0.0.1", "localhost"].includes(url.hostname)) {
      outside += 1; return route.abort();
    }
    return route.continue();
  });
  await context.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.__pilotCamera = { constraints: [], streams: [] };
    navigator.mediaDevices.getUserMedia = async constraints => {
      const stream = await original(constraints);
      window.__pilotCamera.constraints.push(constraints);
      window.__pilotCamera.streams.push(stream);
      return stream;
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(90000);
  let bearer;
  page.on("request", request => {
    if (request.url().startsWith(API + "/") && request.headers().authorization) bearer = request.headers().authorization;
  });
  let injected = false;
  await page.route(API + "/api/v1/contributions", async route => {
    const request = route.request();
    if (request.method() !== "POST") return route.continue();
    const form = await new Request(API, { method: "POST", headers: { "content-type": request.headers()["content-type"] },
      body: request.postDataBuffer() }).formData();
    const bytes = Buffer.from(await form.get("file").arrayBuffer());
    const metadata = JSON.parse(form.get("metadata"));
    writeFileSync(join(input.directory, "recorded-source.webm"), bytes);
    const response = await route.fetch({ timeout: 60000 });
    const body = await response.json();
    attempts.push({ key: request.headers()["idempotency-key"], hash: sha(bytes), metadata, bytes: bytes.length,
      upstreamStatus: response.status(), id: body.contribution?.id, replayed: body.replayed });
    if (response.status() >= 400) lastApiError = { status: response.status(), code: body.error?.code };
    if (!injected && response.status() === 201) {
      injected = true; created.push(body.contribution);
      // Simulated response loss AFTER a real successful backend/Storage commit.
      return route.fulfill({ status: 503, headers: {
        "access-control-allow-origin": "http://localhost:3000", "content-type": "application/json",
      }, json: { error: { code: "upload_commit_unknown", message: "Synthetic response-loss test", retryable: true } } });
    }
    return route.fulfill({ response });
  });
  stage = "real local sign-in";
  await page.goto("http://localhost:3000/en/contributions/new");
  stage = "local login form";
  await page.getByLabel("Local account email").fill(input.actors[0].email);
  await page.getByLabel("Local account password").fill(input.actors[0].password);
  await page.getByRole("button", { name: "Sign in locally", exact: true }).click();
  stage = "local login navigation";
  await page.waitForURL("**/en/contributions/new");
  stage = "load contribution form";
  await page.getByLabel("Word to contribute").waitFor();
  check("Real local Auth and approved consent loaded", await page.getByText(input.consentVersion, { exact: false }).isVisible());
  const options = await page.locator("#contribution-catalog option").evaluateAll(items => items.map(item => item.value));
  check("All five approved labels are available", input.labels.every(label => options.includes(label.display_name)));
  await page.getByLabel("Word to contribute").fill("Halo");
  check("Existing named alphabet reference is separate from the contributed word", await page.getByRole("img", { name: "Alphabet A", exact: true }).isVisible());
  await page.screenshot({ path: join(input.directory, "contribution-desktop.png"), fullPage: true });

  async function recordClip() {
    const hasPreview = await page.locator('video[aria-label="Recording preview"]').count() > 0;
    await page.getByRole("button", { name: hasPreview ? "Record again" : "Enable camera", exact: true }).click();
    await page.getByRole("button", { name: "Start recording", exact: true }).waitFor();
    check("Recording guide is a visible DOM overlay", await page.locator("[data-recording-guide]").isVisible());
    await page.screenshot({ path: join(input.directory, "camera-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: "Start recording", exact: true }).click();
    await page.getByRole("button", { name: "Stop recording", exact: true }).waitFor();
    await delay(2200);
    await page.getByRole("button", { name: "Stop recording", exact: true }).click();
    await page.locator('video[aria-label="Recording preview"]').waitFor();
  }
  stage = "synthetic recording and preview";
  await recordClip();
  check("Native recorder countdown/start/stop produces a preview", true);
  check("All synthetic camera tracks end after stop", await page.evaluate(() =>
    window.__pilotCamera.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended"))));
  check("Recorder requests no audio", await page.evaluate(() =>
    window.__pilotCamera.constraints.every(value => value.audio === false) &&
    window.__pilotCamera.streams.every(stream => stream.getAudioTracks().length === 0)));
  const preview = page.locator('video[aria-label="Recording preview"]');
  await preview.evaluate(video => video.play());
  await page.waitForFunction(() => document.querySelector('video[aria-label="Recording preview"]').currentTime > .2);
  await preview.evaluate(video => video.pause());
  check("Synthetic preview really decodes and plays", true);

  stage = "retake";
  await recordClip();
  check("Retake uses a fresh synthetic stream and releases both", await page.evaluate(() =>
    window.__pilotCamera.streams.length === 2 &&
    window.__pilotCamera.streams.every(stream => stream.getTracks().every(track => track.readyState === "ended"))));
  await page.getByRole("checkbox").check();
  stage = "real upload with response loss";
  await page.getByRole("button", { name: "Submit contribution", exact: true }).click();
  await page.getByText("The outcome is not confirmed", { exact: false }).waitFor();
  check("Real backend commit survives simulated response loss", attempts[0].upstreamStatus === 201 && injected);
  check("Ambiguous retry freezes the original recording", await page.getByRole("button", { name: "Record again", exact: true }).isDisabled());
  await page.getByRole("button", { name: "Retry the same upload", exact: true }).click();
  await page.waitForURL(url => url.pathname === "/en/contributions" && url.searchParams.get("submitted") === created[0].id);
  await page.getByText("Contribution sent successfully", { exact: true }).waitFor();
  check("Successful sending opens My Collection with a confirmation, not semantic approval", true);

  // Duplicate-tab behavior: a fresh document shares the authenticated cookies.
  stage = "duplicate and reload contribution pages";
  for (const path of ["/contributions", "/contributions/new", "/en/contributions", "/en/contributions/new"]) {
    const duplicate = await context.newPage();
    const response = await duplicate.goto("http://localhost:3000" + path);
    const expectedHeading = path.endsWith("/new")
      ? (path.startsWith("/en/") ? "Contribute a New Sign" : "Kontribusi Isyarat Baru")
      : (path.startsWith("/en/") ? "My Collection" : "Koleksi Saya");
    await duplicate.getByRole("heading", { level: 1, name: expectedHeading, exact: true }).waitFor();
    check("Duplicate tab opens " + path, response.status() === 200 && new URL(duplicate.url()).pathname === path);
    const reloaded = await duplicate.reload();
    await duplicate.getByRole("heading", { level: 1, name: expectedHeading, exact: true }).waitFor();
    check("Reload keeps " + path + " accessible", reloaded.status() === 200);
    await duplicate.close();
  }

  check("Retry reuses bytes, metadata and idempotency key", attempts.length === 2 &&
    attempts[0].key === attempts[1].key && attempts[0].hash === attempts[1].hash &&
    JSON.stringify(attempts[0].metadata) === JSON.stringify(attempts[1].metadata));
  check("Backend retry returns the same PENDING candidate", attempts[1].upstreamStatus === 200 &&
    attempts[1].replayed === true && attempts[1].id === created[0].id && created[0].status === "PENDING");
  check("Consent version and verified owner are stored", created[0].consent_version === input.consentVersion &&
    created[0].user_id === input.actors[0].id && created[0].recognition_event_id === null);
  check("Backend reports decoded video metadata and matching source hash", created[0].source_sha256 === attempts[0].hash &&
    created[0].duration_ms >= input.policy.min_duration_ms && created[0].duration_ms <= input.policy.max_duration_ms &&
    created[0].width >= input.policy.min_short_side_px && created[0].fps > 0 && created[0].mime_type === "video/webm");

  const auth = { Authorization: bearer };
  const meta = { proposed_label_id: input.labels.find(label => label.code === "halo").id,
    consent: true, consent_version: input.consentVersion };
  const post = (bytes, key = randomUUID(), metadata = meta) => context.request.post(API + "/api/v1/contributions", {
    headers: { ...auth, "Idempotency-Key": key }, timeout: 60000, multipart: {
      file: { name: "untrusted-browser-name.bin", mimeType: "application/octet-stream", buffer: bytes },
      metadata: JSON.stringify(metadata),
    },
  });
  stage = "backend validation";
  for (const [name, bytes, expected] of [
    ["corrupt input", Buffer.from("not a video"), 422],
    ["audio-only container", readFileSync(input.files.audio), 422],
    ["short duration", readFileSync(input.files.short), 422],
    ["long duration", readFileSync(input.files.long), 422],
    ["small resolution", readFileSync(input.files.small), 422],
    ["large resolution", readFileSync(input.files.large), 422],
    ["oversized body", Buffer.alloc(input.policy.max_size_bytes + 1), 413],
  ]) {
    const response = await post(bytes);
    const body = await response.json();
    check("Backend rejects " + name, response.status() === expected, { http_status: response.status(), code: body.error?.code });
  }
  const changed = await post(readFileSync(input.files.valid), attempts[0].key);
  check("Changed content cannot reuse a successful key", changed.status() === 409);
  const forged = await post(readFileSync(input.files.valid), randomUUID(), { ...meta, user_id: input.actors[1].id, status: "APPROVED" });
  check("Client cannot assign another owner or APPROVED status", forged.status() === 422);
  const proposalText = "Synthetic proposal " + input.runId.slice(0, 8);
  const mp4 = await post(readFileSync(input.files.valid), randomUUID(), {
    proposed_label_text: proposalText, consent: true, consent_version: input.consentVersion,
  });
  const mp4Body = await mp4.json();
  check("Backend detects valid MP4 despite misleading browser MIME/name", mp4.status() === 201 &&
    mp4Body.contribution.mime_type === "video/mp4" && mp4Body.contribution.status === "PENDING");
  created.push(mp4Body.contribution);
  check("A new word stays a free-text PENDING proposal without creating an official label",
    mp4Body.contribution.proposed_label_text === proposalText && mp4Body.contribution.proposed_label_id === null &&
    mp4Body.contribution.final_label_id === null);

  stage = "own collection";
  const list = await context.request.get(API + "/api/v1/contributions", { headers: auth });
  const listBody = await list.json();
  check("Own API collection contains only this contributor", list.status() === 200 && listBody.items.length === 2 &&
    listBody.items.every(row => row.user_id === input.actors[0].id));
  await page.goto("http://localhost:3000/en/contributions");
  await page.getByRole("button", { name: "Halo", exact: true }).waitFor();
  check("My collection UI shows the PENDING contributions", (await page.getByRole("table").getByText("Pending review", { exact: true }).count()) === 2);
  const summaryResponse = await context.request.get(API + "/api/v1/contributions/summary", { headers: auth });
  const counts = await summaryResponse.json();
  check("Global collection counts use the authenticated owner's real data", summaryResponse.status() === 200 &&
    counts.total === 2 && counts.PENDING === 2 && counts.APPROVED === 0 && counts.REJECTED === 0);
  const catalogSearch = await context.request.get(API + "/api/v1/contributions?q=Halo", { headers: auth });
  check("Server search finds catalog-backed contributions", catalogSearch.status() === 200 && (await catalogSearch.json()).items.length === 1);
  const grammarSearch = await context.request.get(API + "/api/v1/contributions?q=" + encodeURIComponent('"),user_id.neq.other,("'), { headers: auth });
  check("Search punctuation cannot override owner scoping", grammarSearch.status() === 200 && (await grammarSearch.json()).items.length === 0);
  await page.screenshot({ path: join(input.directory, "collection-desktop.png"), fullPage: true });
  await page.getByLabel("Search contributed words").fill(proposalText);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: proposalText, exact: true }).waitFor();
  await page.getByRole("button", { name: "Halo", exact: true }).waitFor({ state: "hidden" });
  check("Collection word search includes free-text proposals", true);
  await page.getByLabel("Filter contribution status").selectOption("APPROVED");
  await page.getByText("No matching contributions", { exact: true }).waitFor();
  check("Status filtering does not promote PENDING contributions", true);
  await page.getByLabel("Filter contribution status").selectOption("");
  await page.getByLabel("Search contributed words").fill("");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: "Halo", exact: true }).waitFor();
  await page.getByRole("button", { name: "Play contribution Halo", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  const modalVideo = page.getByRole("dialog").locator("video");
  await modalVideo.waitFor();
  await modalVideo.evaluate(video => video.play());
  await page.waitForFunction(() => document.querySelector('[role="dialog"] video')?.currentTime > .2);
  check("Collection play action opens private playback inside the page", true);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  check("Closing collection playback removes its video element", await page.locator('[role="dialog"] video').count() === 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(input.directory, "collection-mobile.png"), fullPage: true });
  check("Mobile collection avoids page overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto("http://localhost:3000/en/contributions/new?word=Synthetic%20proposal");
  await page.getByLabel("Word to contribute").waitFor();
  check("Word proposal handoff works without a recognition model", await page.getByLabel("Word to contribute").inputValue() === "Synthetic proposal");
  await page.screenshot({ path: join(input.directory, "contribution-mobile.png"), fullPage: true });
  check("Mobile contribution avoids page overflow", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 1365, height: 1000 });

  stage = "private playback";
  await page.goto("http://localhost:3000/en/contributions/" + created[0].id);
  await page.getByRole("button", { name: "Load private video", exact: true }).click();
  const privateVideo = page.locator('video[aria-label="Private video playback"]');
  await privateVideo.waitFor();
  await privateVideo.evaluate(video => video.play());
  await page.waitForFunction(() => document.querySelector('video[aria-label="Private video playback"]').currentTime > .2);
  await privateVideo.evaluate(video => video.pause());
  check("Private signed video really decodes and plays", true);
  // Save only a synthetic frame/UI screenshot, never a signed URL or network trace.
  await page.screenshot({ path: join(input.directory, "private-playback.png"), fullPage: true });
  const accessResponse = await context.request.post(API + "/api/v1/contributions/" + created[0].id + "/video-access", { headers: auth });
  const access = await accessResponse.json();
  const accessDeadline = Date.now() + access.expires_in * 1000;
  const signed = new URL(access.url);
  check("Signed access stays on the local private bucket", signed.origin === AUTH &&
    signed.pathname.startsWith("/storage/v1/object/sign/dataset-contribution-videos/"));
  const media = await context.request.get(access.url);
  check("Signed source bytes match the uploaded SHA-256", media.status() === 200 && sha(await media.body()) === created[0].source_sha256);

  stage = "other owner and direct storage denial";
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  let otherBearer;
  otherPage.on("request", request => {
    if (request.url().startsWith(API + "/") && request.headers().authorization) otherBearer = request.headers().authorization;
  });
  await otherPage.goto("http://localhost:3000/en/contributions");
  await otherPage.getByLabel("Local account email").fill(input.actors[1].email);
  await otherPage.getByLabel("Local account password").fill(input.actors[1].password);
  await otherPage.getByRole("button", { name: "Sign in locally", exact: true }).click();
  await otherPage.getByText("Your collection starts here", { exact: true }).waitFor();
  check("Second authenticated contributor cannot see another collection", Boolean(otherBearer));
  const otherCounts = await other.request.get(API + "/api/v1/contributions/summary", { headers: { Authorization: otherBearer } });
  check("Other contributor summary reveals no owner counts", otherCounts.status() === 200 && (await otherCounts.json()).total === 0);
  for (const [name, path, method] of [
    ["detail", "/api/v1/contributions/" + created[0].id, "get"],
    ["signed access", "/api/v1/contributions/" + created[0].id + "/video-access", "post"],
  ]) {
    const response = await other.request[method](API + path, { headers: { Authorization: otherBearer } });
    check("Cross-owner " + name + " returns 404", response.status() === 404);
  }
  const storagePath = "/dataset-contribution-videos/" + input.actors[0].id + "/" + created[0].id + "/video";
  const anonRead = await context.request.get(AUTH + "/storage/v1/object" + storagePath, { headers: { apikey: input.publicKey } });
  const otherRead = await context.request.get(AUTH + "/storage/v1/object" + storagePath, { headers: { apikey: input.publicKey, Authorization: otherBearer } });
  check("Anonymous and other-owner unsigned video reads are denied", anonRead.status() >= 400 && otherRead.status() >= 400);
  const direct = await context.request.post(AUTH + "/storage/v1/object/dataset-contribution-videos/" +
    input.actors[0].id + "/" + randomUUID() + "/video", { headers: {
      apikey: input.publicKey, ...auth, "content-type": "video/webm",
    }, data: readFileSync(join(input.directory, "recorded-source.webm")) });
  check("Contributor cannot bypass backend validation with direct Storage upload", direct.status() >= 400, { http_status: direct.status() });
  await other.close();

  stage = "signed expiry";
  console.log("WAITING_LOCAL_SIGNED_URL_EXPIRY");
  await page.getByText("Video access expired", { exact: false }).waitFor({ timeout: 70000 });
  check("Expired video URL is removed from the UI", await privateVideo.count() === 0);
  // This access link was issued slightly later than the UI link.
  await delay(Math.max(0, accessDeadline - Date.now() + 2000));
  const old = await context.request.get(access.url);
  check("Expired Storage signed URL no longer grants access", old.status() >= 400, { http_status: old.status() });
  await page.getByRole("button", { name: "Renew video access", exact: true }).click();
  await privateVideo.waitFor();
  await privateVideo.evaluate(video => video.play());
  await page.waitForFunction(() => document.querySelector('video[aria-label="Private video playback"]').currentTime > .2);
  check("Authorized owner can renew playback after expiry", true);
  check("Browser data requests remain local", outside === 0);
  const report = { kind: "real-local-approved-pilot", results, fail: 0, synthetic_only: true,
    human_recordings: false, semantic_curation: false, exports_invoked: false,
    created_ids: created.map(row => row.id), media: created.map(row => ({
      id: row.id, duration_ms: row.duration_ms, width: row.width, height: row.height,
      fps: row.fps, mime_type: row.mime_type, codec: row.codec, source_sha256: row.source_sha256,
    })), retry: { upstream_statuses: attempts.map(row => row.upstreamStatus), identical_source: attempts[0].hash === attempts[1].hash,
      identical_key: attempts[0].key === attempts[1].key, response_loss_injected_after_real_commit: injected },
    credentials_or_signed_urls_persisted: false };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pass: results.length, fail: 0, synthetic_only: true, contributions: created.length }));
} catch (error) {
  writeFileSync(reportPath, JSON.stringify({ results, fail: 1, failed_stage: stage, error_name: error.name,
    last_api_error: lastApiError, created_ids: created.map(row => row.id), synthetic_only: true }, null, 2));
  console.error(JSON.stringify({ pass: results.length, fail: 1, failed_stage: stage, error_name: error.name,
    last_api_error: lastApiError }));
  process.exitCode = 1;
} finally { await browser?.close(); }
