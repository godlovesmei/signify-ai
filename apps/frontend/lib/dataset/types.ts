export interface DatasetLabel {
  id: string;
  code: string;
  display_name: string;
  description: string | null;
}
export interface VideoPolicy {
  id: string;
  version: string;
  min_duration_ms: number;
  max_duration_ms: number;
  min_short_side_px: number;
  max_long_side_px: number;
  max_size_bytes: number;
  allowed_mime_types: string[];
}
export interface Contribution {
  id: string;
  user_id: string;
  proposed_label_id: string | null;
  proposed_label_text: string | null;
  final_label_id: string | null;
  recognition_event_id: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason: string | null;
  revision: number;
  size_bytes: number;
  duration_ms: number;
  width: number;
  height: number;
  fps: number | null;
  mime_type: string;
  container: string | null;
  codec: string | null;
  source_sha256: string | null;
  video_policy_id: string;
  consent_version: string;
  consented_at: string;
  created_at: string;
  updated_at: string;
}
export const CONTRIBUTIONS_PAGE_SIZE = 10;
export interface ContributionCollectionPage extends ContributionPage { total: number }
export interface ContributionPage { items: Contribution[]; next_offset: number | null }
export type ContributionStatusValue = Contribution["status"];
export interface ContributionSummary { total: number; PENDING: number; APPROVED: number; REJECTED: number }
export interface CollectionFilters { status?: ContributionStatusValue; q?: string }
export type UploadMetadata = { consent: true; consent_version: string } & (
  { proposed_label_id: string; proposed_label_text?: never } |
  { proposed_label_id?: never; proposed_label_text: string }
);
export interface UploadResult { contribution: Contribution; replayed: boolean }
export interface VideoAccess { url: string; expires_in: number }
export interface ReviewInfo { available: boolean; target_business_days: number | null; can_review: boolean }
export interface ReviewInput {
  expected_revision: number; decision: "APPROVED" | "REJECTED"; final_label_id?: string; reason?: string;
}
export interface ReviewResult { contribution_id: string; review_id: string; status: "APPROVED" | "REJECTED"; revision: number }

export interface DatasetAccess { is_admin: boolean; is_curator: boolean; review_available: boolean }
export interface CuratorAccount {
  user_id: string; email: string; display_name: string | null; qualification_note: string;
  granted_at: string; revoked_at: string | null;
}
