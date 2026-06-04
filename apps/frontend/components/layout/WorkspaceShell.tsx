"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "./mobile-nav/MobileBottomNav";
import SettingsDrawer from "./SettingsDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

const WORKSPACE_USER = { name: "User Session", email: "user@signify.ai" };

/**
 * WorkspaceShell — full-viewport two-column layout.
 *
 * Changes from previous version:
 *  - TopBar removed entirely; logo now lives in AppSidebar header
 *  - No h-dvh + TopBar overhead; the shell itself is h-dvh
 *  - Sidebar controls mobileOpen state here so the shell owns all nav state
 *  - MobileBottomNav only renders on workspace routes (handled internally)
 */
export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = useCallback(() => {
    console.log("Logging out...");
  }, []);

  const [devices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isMirrored, setIsMirrored] = useState(true);
  const prefs = useAccessibilityPrefs();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-cohere-canvas text-cohere-ink antialiased">
      {/* Sidebar: visible on lg+, drawer on mobile/tablet */}
      <AppSidebar
        pathname={pathname}
        onSettingsClick={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        user={WORKSPACE_USER}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile/tablet top strip: hamburger + logo */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-cohere-hairline bg-cohere-canvas px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="flex size-8 items-center justify-center rounded-sm border border-cohere-hairline text-cohere-ink transition-colors hover:bg-cohere-stone"
          >
            {/* Hamburger icon inline to avoid extra import */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {/* Wordmark only on mobile top bar */}
          <span className="font-display text-sm font-medium tracking-tight text-cohere-ink">
            Signify<span className="brand-ai-gradient">AI</span>
          </span>
          {/* Right slot — empty, keeps wordmark centered */}
          <div className="size-8" aria-hidden="true" />
        </header>

        <main
          id="workspace-main"
          className="min-h-0 flex-1 min-w-0 overflow-auto bg-cohere-canvas"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav (renders only on workspace routes) */}
      <MobileBottomNav />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onDeviceChange={setSelectedDeviceId}
        isMirrored={isMirrored}
        onMirrorToggle={() => setIsMirrored((v) => !v)}
        highContrast={prefs.highContrast}
        onHighContrastToggle={() => prefs.setHighContrast(!prefs.highContrast)}
        textScale={prefs.textScale}
        onTextScaleChange={prefs.setTextScale}
        ttsSpeed={prefs.ttsSpeed}
        onTtsSpeedChange={prefs.setTtsSpeed}
        ttsVolume={prefs.ttsVolume}
        onTtsVolumeChange={prefs.setTtsVolume}
        user={WORKSPACE_USER}
        onLogout={handleLogout}
      />
    </div>
  );
}
