import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUTH_DESTINATION,
  buildLoginPath,
  sanitizeRelativePath,
} from "@/lib/authRedirect";

describe("auth redirect safety", () => {
  it("TC-004 preserves a safe protected destination with query parameters", () => {
    expect(sanitizeRelativePath("/history?page=2")).toBe("/history?page=2");
    expect(buildLoginPath("/history?page=2")).toBe(
      "/?login=1&next=%2Fhistory%3Fpage%3D2",
    );
    expect(buildLoginPath("/en/history?page=2", "en")).toBe(
      "/en?login=1&next=%2Fen%2Fhistory%3Fpage%3D2",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "/history\u0000",
  ])("TC-024 rejects unsafe redirect value %s", (value) => {
    expect(sanitizeRelativePath(value)).toBe(DEFAULT_AUTH_DESTINATION);
  });
});
