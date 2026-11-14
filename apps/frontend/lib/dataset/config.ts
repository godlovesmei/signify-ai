function configuredOrigin(value: string | undefined, local: boolean): string {
  if (!value || value !== value.trim()) throw new Error("Dataset configuration is unavailable.");
  const url = new URL(value);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Dataset URLs must be origins without credentials, paths, or queries.");
  }
  const loopback = url.protocol === "http:" && url.hostname === "127.0.0.1" && Boolean(url.port);
  const publicHost = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(url.hostname) &&
    !/^[\d.]+$/.test(url.hostname) && !/\.(?:localhost|local|internal)$/i.test(url.hostname);
  if (local ? !loopback : url.protocol !== "https:" || !publicHost || Boolean(url.port)) {
    throw new Error(local ? "Local dataset configuration is unavailable." : "Dataset production URLs must use public HTTPS origins.");
  }
  return url.origin;
}

export function getDatasetConfig() {
  const local = process.env.NEXT_PUBLIC_DATASET_LOCAL === "true";
  if (local && process.env.NODE_ENV === "production") {
    throw new Error("Local dataset mode cannot be used in production.");
  }
  return {
    apiUrl: configuredOrigin(process.env.NEXT_PUBLIC_DATASET_API_URL, local),
    authUrl: configuredOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL, local),
  };
}

export function developmentLoginEnabled() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_DATASET_LOCAL !== "true") return false;
  try { getDatasetConfig(); return true; } catch { return false; }
}

export function getDatasetConsent() {
  const version = process.env.NEXT_PUBLIC_DATASET_CONSENT_VERSION?.trim() ?? "";
  const text = process.env.NEXT_PUBLIC_DATASET_CONSENT_TEXT?.trim() ?? "";
  return version && version.length <= 100 && text ? { version, text } : null;
}
