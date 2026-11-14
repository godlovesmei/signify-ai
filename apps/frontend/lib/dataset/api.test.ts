import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatasetApiError, datasetApi, datasetErrorKey, uploadContribution } from "./api";
import { CONTRIBUTION, LABEL } from "@/tests/datasetFixtures";
const { getSession, refreshSession } = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock("@/utils/supabase/client", () => ({ createClient: () => ({ auth: { getSession, refreshSession } }) }));
const session = { access_token: "synthetic-local-token", expires_at: 9999999999 };
class FakeXHR {
  static sent: FakeXHR[] = [];
  headers: Record<string, string> = {};
  upload = { onprogress: null as null | ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) };
  onload = () => {}; onerror = () => {}; ontimeout = () => {}; onabort = () => {};
  status = 201; responseText = JSON.stringify({ contribution: CONTRIBUTION, replayed: false });
  body?: FormData; url = ""; timeout = 0; withCredentials = false;
  open(_method: string, url: string) { this.url = url; }
  setRequestHeader(key: string, value: string) { this.headers[key] = value; }
  send(body: FormData) { this.body = body; FakeXHR.sent.push(this); }
  abort() { this.onabort(); }
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
  vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", "http://127.0.0.1:8001");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
  getSession.mockResolvedValue({ data: { session }, error: null });
  refreshSession.mockReset(); FakeXHR.sent = [];
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("dataset transport", () => {
  it('loads playable bytes with the session token and without persistent caching', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('video', { headers: { 'Content-Type': 'video/webm' } }));
    vi.stubGlobal('fetch', fetcher);
    const blob = await datasetApi.playback(CONTRIBUTION.id);
    expect(blob.size).toBe(5);
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8001/api/v1/contributions/' + CONTRIBUTION.id + '/video',
      expect.objectContaining({ headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store', credentials: 'omit', redirect: 'error' }));
  });
  it('rejects non-video playback responses and preserves authorization failures', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('not a video', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'operation_forbidden' } }), { status: 403 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(datasetApi.playback(CONTRIBUTION.id)).rejects.toMatchObject({ code: 'video_preview_failed' });
    await expect(datasetApi.playback(CONTRIBUTION.id)).rejects.toMatchObject({ status: 403, code: 'operation_forbidden' });
  });
  it("requests ten contributions at the requested offset with server filters", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], next_offset: null, total: 0 })));
    vi.stubGlobal("fetch", fetcher);
    await datasetApi.list(10, undefined, { q: "word", status: "PENDING" });
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8001/api/v1/contributions?limit=10&offset=10&status=PENDING&q=word", expect.any(Object));
  });
  it("sends the real session token to a fixed local API without caching", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [LABEL] })));
    vi.stubGlobal("fetch", fetcher);
    expect((await datasetApi.labels()).items).toEqual([LABEL]);
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8001/api/v1/dataset/labels", expect.objectContaining({
      headers: { Authorization: "Bearer " + session.access_token }, cache: "no-store", redirect: "error", credentials: "omit",
    }));
  });
  it("refreshes expired tokens before accessing data", async () => {
    getSession.mockResolvedValue({ data: { session: { ...session, expires_at: 1 } } });
    refreshSession.mockResolvedValue({ data: { session }, error: null });
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] })));
    vi.stubGlobal("fetch", fetcher);
    await datasetApi.labels();
    expect(refreshSession).toHaveBeenCalledOnce();
  });
  it("rejects missing or unrefreshable sessions without data requests", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(datasetApi.list()).rejects.toMatchObject({ status: 401 });
    getSession.mockResolvedValue({ data: { session: { ...session, expires_at: 1 } } });
    refreshSession.mockResolvedValue({ data: { session: null }, error: {} });
    await expect(datasetApi.list()).rejects.toMatchObject({ status: 401 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404, 503])("retains HTTP %i without echoing upstream bodies", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { code: "synthetic_failure", message: "must-not-be-echoed" },
    }), { status })));
    await expect(datasetApi.detail(CONTRIBUTION.id)).rejects.toMatchObject({ status, message: "synthetic_failure" });
    expect(datasetErrorKey(new DatasetApiError(status, "synthetic"))).not.toBe("network");
  });
  it("uploads multipart with one caller key and reports real transfer progress", async () => {
    const progress = vi.fn();
    const pending = uploadContribution(new Blob(["video"]), { proposed_label_id: LABEL.id, consent: true,
      consent_version: "synthetic-consent" }, "synthetic-key-0001", progress);
    await vi.waitFor(() => expect(FakeXHR.sent).toHaveLength(1));
    const xhr = FakeXHR.sent[0];
    expect(xhr.headers["Idempotency-Key"]).toBe("synthetic-key-0001");
    expect(xhr.headers["Content-Type"]).toBeUndefined();
    expect(JSON.parse(xhr.body!.get("metadata") as string)).not.toHaveProperty("user_id");
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 });
    expect(progress).toHaveBeenCalledWith(50);
    xhr.onload();
    expect((await pending).contribution.id).toBe(CONTRIBUTION.id);
  });
  it("reports uncertain uploads and does not retry them automatically", async () => {
    const pending = uploadContribution(new Blob(["video"]), { proposed_label_id: LABEL.id, consent: true,
      consent_version: "synthetic-consent" }, "synthetic-key-0001", vi.fn());
    const rejected = expect(pending).rejects.toMatchObject({ code: "upload_commit_unknown" });
    await vi.waitFor(() => expect(FakeXHR.sent).toHaveLength(1));
    FakeXHR.sent[0].ontimeout(); await rejected;
    expect(FakeXHR.sent).toHaveLength(1);
  });
});


describe("upload validation feedback", () => {
  it.each([
    ["duration_not_allowed", "duration"],
    ["resolution_not_allowed", "resolution"],
    ["container_not_allowed", "format"],
    ["invalid_video", "invalidVideo"],
    ["video_metadata_incomplete", "invalidVideo"],
    ["empty_video", "emptyVideo"],
    ["invalid_review", "invalidInput"],
    ["invalid_metadata", "invalid"],
    ["unrecognized_upstream_code", "invalid"],
  ])("explains %s without exposing upstream text", (code, expected) => {
    expect(datasetErrorKey(new DatasetApiError(422, code))).toBe(expected);
  });
});

describe("size details and curator transport", () => {
  it("keeps only bounded numeric file-size details and ignores upstream text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
      code: "video_too_large", message: "private upstream message", details: {
        size_bytes: 17 * 1048576, max_size_bytes: 16 * 1048576, secret: "do not expose",
      },
    } }), { status: 413 })));
    await expect(datasetApi.detail(CONTRIBUTION.id)).rejects.toMatchObject({
      details: { size_bytes: 17 * 1048576, max_size_bytes: 16 * 1048576 }, message: "video_too_large",
    });
  });
  it("discards invalid size values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
      code: "video_too_large", details: { size_bytes: -1, max_size_bytes: "16 MB" },
    } }), { status: 413 })));
    await expect(datasetApi.detail(CONTRIBUTION.id)).rejects.toMatchObject({ details: {} });
  });
  it("sends a curator decision once with the caller token and expected revision", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ revision: 2 })));
    vi.stubGlobal("fetch", fetcher);
    const input = { expected_revision: 1, decision: "REJECTED" as const, reason: "Keep both hands visible." };
    await datasetApi.review(CONTRIBUTION.id, input);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("http://127.0.0.1:8001/api/v1/dataset/reviews/" + CONTRIBUTION.id,
      expect.objectContaining({ method: "POST", body: JSON.stringify(input),
        headers: { Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" } }));
  });
});
