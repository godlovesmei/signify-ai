import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import id from "@/messages/id.json";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value) || value === null || typeof value !== "object") {
    return [prefix];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translation messages", () => {
  it("keeps ID and EN message keys in sync", () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(id).sort());
  });
});
