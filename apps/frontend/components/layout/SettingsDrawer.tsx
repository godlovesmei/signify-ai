'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Monitor, Moon, Sun, Volume2, Sliders, Camera, BookOpen } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { TEXT_SCALE_OPTIONS } from '@/hooks/useAccessibilityPrefs';
import type { ThemeMode } from '@/hooks/useTheme';
import type { NavUser } from '@/components/layout/Navbar';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;

  // Theme
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;

  // Camera
  devices: MediaDeviceOption[];
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  isMirrored: boolean;
  onMirrorToggle: () => void;

  // Accessibility
  highContrast: boolean;
  onHighContrastToggle: () => void;
  textScale: number;
  onTextScaleChange: (scale: number) => void;

  // TTS
  ttsSpeed: number;
  onTtsSpeedChange: (v: number) => void;
  ttsVolume: number;
  onTtsVolumeChange: (v: number) => void;

  // Account
  user?: NavUser | null;
  onLogout: () => void;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </h3>
    </div>
  );
}

function SettingsRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Accessible pill toggle switch — matches §5.D Toggle / Switch states */
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
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        checked ? 'bg-primary' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'mt-0.5 inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

/** Slider with min/max labels and a live value badge */
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
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className={cn(
          'h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted',
          'accent-primary',
          '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm',
        )}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

// ── Theme Segmented Control ───────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: 'light',  label: 'Light',  icon: <Sun  className="h-3.5 w-3.5" aria-hidden="true" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> },
  { value: 'dark',   label: 'Dark',   icon: <Moon className="h-3.5 w-3.5" aria-hidden="true" /> },
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
      className="flex w-full gap-1 rounded-xl bg-muted p-1"
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
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

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
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[360px]"
        aria-label="App settings"
      >
        <SheetHeader className="shrink-0 border-b border-border/40 px-5 py-4">
          <SheetTitle className="text-sm font-semibold">Settings</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">

          {/* ── Camera ─────────────────────────────────────────────────── */}
          <section aria-labelledby="settings-camera">
            <SectionHeading
              icon={<Camera className="h-3.5 w-3.5" />}
              label="Camera"
            />

            <div className="space-y-2">
              {devices.length > 0 && (
                <SettingsRow className="flex-col items-start gap-2">
                  <label htmlFor="camera-device" className="text-sm font-medium">
                    Camera device
                  </label>
                  <select
                    id="camera-device"
                    value={selectedDeviceId}
                    onChange={(e) => onDeviceChange(e.target.value)}
                    className={cn(
                      'w-full appearance-none rounded-lg border border-border/50 bg-background',
                      'px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary',
                    )}
                  >
                    {devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                </SettingsRow>
              )}

              <SettingsRow>
                <div>
                  <p className="text-sm font-medium">Mirror camera</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Flip horizontally — on by default for selfie cameras
                  </p>
                </div>
                <Toggle
                  checked={isMirrored}
                  onChange={onMirrorToggle}
                  label="Mirror camera"
                />
              </SettingsRow>
            </div>
          </section>

          {/* ── Appearance ──────────────────────────────────────────────── */}
          <section aria-labelledby="settings-appearance">
            <SectionHeading
              icon={<Moon className="h-3.5 w-3.5" />}
              label="Appearance"
            />

            <div className="space-y-2">
              {/* Theme — 3-way segmented control */}
              <SettingsRow className="flex-col items-start gap-3">
                <p className="text-sm font-medium">Theme</p>
                <ThemeSegmentedControl value={theme} onChange={onThemeChange} />
              </SettingsRow>

              {/* High contrast */}
              <SettingsRow>
                <div>
                  <p className="text-sm font-medium">High contrast</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Increases text and border contrast
                  </p>
                </div>
                <Toggle
                  checked={highContrast}
                  onChange={onHighContrastToggle}
                  label="High contrast mode"
                />
              </SettingsRow>

              {/* Text size */}
              <SettingsRow className="flex-col items-start gap-3">
                <p className="text-sm font-medium">Prediction text size</p>
                <div
                  role="radiogroup"
                  aria-label="Text size"
                  className="flex w-full gap-1.5"
                >
                  {(Object.entries(TEXT_SCALE_OPTIONS) as [string, number][]).map(
                    ([key, scale]) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={textScale === scale}
                        onClick={() => onTextScaleChange(scale)}
                        className={cn(
                          'flex flex-1 items-center justify-center rounded-lg py-2',
                          'text-sm font-semibold transition-colors duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          textScale === scale
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                      >
                        {key}
                      </button>
                    ),
                  )}
                </div>
              </SettingsRow>
            </div>
          </section>

          {/* ── TTS ────────────────────────────────────────────────────── */}
          <section aria-labelledby="settings-tts">
            <SectionHeading
              icon={<Volume2 className="h-3.5 w-3.5" />}
              label="Text-to-Speech"
            />

            <div className="space-y-3 rounded-xl bg-muted/40 px-4 py-4">
              <LabelledSlider
                label="Speed"
                value={ttsSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={onTtsSpeedChange}
                formatValue={(v) => `${v.toFixed(1)}×`}
              />
              <div className="h-px bg-border/40" />
              <LabelledSlider
                label="Volume"
                value={ttsVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={onTtsVolumeChange}
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />

              {/* Language badge — was text-primary-700 (too dark on dark bg), now text-primary */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">Language</p>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Bahasa Indonesia
                </span>
              </div>
            </div>
          </section>

          {/* ── Workspace ──────────────────────────────────────────────── */}
          <section aria-labelledby="settings-workspace">
            <SectionHeading
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Workspace"
            />

            <div className="space-y-2">
              <SettingsRow>
                <div>
                  <p className="text-sm font-medium">Practice</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Latihan alfabet dengan progres adaptif
                  </p>
                </div>
                <Link
                  href="/practice"
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Open
                </Link>
              </SettingsRow>

              <SettingsRow>
                <div>
                  <p className="text-sm font-medium">History</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Lihat riwayat transcript yang tersimpan lokal
                  </p>
                </div>
                <Link
                  href="/history"
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Open
                </Link>
              </SettingsRow>

              <SettingsRow>
                <div>
                  <p className="text-sm font-medium">Reference</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Referensi alfabet BISINDO + progress per huruf
                  </p>
                </div>
                <Link
                  href="/reference"
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Open
                </Link>
              </SettingsRow>
            </div>
          </section>

          {/* ── Account ─────────────────────────────────────────────────── */}
          <section aria-labelledby="settings-account" className="mt-auto">
            <SectionHeading
              icon={<Sliders className="h-3.5 w-3.5" />}
              label="Account"
            />

            {user && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground overflow-hidden">
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
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogoutClick}
              aria-label={
                logoutConfirming ? 'Tap again to confirm sign out' : 'Sign out'
              }
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
                'text-sm font-medium transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50',
                logoutConfirming
                  ? 'bg-destructive/10 text-destructive border border-destructive/30'
                  : 'bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              {logoutConfirming ? 'Tap again to sign out' : 'Sign out'}
            </button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground/60">
              Password and account changes are managed via your{' '}
              <a
                href="https://myaccount.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-muted-foreground"
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

