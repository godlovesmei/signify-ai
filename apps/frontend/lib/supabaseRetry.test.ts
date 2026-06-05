import { describe, expect, it, vi } from "vitest";
import {
  SupabaseRequestError,
  isRetryableSupabaseError,
  withSupabaseRetry,
} from "@/lib/supabaseRetry";

describe("Supabase retry policy", () => {
  it("TC-011 retries transient failures at most twice", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new SupabaseRequestError("busy", 503))
      .mockRejectedValueOnce(new SupabaseRequestError("busy", 429))
      .mockResolvedValue("ok");
    const sleep = vi.fn(async () => undefined);

    await expect(withSupabaseRetry(operation, { sleep })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 250);
    expect(sleep).toHaveBeenNthCalledWith(2, 500);
  });

  it("TC-011 does not retry authentication or validation failures", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValue(new SupabaseRequestError("forbidden", 403));

    await expect(withSupabaseRetry(operation)).rejects.toThrow("forbidden");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(isRetryableSupabaseError(new SupabaseRequestError("bad", 400))).toBe(false);
  });
});
