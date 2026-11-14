import type { VideoPolicy } from "./types";
const CANDIDATES = [
  "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm",
  "video/mp4;codecs=avc1.42E01E", "video/mp4",
];
export function chooseRecordingMime(policy: VideoPolicy, supported: (mime: string) => boolean) {
  return CANDIDATES.find(mime => policy.allowed_mime_types.includes(mime.split(";")[0]) && supported(mime)) ?? null;
}
export function validateRecording(blob: Blob, durationMs: number, width: number, height: number, policy: VideoPolicy) {
  if (!blob.size) return "emptyVideo";
  if (blob.size > policy.max_size_bytes) return "tooLarge";
  if (!policy.allowed_mime_types.includes(blob.type.split(";")[0])) return "format";
  if (durationMs < policy.min_duration_ms || durationMs > policy.max_duration_ms) return "duration";
  if (!width || !height || Math.min(width, height) < policy.min_short_side_px ||
      Math.max(width, height) > policy.max_long_side_px) return "resolution";
  return null;
}
export function stopCamera(stream: MediaStream | null) { stream?.getTracks().forEach(track => track.stop()); }

/** Render only camera pixels, so the recorded stream matches the mirrored preview. */
export function createMirroredRecording(video: HTMLVideoElement, camera: MediaStream, onError: () => void) {
  const canvas = document.createElement("canvas");
  if (typeof canvas.captureStream !== "function") throw new Error("mirrorUnsupported");
  const width = video.videoWidth, height = video.videoHeight;
  if (!width || !height || video.readyState < 2) throw new Error("recording");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("mirrorUnsupported");
  context.setTransform(-1, 0, 0, 1, width, 0);
  context.drawImage(video, 0, 0, width, height);
  const frameRate = camera.getVideoTracks()[0]?.getSettings().frameRate;
  const stream = canvas.captureStream(typeof frameRate === "number" && Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 30);
  let animation: number | null = null;
  let stopped = false;
  const release = () => {
    if (stopped) return;
    stopped = true;
    if (animation !== null) cancelAnimationFrame(animation);
    stopCamera(stream);
  };
  const draw = () => {
    if (stopped) return;
    try {
      if (video.readyState >= 2) context.drawImage(video, 0, 0, width, height);
      animation = requestAnimationFrame(draw);
    } catch { release(); onError(); }
  };
  animation = requestAnimationFrame(draw);
  return { stream, width, height, release };
}
