'use client';

import { useEffect, useState } from 'react';

export interface AccessibilityPrefs {
  /** Increases contrast via .high-contrast class on <html>. Default: false */
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  /** Multiplier applied to prediction and sentence text sizes. Default: 1 */
  textScale: number;
  setTextScale: (v: number) => void;
  /** TTS playback rate 0.5–2.0. Default: 1.0 */
  ttsSpeed: number;
  setTtsSpeed: (v: number) => void;
  /** TTS volume 0–1 (stored as 0–100 in localStorage). Default: 0.8 */
  ttsVolume: number;
  setTtsVolume: (v: number) => void;
}

const TEXT_SCALE_OPTIONS: Record<string, number> = {
  S: 0.85,
  M: 1,
  L: 1.2,
  XL: 1.5,
};

export { TEXT_SCALE_OPTIONS };

const KEYS = {
  highContrast: 'signify:highContrast',
  textScale:    'signify:textScale',
  ttsSpeed:     'signify:ttsSpeed',
  ttsVolume:    'signify:ttsVolume',
} as const;

function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === 'true';
  } catch { return fallback; }
}

function readFloat(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    const n = v === null ? NaN : parseFloat(v);
    return isNaN(n) ? fallback : n;
  } catch { return fallback; }
}

function persist(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* quota exceeded — ignore */ }
}

export function useAccessibilityPrefs(): AccessibilityPrefs {
  const [highContrast, setHighContrastState] = useState<boolean>(() =>
    readBool(KEYS.highContrast, false),
  );
  const [textScale, setTextScaleState] = useState<number>(() =>
    readFloat(KEYS.textScale, 1),
  );
  const [ttsSpeed, setTtsSpeedState] = useState<number>(() =>
    readFloat(KEYS.ttsSpeed, 1.0),
  );
  const [ttsVolume, setTtsVolumeState] = useState<number>(() =>
    readFloat(KEYS.ttsVolume, 0.8),
  );

  // Apply high-contrast class to <html> whenever the pref changes
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  const setHighContrast = (v: boolean) => {
    setHighContrastState(v);
    persist(KEYS.highContrast, String(v));
  };

  const setTextScale = (v: number) => {
    setTextScaleState(v);
    persist(KEYS.textScale, String(v));
  };

  const setTtsSpeed = (v: number) => {
    setTtsSpeedState(v);
    persist(KEYS.ttsSpeed, String(v));
  };

  const setTtsVolume = (v: number) => {
    setTtsVolumeState(v);
    persist(KEYS.ttsVolume, String(v));
  };

  return {
    highContrast, setHighContrast,
    textScale,    setTextScale,
    ttsSpeed,     setTtsSpeed,
    ttsVolume,    setTtsVolume,
  };
}