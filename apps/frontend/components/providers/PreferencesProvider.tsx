"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { executeSupabaseRequest } from "@/lib/supabaseRequest";
import { clearLegacyLocalData } from "@/lib/userData";
import { createClient } from "@/utils/supabase/client";

export type ThemeMode = "light" | "dark" | "system";

export interface PreferencesState {
  theme: ThemeMode;
  highContrast: boolean;
  textScale: number;
  ttsSpeed: number;
  ttsVolume: number;
}

export interface PreferencesContextValue extends PreferencesState {
  resolvedTheme: "light" | "dark";
  isLoading: boolean;
  setTheme: (mode: ThemeMode) => void;
  setHighContrast: (value: boolean) => void;
  setTextScale: (value: number) => void;
  setTtsSpeed: (value: number) => void;
  setTtsVolume: (value: number) => void;
}

const THEME_STORAGE_KEY = "signify:theme";
const DEFAULT_PREFERENCES: PreferencesState = {
  theme: "system",
  highContrast: false,
  textScale: 1,
  ttsSpeed: 1,
  ttsVolume: 0.8,
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    return "system";
  }
  return "system";
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function normalizeTheme(value: string): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

export function mapRemotePreferences(row: {
  high_contrast: boolean;
  text_scale: number;
  theme: string;
  tts_speed: number;
  tts_volume: number;
}): PreferencesState {
  return {
    theme: normalizeTheme(row.theme),
    highContrast: row.high_contrast,
    textScale: row.text_scale,
    ttsSpeed: row.tts_speed,
    ttsVolume: row.tts_volume,
  };
}

export function samePreferences(left: PreferencesState, right: PreferencesState) {
  return (
    left.theme === right.theme &&
    left.highContrast === right.highContrast &&
    left.textScale === right.textScale &&
    left.ttsSpeed === right.ttsSpeed &&
    left.ttsVolume === right.ttsVolume
  );
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<PreferencesState>(() => ({
    ...DEFAULT_PREFERENCES,
    theme: readStoredTheme(),
  }));
  const [systemTheme, setSystemTheme] =
    useState<"light" | "dark">(getSystemPreference);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preferencesRef = useRef(preferences);
  const lastSyncedRef = useRef<PreferencesState | null>(null);
  const hydratedRef = useRef(false);
  const syncVersionRef = useRef(0);

  preferencesRef.current = preferences;
  const resolvedTheme =
    preferences.theme === "system" ? systemTheme : preferences.theme;

  const loadRemotePreferences = useCallback(async (nextUserId: string) => {
    const supabase = createClient();
    const row = await executeSupabaseRequest(() =>
      supabase
        .from("user_preferences")
        .select("theme, high_contrast, text_scale, tts_speed, tts_volume")
        .eq("user_id", nextUserId)
        .maybeSingle(),
    );

    if (!row) {
      const defaults = {
        ...DEFAULT_PREFERENCES,
        theme: preferencesRef.current.theme,
      };
      await executeSupabaseRequest(() =>
        supabase.rpc("upsert_user_preferences", {
          p_theme: defaults.theme,
          p_high_contrast: defaults.highContrast,
          p_text_scale: defaults.textScale,
          p_tts_speed: defaults.ttsSpeed,
          p_tts_volume: defaults.ttsVolume,
        }),
      );
      return defaults;
    }

    return mapRemotePreferences(row);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      resolvedTheme === "dark",
    );
    document.documentElement.classList.toggle(
      "high-contrast",
      preferences.highContrast,
    );
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [preferences.highContrast, resolvedTheme]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function bootstrap() {
      setIsLoading(true);
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (!active) return;

        const user = session?.user ?? null;
        if (!user) {
          hydratedRef.current = false;
          lastSyncedRef.current = null;
          setUserId(null);
          return;
        }

        const remote = await loadRemotePreferences(user.id);
        if (!active) return;
        lastSyncedRef.current = remote;
        hydratedRef.current = true;
        setUserId(user.id);
        setPreferences(remote);
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, remote.theme);
        } catch {
          // Theme still applies for the current page.
        }
        clearLegacyLocalData();
      } catch {
        if (active) {
          hydratedRef.current = false;
          lastSyncedRef.current = null;
          setUserId(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void bootstrap();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void bootstrap();
      if (event === "SIGNED_OUT") {
        hydratedRef.current = false;
        lastSyncedRef.current = null;
        setUserId(null);
        setPreferences({
          ...DEFAULT_PREFERENCES,
          theme: readStoredTheme(),
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadRemotePreferences]);

  useEffect(() => {
    if (!userId || !hydratedRef.current) return;
    const lastSynced = lastSyncedRef.current;
    if (lastSynced && samePreferences(lastSynced, preferences)) return;

    const version = ++syncVersionRef.current;
    const snapshot = preferences;
    const timeoutId = window.setTimeout(async () => {
      const supabase = createClient();
      try {
        await executeSupabaseRequest(() =>
          supabase.rpc("upsert_user_preferences", {
            p_theme: snapshot.theme,
            p_high_contrast: snapshot.highContrast,
            p_text_scale: snapshot.textScale,
            p_tts_speed: snapshot.ttsSpeed,
            p_tts_volume: snapshot.ttsVolume,
          }),
        );
        lastSyncedRef.current = snapshot;
      } catch {
        if (version !== syncVersionRef.current) return;
        toast.error("Preference sync failed. Restoring saved settings.", {
          id: "preferences-sync-error",
        });
        try {
          const remote = await loadRemotePreferences(userId);
          if (version !== syncVersionRef.current) return;
          lastSyncedRef.current = remote;
          setPreferences(remote);
          try {
            window.localStorage.setItem(THEME_STORAGE_KEY, remote.theme);
          } catch {
            // The restored theme still applies for the current page.
          }
        } catch {
          // Keep the optimistic value when the refetch also fails.
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadRemotePreferences, preferences, userId]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setPreferences((current) => ({ ...current, theme }));
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The remote preference can still be updated.
    }
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setPreferences((current) => ({ ...current, highContrast }));
  }, []);

  const setTextScale = useCallback((textScale: number) => {
    setPreferences((current) => ({ ...current, textScale }));
  }, []);

  const setTtsSpeed = useCallback((ttsSpeed: number) => {
    setPreferences((current) => ({ ...current, ttsSpeed }));
  }, []);

  const setTtsVolume = useCallback((ttsVolume: number) => {
    setPreferences((current) => ({ ...current, ttsVolume }));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      resolvedTheme,
      isLoading,
      setTheme,
      setHighContrast,
      setTextScale,
      setTtsSpeed,
      setTtsVolume,
    }),
    [
      isLoading,
      preferences,
      resolvedTheme,
      setHighContrast,
      setTextScale,
      setTheme,
      setTtsSpeed,
      setTtsVolume,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferencesContext must be used inside PreferencesProvider");
  }
  return value;
}
