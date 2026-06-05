import { describe, expect, it } from "vitest";
import {
  mapRemotePreferences,
  samePreferences,
} from "@/components/providers/PreferencesProvider";

describe("preference synchronization", () => {
  it("TC-018 maps the database preference shape", () => {
    const preferences = mapRemotePreferences({
      theme: "dark",
      high_contrast: true,
      text_scale: 1.2,
      tts_speed: 1.1,
      tts_volume: 0.7,
    });

    expect(preferences).toEqual({
      theme: "dark",
      highContrast: true,
      textScale: 1.2,
      ttsSpeed: 1.1,
      ttsVolume: 0.7,
    });
    expect(samePreferences(preferences, { ...preferences })).toBe(true);
  });
});
