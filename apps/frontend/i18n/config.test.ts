import { describe, expect, it } from "vitest";
import {
  getLocaleFromPathname,
  localizePathname,
  stripLocalePrefix,
} from "./config";

describe("i18n config helpers", () => {
  it("strips locale prefixes while keeping canonical default paths clean", () => {
    expect(stripLocalePrefix("/en/history?page=2").pathname).toBe("/history");
    expect(stripLocalePrefix("/id/research").pathname).toBe("/research");
    expect(stripLocalePrefix("/translate").pathname).toBe("/translate");
  });

  it("localizes paths for default and English locales", () => {
    expect(localizePathname("/translate", "id")).toBe("/translate");
    expect(localizePathname("/translate", "en")).toBe("/en/translate");
    expect(localizePathname("/en/research", "id")).toBe("/research");
    expect(localizePathname("/", "en")).toBe("/en");
  });

  it("detects locale from prefixed paths and falls back to ID", () => {
    expect(getLocaleFromPathname("/en/history")).toBe("en");
    expect(getLocaleFromPathname("/id/history")).toBe("id");
    expect(getLocaleFromPathname("/history")).toBe("id");
  });
});
