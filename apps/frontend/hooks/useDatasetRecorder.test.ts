import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDatasetRecorder } from "./useDatasetRecorder";
import { POLICY as BASE_POLICY } from "@/tests/datasetFixtures";
const POLICY = { ...BASE_POLICY, min_duration_ms: 3000, max_duration_ms: 7000 };
const stopTrack = vi.fn();
const media = { getTracks: () => [{ stop: stopTrack }],
  getVideoTracks: () => [{ getSettings: () => ({ width: 64, height: 48, frameRate: 20 }) }] } as unknown as MediaStream;
const getUserMedia = vi.fn();
class FakeRecorder {
  static latest: FakeRecorder;
  static isTypeSupported = vi.fn(() => true);
  state = "inactive"; mimeType = "video/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor(readonly stream: MediaStream) { FakeRecorder.latest = this; }
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["test-video"]) }); this.onstop?.(); }
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  getUserMedia.mockReset().mockResolvedValue(media); stopTrack.mockReset();
  FakeRecorder.isTypeSupported.mockReturnValue(true);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:synthetic");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("dataset recorder lifecycle", () => {
  it.each([["NotAllowedError", "denied"], ["NotFoundError", "missing"]])("handles %s", async (name, expected) => {
    getUserMedia.mockRejectedValue(new DOMException("synthetic", name));
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    expect(result.current.error).toBe(expected);
    expect(result.current.phase).toBe("idle");
  });
  it("blocks unsupported MIME without requesting camera access", async () => {
    FakeRecorder.isTypeSupported.mockReturnValue(false);
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    expect(result.current.error).toBe("format");
    expect(getUserMedia).not.toHaveBeenCalled();
  });
  it("uses policy-derived resolution and disables audio", async () => {
    const { result, unmount } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false, video: expect.objectContaining({
      width: { min: POLICY.min_short_side_px, max: POLICY.max_long_side_px },
    }) }));
    unmount(); expect(stopTrack).toHaveBeenCalled();
  });
  it("counts down, creates a preview, releases tracks, and revokes it on retake", async () => {
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    act(() => result.current.start());
    expect(result.current.countdown).toBe(3);
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.phase).toBe("recording");
    expect(FakeRecorder.latest.stream).toBe(media);
    act(() => vi.advanceTimersByTime(3500));
    act(() => result.current.stop());
    expect(result.current.phase).toBe("preview");
    expect(result.current.recording?.blob.size).toBeGreaterThan(0);
    expect(stopTrack).toHaveBeenCalled();
    await act(async () => result.current.openCamera());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:synthetic");
    expect(result.current.recording).toBeNull();
  });
  it("stops a late permission grant after unmount", async () => {
    let resolve!: (value: MediaStream) => void;
    getUserMedia.mockReturnValue(new Promise<MediaStream>(done => { resolve = done; }));
    const { result, unmount } = renderHook(() => useDatasetRecorder(POLICY));
    let pending!: Promise<void>;
    act(() => { pending = result.current.openCamera(); });
    unmount();
    await act(async () => { resolve(media); await pending; });
    expect(stopTrack).toHaveBeenCalled();
  });
  it("cancels countdown and camera tracks on pagehide", async () => {
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    act(() => result.current.start());
    act(() => window.dispatchEvent(new Event("pagehide")));
    act(() => vi.advanceTimersByTime(5000));
    expect(stopTrack).toHaveBeenCalled();
    expect(result.current.recording).toBeNull();
  });
  it("does not request a camera without policy", async () => {
    const { result } = renderHook(() => useDatasetRecorder(null));
    await act(async () => result.current.openCamera());
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

describe("mirrored video recording", () => {
  const stopCanvasTrack = vi.fn();
  const mirroredMedia = { getTracks: () => [{ stop: stopCanvasTrack }],
    getVideoTracks: () => [{ getSettings: () => ({ width: 64, height: 48 }) }] } as unknown as MediaStream;
  const captureStream = vi.fn(() => mirroredMedia);
  const context = { setTransform: vi.fn(), drawImage: vi.fn() };
  const originalCapture = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "captureStream");

  beforeEach(() => {
    stopCanvasTrack.mockReset(); captureStream.mockClear();
    context.setTransform.mockReset(); context.drawImage.mockReset();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", { configurable: true, value: captureStream });
  });
  afterEach(() => {
    if (originalCapture) Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", originalCapture);
    else Reflect.deleteProperty(HTMLCanvasElement.prototype, "captureStream");
  });
  async function ready() {
    const hook = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => hook.result.current.openCamera());
    const video = document.createElement("video");
    Object.defineProperties(video, {
      videoWidth: { value: 64 }, videoHeight: { value: 48 }, readyState: { value: 4 },
    });
    hook.result.current.videoRef.current = video;
    act(() => hook.result.current.setMirrored(true));
    return { ...hook, video };
  }
  it("records the flipped canvas stream at camera resolution and releases both streams", async () => {
    const { result, video } = await ready();
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.phase).toBe("recording");
    expect(context.setTransform).toHaveBeenCalledWith(-1, 0, 0, 1, 64, 0);
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 0, 64, 48);
    expect(captureStream).toHaveBeenCalledWith(20);
    expect(FakeRecorder.latest.stream).toBe(mirroredMedia);
    act(() => vi.advanceTimersByTime(3500));
    act(() => result.current.stop());
    expect(result.current.recording).toMatchObject({ mirrored: true, width: 64, height: 48 });
    expect(stopCanvasTrack).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    const draws = context.drawImage.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(context.drawImage).toHaveBeenCalledTimes(draws);
  });
  it("locks the choice through countdown, recording, and review, and allows changing on retake", async () => {
    const { result } = await ready();
    act(() => { result.current.start(); result.current.setMirrored(false); });
    expect(result.current.mirrored).toBe(true);
    act(() => vi.advanceTimersByTime(3000));
    act(() => result.current.setMirrored(false));
    expect(result.current.mirrored).toBe(true);
    act(() => vi.advanceTimersByTime(3500));
    act(() => result.current.stop());
    act(() => result.current.setMirrored(false));
    expect(result.current.mirrored).toBe(true);
    await act(async () => result.current.openCamera());
    act(() => result.current.setMirrored(false));
    expect(result.current.mirrored).toBe(false);
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(6500));
    expect(FakeRecorder.latest.stream).toBe(media);
    act(() => result.current.stop());
    expect(result.current.recording?.mirrored).toBe(false);
  });
  it.each(["unmount", "pagehide", "error", "auto-stop"])("releases mirrored capture on %s", async ending => {
    const { result, unmount } = await ready();
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    if (ending === "unmount") unmount();
    else if (ending === "pagehide") act(() => window.dispatchEvent(new Event("pagehide")));
    else if (ending === "error") act(() => FakeRecorder.latest.onerror?.());
    else act(() => vi.advanceTimersByTime(POLICY.max_duration_ms));
    expect(stopCanvasTrack).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    const draws = context.drawImage.mock.calls.length;
    act(() => vi.advanceTimersByTime(1000));
    expect(context.drawImage).toHaveBeenCalledTimes(draws);
  });
  it("reports unsupported mirror recording instead of silently recording an unflipped video", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", { configurable: true, value: undefined });
    const { result } = await ready();
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.error).toBe("mirrorUnsupported");
    expect(result.current.phase).toBe("idle");
    expect(result.current.recording).toBeNull();
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
  it("cleans up a mirrored stream when MediaRecorder cannot be created", async () => {
    const { result } = await ready();
    vi.stubGlobal("MediaRecorder", class extends FakeRecorder {
      constructor(stream: MediaStream) { super(stream); throw new Error("synthetic failure"); }
    });
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.error).toBe("recording");
    expect(stopCanvasTrack).toHaveBeenCalledTimes(1);
    expect(stopTrack).toHaveBeenCalledTimes(1);
  });
});

describe("recorder capability and policy limits", () => {
  it("refuses early stop even when called directly, and allows stopping at 3 seconds", async () => {
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.canStop).toBe(false);
    act(() => vi.advanceTimersByTime(2999));
    act(() => result.current.stop());
    expect(result.current.phase).toBe('recording');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.canStop).toBe(true);
    act(() => result.current.stop());
    expect(result.current.phase).toBe('preview');
    expect(result.current.recording?.durationMs).toBe(3000);
  });
  it("handles browsers without MediaRecorder", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    expect(result.current.error).toBe("unsupported");
    expect(getUserMedia).not.toHaveBeenCalled();
  });
  it("automatically stops within the policy range and releases the camera", async () => {
    const { result } = renderHook(() => useDatasetRecorder(POLICY));
    await act(async () => result.current.openCamera());
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000 + POLICY.max_duration_ms));
    expect(result.current.phase).toBe("preview");
    expect(result.current.recording!.durationMs).toBeLessThanOrEqual(POLICY.max_duration_ms);
    expect(stopTrack).toHaveBeenCalled();
  });
});
