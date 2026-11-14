import { createClient } from "@/utils/supabase/client";
import { getDatasetConfig } from "./config";
import { CONTRIBUTIONS_PAGE_SIZE } from "./types";
import type { CollectionFilters, CuratorAccount, DatasetAccess, Contribution, ContributionCollectionPage, ContributionSummary, DatasetLabel, ReviewInfo, ReviewInput, ReviewResult, UploadMetadata, UploadResult, VideoAccess, VideoPolicy } from "./types";

export interface DatasetErrorDetails { size_bytes?: number; max_size_bytes?: number }

export class DatasetApiError extends Error {
  constructor(public status: number, public code: string, public details?: DatasetErrorDetails) { super(code); this.name = "DatasetApiError"; }
}
async function accessToken() {
  const auth = createClient().auth;
  const { data, error } = await auth.getSession();
  let session = data.session;
  if (error || !session) throw new DatasetApiError(401, "authentication_required");
  if (!session.expires_at || session.expires_at <= Date.now() / 1000 + 15) {
    const refreshed = await auth.refreshSession();
    session = refreshed.data.session;
    if (refreshed.error || !session || !session.expires_at || session.expires_at <= Date.now() / 1000) {
      throw new DatasetApiError(401, "invalid_token");
    }
  }
  return session.access_token;
}
function apiUrl(path: string) {
  try { return getDatasetConfig().apiUrl + path; }
  catch { throw new DatasetApiError(503, "dataset_configuration_unavailable"); }
}
function errorCode(body: unknown): string {
  if (typeof body === "object" && body && "error" in body) {
    const error = body.error;
    if (typeof error === "object" && error && "code" in error && typeof error.code === "string" &&
        /^[a-z_]{1,80}$/.test(error.code)) return error.code;
  }
  return "request_failed";
}
function errorDetails(body: unknown): DatasetErrorDetails | undefined {
  if (!body || typeof body !== "object" || !("error" in body) || !body.error || typeof body.error !== "object" ||
      !("details" in body.error) || !body.error.details || typeof body.error.details !== "object") return undefined;
  const details: DatasetErrorDetails = {};
  for (const key of ["size_bytes", "max_size_bytes"] as const) {
    const value = key in body.error.details ? (body.error.details as Record<string, unknown>)[key] : undefined;
    if (typeof value === "number" && Number.isSafeInteger(value) && value >= (key === "size_bytes" ? 0 : 1)) details[key] = value;
  }
  return details;
}
async function request<T>(path: string, signal?: AbortSignal, method = "GET", payload?: unknown): Promise<T> {
  const url = apiUrl(path);
  const token = await accessToken();
  const response = await fetch(url, {
    method, headers: { Authorization: "Bearer " + token, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal, cache: "no-store", redirect: "error", credentials: "omit", referrerPolicy: "no-referrer",
  }).catch(error => {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new DatasetApiError(0, "network_error");
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new DatasetApiError(response.status, errorCode(body), errorDetails(body));
  return body as T;
}
export const datasetApi = {
  playback: async (id: string, signal?: AbortSignal): Promise<Blob> => {
    const token = await accessToken();
    const response = await fetch(apiUrl('/api/v1/contributions/' + encodeURIComponent(id) + '/video'), {
      headers: { Authorization: 'Bearer ' + token }, signal, cache: 'no-store',
      redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer',
    }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new DatasetApiError(0, 'network_error');
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new DatasetApiError(response.status, errorCode(body));
    }
    const blob = await response.blob();
    if (!blob.size || !['video/webm', 'video/mp4'].includes(blob.type.split(';')[0])) {
      throw new DatasetApiError(422, 'video_preview_failed');
    }
    return blob;
  },
  access: (signal?: AbortSignal) => request<DatasetAccess>("/api/v1/dataset/access", signal),
  curators: (signal?: AbortSignal) => request<{ items: CuratorAccount[] }>("/api/v1/dataset/curators", signal),
  grantCurator: (email: string, qualification_note: string, signal?: AbortSignal) => request<{ user_id: string; active: boolean }>(
    "/api/v1/dataset/curators", signal, "POST", { email, qualification_note }),
  revokeCurator: (id: string, expected_granted_at: string, signal?: AbortSignal) => request<{ user_id: string; active: boolean }>(
    "/api/v1/dataset/curators/" + encodeURIComponent(id) + "/revoke", signal, "POST", { expected_granted_at }),
  reviewSummary: (signal?: AbortSignal) => request<ContributionSummary>("/api/v1/dataset/review-summary", signal),
  reviewInfo: (signal?: AbortSignal) => request<ReviewInfo>("/api/v1/dataset/review-info", signal),
  reviewQueue: (offset = 0, signal?: AbortSignal, q = "", status: Contribution['status'] | 'ALL' = 'PENDING') => {
    const params = new URLSearchParams({ limit: String(CONTRIBUTIONS_PAGE_SIZE), offset: String(offset) });
    if (q.trim()) params.set("q", q.trim());
    params.set('status', status);
    return request<ContributionCollectionPage>("/api/v1/dataset/review-queue?" + params, signal);
  },
  review: (id: string, input: ReviewInput, signal?: AbortSignal) => request<ReviewResult>(
    "/api/v1/dataset/reviews/" + encodeURIComponent(id), signal, "POST", input),
  policy: (signal?: AbortSignal) => request<VideoPolicy>("/api/v1/dataset/video-policy", signal),
  labels: (signal?: AbortSignal) => request<{items: DatasetLabel[]}>("/api/v1/dataset/labels", signal),
  list: (offset = 0, signal?: AbortSignal, filters: CollectionFilters = {}) => {
    const params = new URLSearchParams({ limit: String(CONTRIBUTIONS_PAGE_SIZE), offset: String(offset) });
    if (filters.status) params.set("status", filters.status);
    if (filters.q?.trim()) params.set("q", filters.q.trim());
    return request<ContributionCollectionPage>("/api/v1/contributions?" + params, signal);
  },
  summary: (signal?: AbortSignal) => request<ContributionSummary>("/api/v1/contributions/summary", signal),
  detail: (id: string, signal?: AbortSignal) => request<Contribution>("/api/v1/contributions/" + encodeURIComponent(id), signal),
  video: (id: string, signal?: AbortSignal) => request<VideoAccess>("/api/v1/contributions/" + encodeURIComponent(id) + "/video-access", signal, "POST"),
};
export async function uploadContribution(
  video: Blob, metadata: UploadMetadata, key: string, onProgress: (value: number) => void, signal?: AbortSignal,
): Promise<UploadResult> {
  const url = apiUrl("/api/v1/contributions");
  const token = await accessToken();
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const finish = () => signal?.removeEventListener("abort", abort);
    const abort = () => xhr.abort();
    xhr.open("POST", url);
    xhr.withCredentials = false;
    xhr.timeout = 120000;
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("Idempotency-Key", key);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.min(100, Math.round(event.loaded / event.total * 100)));
    };
    xhr.onload = () => {
      finish();
      let body: unknown;
      try { body = JSON.parse(xhr.responseText); } catch { body = null; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadResult);
      else reject(new DatasetApiError(xhr.status, errorCode(body), errorDetails(body)));
    };
    xhr.onerror = () => { finish(); reject(new DatasetApiError(0, "network_error")); };
    xhr.ontimeout = () => { finish(); reject(new DatasetApiError(503, "upload_commit_unknown")); };
    xhr.onabort = () => { finish(); reject(new DOMException("Aborted", "AbortError")); };
    signal?.addEventListener("abort", abort, { once: true });
    const form = new FormData();
    form.append("file", video, "contribution");
    form.append("metadata", JSON.stringify(metadata));
    // Keep the browser's multipart boundary; do not set Content-Type manually.
    xhr.send(form);
  });
}
export function datasetErrorKey(error: unknown) {
  if (!(error instanceof DatasetApiError)) return "network";
  if (error.status === 401) return "unauthorized";
  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "notFound";
  if (error.status === 409) return "conflict";
  if (error.status === 413) return "tooLarge";
  if (error.status === 422) {
    if (error.code === "empty_video") return "emptyVideo";
    if (error.code === "invalid_review") return "invalidInput";
    if (error.code === "invalid_curator_assignment") return "curatorAssignment";
    if (error.code === "duration_not_allowed") return "duration";
    if (error.code === "resolution_not_allowed") return "resolution";
    if (error.code === "container_not_allowed") return "format";
    if (["invalid_video", "video_metadata_incomplete"].includes(error.code)) return "invalidVideo";
    return "invalid";
  }
  if (error.status === 429) return "capacity";
  if (error.status === 503) return "unavailable";
  return "network";
}
