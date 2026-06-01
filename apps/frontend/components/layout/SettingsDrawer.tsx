"use client";

import { useState } from "react";
import {
  LogOut,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Sliders,
  Camera,
  Gauge,
  Type,
  Contrast,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TEXT_SCALE_OPTIONS } from "@/hooks/useAccessibilityPrefs";
import type { ThemeMode } from "@/hooks/useTheme";

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  devices: MediaDeviceOption[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  isMirrored: boolean;
  onMirrorToggle: () => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  textScale: number;
  onTextScaleChange: (scale: number) => void;
  ttsSpeed: number;
  onTtsSpeedChange: (v: number) => void;
  ttsVolume: number;
  onTtsVolumeChange: (v: number) => void;
  voiceEnabled?: boolean;
  onVoiceEnabledChange?: (enabled: boolean) => void;
  user?: { name: string, email: string, avatarUrl?: string } | null;
  onLogout: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING — refined with subtle icon glow
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING — Cohere Editorial Style
   ═══════════════════════════════════════════════════════════════ */
function SectionHeading({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="text-cohere-muted" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-mono-label !text-[10px] text-cohere-muted">
        {label}
      </h3>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS CARD — Precise editorial surface
   ═══════════════════════════════════════════════════════════════ */
function SettingsCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md bg-cohere-canvas border border-cohere-hairline",
        "transition-all duration-200",
        hover && "hover:border-cohere-ink hover:shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE — Stark and precise
   ═══════════════════════════════════════════════════════════════ */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cohere-ink focus-visible:ring-offset-2",
        checked
          ? "bg-cohere-ink"
          : "bg-cohere-stone border border-cohere-hairline"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] inline-block h-[18px] w-[18px] rounded-full transition-all duration-200",
          checked ? "left-[20px] bg-cohere-canvas" : "left-[2px] bg-cohere-muted"
        )}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LABELLED SLIDER — Stark monochrome style
   ═══════════════════════════════════════════════════════════════ */
function LabelledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue: (v: number) => string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cohere-ink text-unica-ui">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-cohere-ink bg-cohere-stone px-2 py-0.5 rounded-sm border border-cohere-hairline">
          {formatValue(value)}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        {/* Track background */}
        <div className="w-full h-1 rounded-full bg-cohere-stone overflow-hidden border border-cohere-hairline">
          {/* Filled track */}
          <div
            className="h-full bg-cohere-ink transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Thumb visual */}
        <div
          className="absolute h-4 w-4 rounded-full bg-cohere-ink border border-cohere-canvas pointer-events-none transition-all duration-150"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-cohere-muted font-mono lowercase">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEME SEGMENTED CONTROL — floating pill style
   ═══════════════════════════════════════════════════════════════ */
const THEME_OPTIONS: {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: <Sun className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "system",
    label: "System",
    icon: <Monitor className="h-3.5 w-3.5" aria-hidden="true" />,
  },
  {
    value: "dark",
    label: "Dark",
    icon: <Moon className="h-3.5 w-3.5" aria-hidden="true" />,
  },
];

function ThemeSegmentedControl({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="relative flex w-full gap-1 rounded-md bg-cohere-stone p-1 border border-cohere-hairline"
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${opt.label} theme`}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-semibold transition-all duration-200",
              isActive
                ? "text-cohere-canvas bg-cohere-ink shadow-sm"
                : "text-cohere-muted hover:text-cohere-ink"
            )}
          >
            <span className="relative z-10 flex items-center gap-1.5 text-unica-ui">
              {opt.icon}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXT SCALE SELECTOR — Cohere precise pills
   ═══════════════════════════════════════════════════════════════ */
function TextScaleSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (scale: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Text size"
      className="flex w-full gap-1.5"
    >
      {(
        Object.entries(TEXT_SCALE_OPTIONS) as [string, number][]
      ).map(([key, scale]) => {
        const isActive = value === scale;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(scale)}
            className={cn(
              "flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-bold transition-all duration-200",
              isActive
                ? "bg-cohere-ink text-cohere-canvas shadow-sm"
                : "bg-cohere-stone text-cohere-muted hover:text-cohere-ink border border-cohere-hairline"
            )}
          >
            <span className="text-unica-ui">{key}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS MODAL — Main Component
   ═══════════════════════════════════════════════════════════════ */
export default function SettingsDrawer({
  open,
  onClose,
  theme,
  onThemeChange,
  devices,
  selectedDeviceId,
  onDeviceChange,
  isMirrored,
  onMirrorToggle,
  highContrast,
  onHighContrastToggle,
  textScale,
  onTextScaleChange,
  ttsSpeed,
  onTtsSpeedChange,
  ttsVolume,
  onTtsVolumeChange,
  voiceEnabled = false,
  onVoiceEnabledChange,
  user,
  onLogout,
}: SettingsDrawerProps) {
  const [logoutConfirming, setLogoutConfirming] = useState(false);

  function handleLogoutClick() {
    if (logoutConfirming) {
      onLogout();
      setLogoutConfirming(false);
    } else {
      setLogoutConfirming(true);
      setTimeout(() => setLogoutConfirming(false), 4000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
      className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] max-w-none flex-col gap-0 overflow-hidden rounded-md border border-cohere-hairline bg-cohere-canvas p-0 text-cohere-ink shadow-lg top-4 translate-y-0 sm:top-[50%] sm:max-h-[calc(100dvh-4rem)] sm:-translate-y-1/2 sm:w-[540px] sm:max-w-[540px]"
      aria-label="App settings"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-cohere-hairline px-6 py-5 pr-14">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cohere-stone border border-cohere-hairline">
              <Sliders className="h-4 w-4 text-cohere-ink" aria-hidden="true" />
            </div>
            <DialogTitle className="text-base font-display font-medium tracking-tight text-cohere-ink">
              Settings
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          {/* ── Camera ── */}
          <section aria-labelledby="settings-camera">
            <SectionHeading
              icon={<Camera className="h-3.5 w-3.5" />}
              label="Camera"
            />
            <SettingsCard className="overflow-hidden">
              {devices.length > 0 && (
                <div className="px-4 py-3.5 border-b border-cohere-hairline">
                  <label
                    htmlFor="camera-device"
                    className="text-sm font-medium text-cohere-ink block mb-2 text-unica-ui"
                  >
                    Camera device
                  </label>
                  <div className="relative">
                    <select
                      id="camera-device"
                      value={selectedDeviceId}
                      onChange={(e) => onDeviceChange(e.target.value)}
                      className={cn(
                        "w-full appearance-none rounded-md border border-cohere-hairline bg-cohere-stone",
                        "px-4 py-2.5 pr-10 text-sm text-cohere-ink focus:outline-none focus:ring-1 focus:ring-cohere-ink transition-all"
                      )}
                    >
                      {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cohere-muted rotate-90 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-cohere-ink text-unica-ui">Mirror camera</p>
                  <p className="mt-0.5 text-[11px] text-cohere-muted font-mono lowercase">
                    Flip horizontally for natural view
                  </p>
                </div>
                <Toggle
                  checked={isMirrored}
                  onChange={onMirrorToggle}
                  label="Mirror camera"
                />
              </div>
            </SettingsCard>
          </section>

          {/* ── Appearance ── */}
          <section aria-labelledby="settings-appearance">
            <SectionHeading
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Appearance"
            />
            <div className="flex flex-col gap-2.5">
              <SettingsCard className="p-4">
                <p className="text-sm font-medium text-cohere-ink mb-3 text-unica-ui">Theme</p>
                <ThemeSegmentedControl
                  value={theme}
                  onChange={onThemeChange}
                />
              </SettingsCard>

              <SettingsCard className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cohere-stone border border-cohere-hairline">
                    <Contrast className="h-3.5 w-3.5 text-cohere-ink" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-cohere-ink text-unica-ui">High contrast</p>
                    <p className="mt-0.5 text-[11px] text-cohere-muted font-mono lowercase">
                      Increases text and border contrast
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={highContrast}
                  onChange={onHighContrastToggle}
                  label="High contrast mode"
                />
              </SettingsCard>

              <SettingsCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cohere-stone border border-cohere-hairline">
                    <Type className="h-3.5 w-3.5 text-cohere-ink" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-cohere-ink text-unica-ui">Prediction text size</p>
                </div>
                <TextScaleSelector
                  value={textScale}
                  onChange={onTextScaleChange}
                />
              </SettingsCard>
            </div>
          </section>

          {/* ── Text-to-Speech ── */}
          <section aria-labelledby="settings-tts">
            <SectionHeading
              icon={<Volume2 className="h-3.5 w-3.5" />}
              label="Text-to-Speech"
            />
            <SettingsCard className="p-4 space-y-4">
              {onVoiceEnabledChange && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-cohere-stone border border-cohere-hairline">
                        <Volume2 className="h-3.5 w-3.5 text-cohere-ink" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cohere-ink text-unica-ui">Voice feedback</p>
                        <p className="mt-0.5 text-[11px] text-cohere-muted font-mono lowercase">
                          Speak detected letters automatically
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={voiceEnabled}
                      onChange={onVoiceEnabledChange}
                      label="Voice feedback"
                    />
                  </div>
                  <div className="h-px bg-border/30 dark:bg-white/[0.06]" />
                </>
              )}

              <LabelledSlider
                label="Speed"
                value={ttsSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={onTtsSpeedChange}
                formatValue={(v) => `${v.toFixed(1)}×`}
              />

              <div className="h-px bg-border/30 dark:bg-white/[0.06]" />

              <LabelledSlider
                label="Volume"
                value={ttsVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={onTtsVolumeChange}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />

              <div className="h-px bg-cohere-hairline" />

              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[11px] text-cohere-muted font-mono lowercase">Language</p>
                <span className="rounded-sm bg-cohere-stone px-2.5 py-1 text-[10px] font-bold text-cohere-ink border border-cohere-hairline lowercase font-mono">
                  Bahasa Indonesia
                </span>
              </div>
            </SettingsCard>
          </section>

          {/* ── Account ── */}
          <section aria-labelledby="settings-account" className="mt-auto">
            <SectionHeading
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Account"
            />

            {user && (
              <SettingsCard className="mb-3 p-4" hover>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cohere-ink text-sm font-bold text-cohere-canvas overflow-hidden border border-cohere-hairline">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-medium text-cohere-ink truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-cohere-muted truncate font-mono lowercase">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex h-2 w-2 rounded-full bg-success opacity-50" />
                </div>
              </SettingsCard>
            )}

            <button
              type="button"
              onClick={handleLogoutClick}
              aria-label={
                logoutConfirming
                  ? "Tap again to confirm sign out"
                  : "Sign out"
              }
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-md px-4 py-3.5",
                "text-sm font-medium transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive",
                logoutConfirming
                  ? "bg-destructive/10 text-destructive border border-destructive/25"
                  : "bg-cohere-stone text-cohere-muted hover:bg-destructive/10 hover:text-destructive/80 border border-cohere-hairline"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {logoutConfirming ? "Tap again to confirm" : "Sign out"}
            </button>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/35">
              Password and account changes are managed via your{" "}
              <a
                href="https://myaccount.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground/60 transition-colors"
              >
                Google account
              </a>
              .
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
