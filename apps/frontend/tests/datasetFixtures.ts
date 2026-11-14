import type { Contribution, DatasetLabel, VideoPolicy } from "@/lib/dataset/types";
export const ID = "bff6b03c-a794-431e-b974-a869727b0820";
export const LABEL: DatasetLabel = { id: "3fd9c15f-eded-4730-a1e1-5e6b4d664504", code: "synthetic_test",
  display_name: "Synthetic test label", description: "Test fixture only, not a BISINDO catalog entry." };
export const POLICY: VideoPolicy = { id: "c8134698-bdf1-4b9d-8af7-6f1dc09cd53a", version: "synthetic-test",
  min_duration_ms: 100, max_duration_ms: 2000, min_short_side_px: 16, max_long_side_px: 1024,
  max_size_bytes: 100000, allowed_mime_types: ["video/webm"] };
export const CONTRIBUTION: Contribution = { id: ID, user_id: "a35d7fc9-c595-4d7f-b29c-60f0c25db7dd",
  proposed_label_id: LABEL.id, proposed_label_text: null, final_label_id: null, recognition_event_id: null,
  status: "PENDING", rejection_reason: null, revision: 1, size_bytes: 1200, duration_ms: 400,
  width: 64, height: 48, fps: 10, mime_type: "video/webm", container: "webm", codec: "vp8",
  source_sha256: "a".repeat(64), video_policy_id: POLICY.id, consent_version: "synthetic-consent",
  consented_at: "2026-11-03T01:00:00Z", created_at: "2026-11-03T01:00:00Z", updated_at: "2026-11-03T01:00:00Z" };
