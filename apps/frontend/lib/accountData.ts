import { executeSupabaseRequest } from "@/lib/supabaseRequest";
import { createClient } from "@/utils/supabase/client";

export interface AccountProfile {
  avatarUrl: string | null;
  createdAt: string | null;
  displayName: string;
  email: string;
  id: string;
  lastSignInAt: string | null;
  verified: boolean;
}

function metadataValue(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const supabase = createClient();
  const [authResult, profile] = await Promise.all([
    supabase.auth.getUser(),
    executeSupabaseRequest(() =>
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .maybeSingle(),
    ),
  ]);

  if (authResult.error) throw authResult.error;
  const user = authResult.data.user;
  if (!user) return null;

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? "";
  const displayName =
    profile?.display_name?.trim() ||
    metadataValue(metadata, "full_name", "name", "display_name", "username") ||
    email.split("@")[0] ||
    "User Account";
  const avatarUrl =
    profile?.avatar_url ??
    metadataValue(metadata, "avatar_url", "picture", "avatar");

  return {
    avatarUrl,
    createdAt: user.created_at ?? null,
    displayName,
    email,
    id: user.id,
    lastSignInAt: user.last_sign_in_at ?? null,
    verified: Boolean(user.email_confirmed_at),
  };
}
