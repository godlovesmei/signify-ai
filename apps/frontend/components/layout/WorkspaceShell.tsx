"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import AppSidebar from "@/components/layout/AppSidebar";
import MobileBottomNav from "./mobile-nav/MobileBottomNav";
import SettingsDrawer from "./SettingsDrawer";
import { useTheme } from "@/hooks/useTheme";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

const WORKSPACE_USER = { name: "User Session", email: "user@signify.ai" };

export default function WorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Mock handlers
  const handleLogout = useCallback(() => {
    console.log("Logging out...");
  }, []);

  const [devices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isMirrored, setIsMirrored] = useState(true);
  const prefs = useAccessibilityPrefs();

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-cohere-canvas text-cohere-ink antialiased">
      <TopBar onMenuClick={() => setSidebarMobileOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          pathname={pathname}
          onSettingsClick={() => setSettingsOpen(true)}
          onLogout={handleLogout}
          mobileOpen={sidebarMobileOpen}
          onMobileClose={() => setSidebarMobileOpen(false)}
          user={WORKSPACE_USER}
        />

        <main className="flex-1 min-w-0 relative bg-cohere-canvas overflow-hidden flex flex-col">
          <div className="flex-1 w-full h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav reserveSpace={false} />

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
