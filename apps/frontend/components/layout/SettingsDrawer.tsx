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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TEXT_SCALE_OPTIONS } from "@/hooks/useAccessibilityPrefs";
import type { ThemeMode } from "@/hooks/useTheme";
import type { NavUser } from "@/components/layout/Navbar";

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
  user?: NavUser | null;
  onLogout: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADING — refined with subtle icon glow
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
      <span className="text-primary/60" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/45">
        {label}
      </h3>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS CARD — glass panel with refined depth
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
        "rounded-2xl glass border border-border/40 dark:border-white/[0.06]",
        "shadow-[0_1px_3px_rgba(var(--shadow-color),0.04),0_4px_12px_-6px_rgba(var(--shadow-color),0.08)]",
        "transition-all duration-300",
        hover && "hover:border-primary/15 dark:hover:border-primary/20 hover:shadow-[0_0_24px_-8px_rgba(var(--glow-primary),0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE — refined with spring animation feel
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
        "relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked
          ? "bg-primary shadow-[0_0_12px_-2px_rgba(var(--glow-primary),0.35)]"
          : "bg-muted-foreground/20 hover:bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] inline-block h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(var(--shadow-color),0.15)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          checked ? "left-[20px]" : "left-[2px]"
        )}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LABELLED SLIDER — custom styled with glow thumb
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
        <span className="text-[13px] font-medium text-foreground/85">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-primary/70 font-semibold bg-primary/[0.08] dark:bg-primary/[0.12] px-2 py-0.5 rounded-md">
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
        <div className="w-full h-1.5 rounded-full bg-muted-foreground/10 overflow-hidden">
          {/* Filled track */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Thumb visual */}
        <div
          className="absolute h-4 w-4 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--glow-primary),0.4)] border-2 border-white dark:border-[oklch(21%_0.0162_310.40)] pointer-events-none transition-all duration-150"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/35 font-medium">
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
      className="relative flex w-full gap-1 rounded-xl bg-muted/40 dark:bg-white/[0.03] p-1 border border-border/30 dark:border-white/[0.05]"
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
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isActive
                ? "text-primary"
                : "text-muted-foreground/50 hover:text-foreground/70"
            )}
          >
            {isActive && (
              <span className="absolute inset-0 rounded-lg bg-primary/[0.08] dark:bg-primary/[0.12] ring-1 ring-primary/15 dark:ring-primary/25 shadow-[0_0_16px_-6px_rgba(var(--glow-primary),0.15)]" />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
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
   TEXT SCALE SELECTOR — refined pill buttons
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
              "flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isActive
                ? "bg-primary text-primary-foreground shadow-[0_0_16px_-4px_rgba(var(--glow-primary),0.3)]"
                : "bg-muted/40 dark:bg-white/[0.04] text-muted-foreground/50 hover:text-foreground/70 hover:bg-muted/60 dark:hover:bg-white/[0.07]"
            )}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS DRAWER — Main Component
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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[380px] glass-strong border-l border-border/40 dark:border-white/[0.06]"
        aria-label="App settings"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b border-border/30 dark:border-white/[0.06] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/[0.08] dark:bg-primary/[0.12] ring-1 ring-primary/15">
              <Sliders className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <SheetTitle className="text-base font-display font-semibold tracking-tight">
              Settings
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          {/* ── Camera ── */}
          <section aria-labelledby="settings-camera">
            <SectionHeading
              icon={<Camera className="h-3.5 w-3.5" />}
              label="Camera"
            />
            <SettingsCard className="overflow-hidden">
              {devices.length > 0 && (
                <div className="px-4 py-3.5 border-b border-border/30 dark:border-white/[0.06]">
                  <label
                    htmlFor="camera-device"
                    className="text-[13px] font-medium text-foreground/85 block mb-2"
                  >
                    Camera device
                  </label>
                  <div className="relative">
                    <select
                      id="camera-device"
                      value={selectedDeviceId}
                      onChange={(e) => onDeviceChange(e.target.value)}
                      className={cn(
                        "w-full appearance-none rounded-xl border border-border/50 dark:border-white/[0.08] bg-muted/30 dark:bg-white/[0.03]",
                        "px-4 py-2.5 pr-10 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                      )}
                    >
                      {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 rotate-90 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div>
                  <p className="text-[13px] font-medium text-foreground/85">Mirror camera</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/50">
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
                <p className="text-[13px] font-medium text-foreground/85 mb-3">Theme</p>
                <ThemeSegmentedControl
                  value={theme}
                  onChange={onThemeChange}
                />
              </SettingsCard>

              <SettingsCard className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/[0.08] dark:bg-warning/[0.12] ring-1 ring-warning/15">
                    <Contrast className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground/85">High contrast</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/50">
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/[0.08] dark:bg-info/[0.12] ring-1 ring-info/15">
                    <Type className="h-3.5 w-3.5 text-info" aria-hidden="true" />
                  </div>
                  <p className="text-[13px] font-medium text-foreground/85">Prediction text size</p>
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/[0.08] dark:bg-success/[0.12] ring-1 ring-success/15">
                        <Volume2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground/85">Voice feedback</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">
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

              <div className="h-px bg-border/30 dark:bg-white/[0.06]" />

              <div className="flex items-center justify-between pt-0.5">
                <p className="text-[11px] text-muted-foreground/40 font-medium">Language</p>
                <span className="rounded-lg bg-primary/[0.08] dark:bg-primary/[0.12] px-2.5 py-1 text-[10px] font-bold text-primary ring-1 ring-primary/15">
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
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-700 text-sm font-bold text-primary-foreground shadow-glow-primary overflow-hidden">
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
                    <p className="text-sm font-display font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground/55 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex h-2 w-2 rounded-full bg-success shadow-[0_0_6px_rgba(var(--glow-success),0.5)]" />
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
                "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5",
                "text-sm font-medium transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
                logoutConfirming
                  ? "bg-destructive/10 text-destructive border border-destructive/25 shadow-[0_0_20px_-6px_rgba(var(--glow-error),0.15)]"
                  : "glass text-muted-foreground/60 hover:bg-destructive/[0.06] hover:text-destructive/80 border border-border/40 dark:border-white/[0.06]"
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
      </SheetContent>
    </Sheet>
  );
}