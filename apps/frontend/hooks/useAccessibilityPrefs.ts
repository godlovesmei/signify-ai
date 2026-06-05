"use client";

import { usePreferencesContext } from "@/components/providers/PreferencesProvider";

export interface AccessibilityPrefs {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  textScale: number;
  setTextScale: (value: number) => void;
  ttsSpeed: number;
  setTtsSpeed: (value: number) => void;
  ttsVolume: number;
  setTtsVolume: (value: number) => void;
}

export const TEXT_SCALE_OPTIONS: Record<string, number> = {
  S: 0.85,
  M: 1,
  L: 1.2,
  XL: 1.5,
};

export function useAccessibilityPrefs(): AccessibilityPrefs {
  const {
    highContrast,
    setHighContrast,
    textScale,
    setTextScale,
    ttsSpeed,
    setTtsSpeed,
    ttsVolume,
    setTtsVolume,
  } = usePreferencesContext();

  return {
    highContrast,
    setHighContrast,
    textScale,
    setTextScale,
    ttsSpeed,
    setTtsSpeed,
    ttsVolume,
    setTtsVolume,
  };
}
