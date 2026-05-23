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

  // SettingsDrawer props (mirrored from translate page)
  const [devices, setDevices] = useState<{ deviceId: string; label: string }[]>([]);
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

      <div className="flex flex-1 overflow-hidden md:pr-3 md:pb-3 md:pt-0 md:pl-2 gap-3">
        {/* Desktop Sidebar */}
        <AppSidebar
          pathname={pathname}
          onSettingsClick={() => setSettingsOpen(true)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 min-w-0 relative bg-background md:rounded-[24px] md:border md:border-border/40 md:shadow-[0_2px_20px_-8px_rgba(0,0,0,0.1)] dark:md:shadow-none overflow-hidden flex flex-col">
          <div className="flex-1 w-full h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav reserveSpace={false} />

      {/* Settings Drawer */}
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
        onLogout={handleLogout}
      />
    </div>
  );
}