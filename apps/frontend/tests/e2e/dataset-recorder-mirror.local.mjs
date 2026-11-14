// Offline browser check using synthetic pixels; no camera, account, or server.
// Run from apps/frontend: node tests/e2e/dataset-recorder-mirror.local.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import ts from "typescript";

const source = readFileSync(new URL("../../lib/dataset/recorder.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  await context.route("**/*", route => route.abort());
  const page = await context.newPage();
  await page.addScriptTag({ content: "(() => { const exports = {};\n" + outputText +
    "\nwindow.recorderTools = exports; })();" });
  for (const mirrored of [false, true]) {
    const result = await page.evaluate(async mirrored => {
      const source = document.createElement("canvas");
      source.width = 64; source.height = 48;
      const pixels = source.getContext("2d");
      const paint = () => {
        pixels.fillStyle = "red"; pixels.fillRect(0, 0, 32, 48);
        pixels.fillStyle = "blue"; pixels.fillRect(32, 0, 32, 48);
      };
      paint();
      const camera = source.captureStream(20);
      const repaint = setInterval(paint, 50);
      const video = document.createElement("video");
      video.muted = true; video.playsInline = true; video.srcObject = camera;
      document.body.append(video);
      await video.play();
      let drawingFailed = false;
      const transformed = mirrored ? window.recorderTools.createMirroredRecording(video, camera,
        () => { drawingFailed = true; }) : null;
      const chunks = [];
      const recorder = new MediaRecorder(transformed?.stream ?? camera, { mimeType: "video/webm;codecs=vp8" });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      const stopped = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start(100);
      await new Promise(resolve => setTimeout(resolve, 700));
      recorder.stop(); await stopped;
      transformed?.release();
      clearInterval(repaint); camera.getTracks().forEach(track => track.stop());
      video.srcObject = null; video.remove();
      const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType }));
      const playback = document.createElement("video");
      playback.muted = true; playback.src = url;
      await playback.play();
      const sample = document.createElement("canvas");
      sample.width = 64; sample.height = 48;
      const decoded = sample.getContext("2d");
      decoded.drawImage(playback, 0, 0, 64, 48);
      const result = {
        width: playback.videoWidth, height: playback.videoHeight, drawingFailed,
        left: [...decoded.getImageData(16, 24, 1, 1).data],
        right: [...decoded.getImageData(48, 24, 1, 1).data],
      };
      playback.pause(); playback.removeAttribute("src"); playback.load(); URL.revokeObjectURL(url);
      return result;
    }, mirrored);
    assert.equal(result.drawingFailed, false);
    assert.equal(result.width, 64); assert.equal(result.height, 48);
    const red = pixel => pixel[0] > 200 && pixel[2] < 50;
    const blue = pixel => pixel[2] > 200 && pixel[0] < 50;
    assert.ok(mirrored ? blue(result.left) && red(result.right) : red(result.left) && blue(result.right),
      "Decoded recording must have the selected orientation");
    console.log("PASS: recorded video pixels, " + (mirrored ? "mirror" : "no mirror"));
  }
} finally {
  await browser.close();
}
