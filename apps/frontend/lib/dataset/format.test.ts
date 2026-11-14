import { describe, expect, it } from "vitest";
import id from "@/messages/id.json";
import en from "@/messages/en.json";
import { formatDuration, formatFileSize } from "./format";

describe("dataset locale formatting", () => {
  it("uses Indonesian decimals and duration units", () => {
    expect(formatDuration(1500, "id")).toMatch(/^1,5\s+dtk$/);
    expect(formatFileSize(1536, "id")).toBe("1,5 KiB");
  });
  it("uses English decimals and duration units", () => {
    expect(formatDuration(1500, "en")).toMatch(/^1\.5\s+sec$/);
    expect(formatFileSize(1536, "en")).toBe("1.5 KiB");
    expect(formatFileSize(17 * 1048576, "en")).toBe("17 MiB");
  });
  it("provides matching UI translation keys for contributions and curator access", () => {
    function keys(value: Record<string, unknown>, prefix = ""): string[] {
      return Object.entries(value).flatMap(([key, child]) => typeof child === "object" && child !== null
        ? keys(child as Record<string, unknown>, prefix + key + ".") : [prefix + key]);
    }
    expect(keys(id.workspace.contributions).sort()).toEqual(keys(en.workspace.contributions).sort());
  });
});
