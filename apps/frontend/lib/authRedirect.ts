export const DEFAULT_AUTH_DESTINATION = "/translate";

export function sanitizeRelativePath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_DESTINATION,
): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(trimmed)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "https://signify.local");
    if (parsed.origin !== "https://signify.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginPath(nextPath: string | null | undefined): string {
  const safeNext = sanitizeRelativePath(nextPath);
  return `/?login=1&next=${encodeURIComponent(safeNext)}`;
}
