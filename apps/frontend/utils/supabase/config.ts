export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  if (process.env.NEXT_PUBLIC_DATASET_LOCAL === "true") {
    let local = false;
    try {
      const parsed = new URL(url);
      local = parsed.origin === "http://127.0.0.1:55431" && parsed.pathname === "/" &&
        !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
    } catch { /* Invalid configuration fails closed below. */ }
    if (!local) throw new Error("Local Supabase configuration is required.");
  }
  let privileged = publishableKey.startsWith("sb_secret_");
  try {
    const payload = publishableKey.split(".")[1];
    if (payload) privileged ||= JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))).role === "service_role";
  } catch { /* Public opaque publishable keys need no JWT payload. */ }
  if (privileged) throw new Error("Privileged Supabase keys must never be used in the browser.");
  return { url, publishableKey };
}
