import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { developmentLoginEnabled, getDatasetConfig } from "./config";
import { getSupabaseConfig } from "@/utils/supabase/config";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "false");
  vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", "https://dataset.example.com/");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
});
afterEach(() => vi.unstubAllEnvs());

describe("hosted dataset configuration", () => {
  it("accepts HTTPS hosted services and disables development login", () => {
    expect(getDatasetConfig()).toEqual({
      apiUrl: "https://dataset.example.com",
      authUrl: "https://project.supabase.co",
    });
    expect(developmentLoginEnabled()).toBe(false);
  });
  it.each([
    "", "http://dataset.example.com", "http://127.0.0.1:8001",
    "https://localhost", "https://127.0.0.1", "https://[::1]",
    "https://api.local", "https://api.internal", "https://app.localhost",
    "https://dataset.example.com:8001", "https://user:secret@dataset.example.com",
    "https://dataset.example.com/api", "https://dataset.example.com?token=secret",
    "https://dataset.example.com#fragment",
  ])("rejects unsafe or non-origin backend URL %s", value => {
    vi.stubEnv("NEXT_PUBLIC_DATASET_API_URL", value);
    expect(() => getDatasetConfig()).toThrow();
  });
  it("rejects local Supabase and an accidental production local-mode flag", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:55431");
    expect(() => getDatasetConfig()).toThrow();
    vi.stubEnv("NEXT_PUBLIC_DATASET_LOCAL", "true");
    expect(() => getDatasetConfig()).toThrow();
    expect(developmentLoginEnabled()).toBe(false);
  });
  it("rejects privileged browser keys in production", () => {
    for (const key of ["sb_secret_synthetic", "e30." + btoa(JSON.stringify({ role: "service_role" })) + ".synthetic"]) {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key);
      expect(() => getSupabaseConfig()).toThrow();
    }
  });
});
