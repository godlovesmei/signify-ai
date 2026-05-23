"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "./mobile-nav/MobileBottomNav";
import SettingsDrawer from "./SettingsDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

const WORKSPACE_USER = { name: "Nama User", email: "user@signify.ai" };

export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const prefs = useAccessibilityPrefs();

  // Settings modal props (mirrored from translate page)
  const [devices] = useState<{ deviceId: string; label: string }[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isMirrored, setIsMirrored] = useState(true);

  const handleLogout = useCallback(async () => {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground selection:bg-primary/20 antialiased">
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden gap-3 md:pr-3 md:pb-3 md:pt-0 md:pl-0">
        {/* Desktop Sidebar */}
        <AppSidebar
          pathname={pathname}
          onSettingsClick={() => setSettingsOpen(true)}
          onLogout={handleLogout}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          user={WORKSPACE_USER}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 relative bg-background md:rounded-[24px] md:border md:border-border/70 md:shadow-[0_16px_45px_-34px_rgba(var(--shadow-color),0.5)] dark:md:shadow-none overflow-hidden flex flex-col">
          <div className="flex-1 w-full h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav reserveSpace={false} />

      {/* Settings Modal */}
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
