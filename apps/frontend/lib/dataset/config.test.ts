import { afterEach, describe, expect, it, vi } from "vitest";
import { developmentLoginEnabled, getDatasetConfig, getDatasetConsent } from "./config";
import { getSupabaseConfig } from "@/utils/supabase/config";
afterEach(() => vi.unstubAllEnvs());
function local() {
  vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
  vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", "http://127.0.0.1:8001");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
}
describe("local dataset configuration", () => {
  it("requires explicit loopback URLs without remote fallback", () => {
    local();
    expect(getDatasetConfig().apiUrl).toBe("http://127.0.0.1:8001");
    for (const value of ["https://remote.invalid", "http://127.0.0.1:8001@remote.invalid", "http://localhost:8001", ""]) {
      vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", value);
      expect(() => getDatasetConfig()).toThrow();
    }
  });
  it("enables password login only in opted-in local development", () => {
    local(); vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
    expect(developmentLoginEnabled()).toBe(true);
    vi.stubEnv("NODE_ENV", "production"); expect(developmentLoginEnabled()).toBe(false);
    vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://remote.invalid");
    expect(developmentLoginEnabled()).toBe(false);
  });
  it("does not invent consent text or a version", () => {
    vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_VERSION", ""); vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_TEXT", "");
    expect(getDatasetConsent()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_VERSION", "synthetic"); expect(getDatasetConsent()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_DATASET_CONSENT_TEXT", "Synthetic test consent.");
    expect(getDatasetConsent()?.version).toBe("synthetic");
  });
  it("rejects privileged browser keys and remote local-mode Auth origins", () => {
    local(); vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
    for (const key of ["sb_secret_synthetic", "e30." + btoa(JSON.stringify({ role: "service_role" })) + ".synthetic"]) {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key); expect(() => getSupabaseConfig()).toThrow();
    }
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "synthetic-public");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://remote.invalid"); expect(() => getSupabaseConfig()).toThrow();
  });
});
