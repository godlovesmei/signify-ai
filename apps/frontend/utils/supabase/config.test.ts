import { afterEach, describe, expect, it } from "vitest";
import { getSupabaseConfig } from "@/utils/supabase/config";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

describe("getSupabaseConfig", () => {
  it("TC-023 rejects startup when required public Supabase variables are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => getSupabaseConfig()).toThrow("Supabase is not configured");
  });

  it("TC-023 returns the configured public Supabase endpoint and key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";

    expect(getSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
  });
});
