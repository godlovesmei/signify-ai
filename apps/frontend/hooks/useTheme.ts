"use client";

import {
  usePreferencesContext,
  type ThemeMode,
} from "@/components/providers/PreferencesProvider";

export type { ThemeMode };

export interface ThemePrefs {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
}

export function useTheme(): ThemePrefs {
  const { theme, resolvedTheme, setTheme } = usePreferencesContext();
  return { theme, resolvedTheme, setTheme };
}
