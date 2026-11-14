export function formatFileSize(bytes: number, locale: string, maximumFractionDigits = 2) {
  const unit = bytes >= 1048576 ? "MiB" : bytes >= 1024 ? "KiB" : "B";
  const divisor = unit === "MiB" ? 1048576 : unit === "KiB" ? 1024 : 1;
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(bytes / divisor) + " " + unit;
}

export function formatDuration(durationMs: number, locale: string, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(locale, { style: "unit", unit: "second", unitDisplay: "short", maximumFractionDigits })
    .format(durationMs / 1000);
}
