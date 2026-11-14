"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { chooseRecordingMime, createMirroredRecording, stopCamera, validateRecording } from "@/lib/dataset/recorder";
import type { VideoPolicy } from "@/lib/dataset/types";

export interface DatasetRecording {
  blob: Blob; durationMs: number; width: number; height: number; url: string; mirrored: boolean;
}
type Phase = "idle" | "opening" | "ready" | "countdown" | "recording" | "preview";

export function useDatasetRecorder(policy: VideoPolicy | null) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [recording, setRecording] = useState<DatasetRecording | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorSizeBytes, setErrorSizeBytes] = useState<number | null>(null);
  const [mirrored, setMirrorState] = useState(false);
  const mirrorLocked = useRef(false);
  const mirroredRecording = useRef<ReturnType<typeof createMirroredRecording> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const active = useRef(true);
  const generation = useRef(0);
  const previewUrl = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const starting = useRef(false);
  const startedAt = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(timer => { clearTimeout(timer); clearInterval(timer); });
    timers.current = [];
  }, []);
  const releaseMirror = useCallback(() => {
    mirroredRecording.current?.release();
    mirroredRecording.current = null;
  }, []);
  const release = useCallback(() => {
    generation.current += 1;
    clearTimers();
    if (recorder.current) {
      recorder.current.ondataavailable = null;
      recorder.current.onstop = null;
      recorder.current.onerror = null;
      if (recorder.current.state !== "inactive") recorder.current.stop();
      recorder.current = null;
    }
    releaseMirror();
    mirrorLocked.current = false;
    stopCamera(stream.current);
    stream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    starting.current = false;
    startedAt.current = null;
  }, [clearTimers, releaseMirror]);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; release(); };
  }, [release]);
  useEffect(() => {
    const onPageHide = () => release();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [release]);

  const openCamera = useCallback(async () => {
    if (!policy || starting.current) return;
    release();
    starting.current = true;
    const version = generation.current;
    setRecording(null); setError(null); setErrorSizeBytes(null); setPhase("opening"); setElapsed(0);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined" ||
        typeof MediaRecorder.isTypeSupported !== "function") {
      starting.current = false; setError("unsupported"); setPhase("idle"); return;
    }
    if (!chooseRecordingMime(policy, mime => MediaRecorder.isTypeSupported(mime))) {
      starting.current = false; setError("format"); setPhase("idle"); return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { min: policy.min_short_side_px, max: policy.max_long_side_px },
          height: { min: policy.min_short_side_px, max: policy.max_long_side_px },
        },
      });
      if (!active.current || generation.current !== version) { stopCamera(media); return; }
      stream.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => undefined);
      }
      starting.current = false; setPhase("ready");
    } catch (cause) {
      if (!active.current || generation.current !== version) return;
      starting.current = false;
      const name = cause instanceof DOMException ? cause.name : "";
      setError(name === "NotAllowedError" ? "denied" : name === "NotFoundError" ? "missing" :
        name === "OverconstrainedError" ? "constraints" : "camera");
      setPhase("idle");
    }
  }, [policy, release]);

  const start = useCallback(() => {
    if (!policy || !stream.current || phase !== "ready" || mirrorLocked.current) return;
    mirrorLocked.current = true;
    const version = generation.current;
    setError(null); setCountdown(3); setPhase("countdown");
    let remaining = 3;
    const begin = () => {
      if (!active.current || generation.current !== version || !stream.current) return;
      const mime = chooseRecordingMime(policy, value => MediaRecorder.isTypeSupported(value));
      if (!mime) { setError("format"); release(); setPhase("idle"); return; }
      try {
        if (mirrored) {
          if (!videoRef.current) throw new Error("recording");
          mirroredRecording.current = createMirroredRecording(videoRef.current, stream.current, () => {
            if (!active.current || generation.current !== version) return;
            release(); setError("recording"); setPhase("idle");
          });
        }
        const media = mirroredRecording.current?.stream ?? stream.current;
        const instance = new MediaRecorder(media, { mimeType: mime });
        recorder.current = instance;
        const chunks: Blob[] = [];
        let bytes = 0;
        let oversized = false;
        const started = performance.now();
        startedAt.current = started;
        instance.ondataavailable = event => {
          if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
          if (bytes > policy.max_size_bytes) {
            oversized = true;
            if (instance.state !== "inactive") instance.stop();
          }
        };
        instance.onerror = () => {
          if (active.current) { release(); setPhase("idle"); setError("recording"); }
        };
        instance.onstop = () => {
          clearTimers();
          const settings = media.getVideoTracks()[0]?.getSettings();
          const width = mirroredRecording.current?.width || videoRef.current?.videoWidth || settings?.width || 0;
          const height = mirroredRecording.current?.height || videoRef.current?.videoHeight || settings?.height || 0;
          const durationMs = Math.round(performance.now() - started);
          startedAt.current = null;
          releaseMirror(); mirrorLocked.current = false;
          stopCamera(stream.current); stream.current = null; recorder.current = null;
          if (videoRef.current) videoRef.current.srcObject = null;
          if (!active.current || generation.current !== version) return;
          const blob = new Blob(chunks, { type: instance.mimeType || mime });
          const invalid = oversized ? "tooLarge" : validateRecording(blob, durationMs, width, height, policy);
          if (invalid) {
            setError(invalid); setErrorSizeBytes(invalid === "tooLarge" || invalid === "emptyVideo" ? blob.size : null);
            setPhase("idle"); return;
          }
          const url = URL.createObjectURL(blob);
          previewUrl.current = url;
          setRecording({ blob, durationMs, width, height, url, mirrored });
          setPhase("preview");
        };
        instance.start(250);
        setPhase("recording"); setElapsed(0);
        timers.current.push(setInterval(() => setElapsed(performance.now() - started), 100));
        // Reserve up to one chunk interval for browser scheduling. This stays
        // inside the configured range; only the backend validates actual media.
        const reserveMs = Math.min(100, (policy.max_duration_ms - policy.min_duration_ms) / 2);
        timers.current.push(setTimeout(() => {
          if (instance.state !== "inactive") instance.stop();
        }, policy.max_duration_ms - reserveMs));
      } catch (cause) {
        release(); setError(cause instanceof Error && cause.message === "mirrorUnsupported" ? "mirrorUnsupported" : "recording");
        setPhase("idle");
      }
    };
    const timer = setInterval(() => {
      remaining -= 1; setCountdown(remaining);
      if (!remaining) { clearInterval(timer); begin(); }
    }, 1000);
    timers.current.push(timer);
  }, [clearTimers, mirrored, phase, policy, release, releaseMirror]);

  const setMirrored = useCallback((value: boolean) => {
    if (!mirrorLocked.current && (phase === "idle" || phase === "ready")) setMirrorState(value);
  }, [phase]);

  const stop = useCallback(() => {
    if (policy && startedAt.current !== null && performance.now() - startedAt.current >= policy.min_duration_ms &&
        recorder.current?.state === "recording") recorder.current.stop();
  }, [policy]);
  const close = useCallback(() => {
    release(); setRecording(null); setPhase("idle"); setElapsed(0);
  }, [release]);
  const canStop = phase === "recording" && policy !== null && elapsed >= policy.min_duration_ms;
  return { videoRef, phase, countdown, elapsed, canStop, recording, error, errorSizeBytes, mirrored, setMirrored, openCamera, start, stop, close };
}
