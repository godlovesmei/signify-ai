'use client';

import { useCallback, useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePrefs {
  /** The stored user preference — 'light' | 'dark' | 'system' */
  theme: ThemeMode;
  /** The resolved value — always 'light' or 'dark', never 'system' */
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'signify:theme';
const DEFAULT_THEME: ThemeMode = 'system';

// ── Helpers ───────────────────────────────────────────────────────────────────

function readStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch { /* quota / security error — ignore */ }
  return DEFAULT_THEME;
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTheme(): ThemePrefs {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemPreference);
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  // Keep system theme in sync with OS preference changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply resolved theme to the document.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, []);

  return { theme, resolvedTheme, setTheme };
}