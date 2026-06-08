"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import AppSidebar from "@/components/layout/AppSidebar";
import type { SidebarUser } from "@/components/layout/AppSidebar";
import MobileBottomNav from "./mobile-nav/MobileBottomNav";
import SettingsDrawer from "./SettingsDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { getAccountProfile } from "@/lib/accountData";
import { createClient } from "@/utils/supabase/client";

const FALLBACK_WORKSPACE_USER: SidebarUser = {
  name: "User Account",
  email: "account@signify.ai",
  avatarUrl: null,
};

/**
 * WorkspaceShell — full-viewport two-column layout.
 *
 * Mobile and tablet navigation lives in MobileBottomNav; desktop uses AppSidebar.
 */
export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<SidebarUser>(FALLBACK_WORKSPACE_USER);

  const handleLogout = useCallback(() => {
    void createClient()
      .auth.signOut()
      .then(({ error }) => {
        if (error) throw error;
        window.location.href = "/";
      })
      .catch(() => toast.error("Sign out failed. Please try again."));
  }, []);

  useEffect(() => {
    let active = true;
    void getAccountProfile()
      .then((profile) => {
        if (!active || !profile) return;
        setUser({
          name: profile.displayName,
          email: profile.email,
          avatarUrl: profile.avatarUrl,
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const [devices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isMirrored, setIsMirrored] = useState(true);
  const prefs = useAccessibilityPrefs();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-cohere-canvas text-cohere-ink antialiased">
      {/* Sidebar: desktop only. Mobile/tablet use the bottom nav. */}
      <AppSidebar
        pathname={pathname}
        onSettingsClick={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
        user={user}
        onLogout={handleLogout}
      />
    </div>
  );
}
