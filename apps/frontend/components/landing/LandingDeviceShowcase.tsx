"use client"

import type { CSSProperties } from "react"
import { useTranslations } from "next-intl"
import {
  BookOpen,
  Camera,
  Hand,
  MessageSquare,
  Monitor,
  Smartphone,
  Tablet,
  Volume2,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type DevicePreviewProps = {
  device: "desktop" | "tablet" | "mobile"
  className?: string
}

const practiceLetters = ["A", "B", "I", "S"]

const desktopNavItems: Array<{
  labelKey: "translate" | "practice" | "reference"
  Icon: LucideIcon
}> = [
  { labelKey: "translate", Icon: Camera },
  { labelKey: "practice", Icon: Hand },
  { labelKey: "reference", Icon: BookOpen },
]

function revealDelay(delay: number): CSSProperties {
  return { "--delay": `${delay}ms` } as CSSProperties
}

/* ── Device Chrome Frames ── */
function DeviceChrome({ device }: Pick<DevicePreviewProps, "device">) {
  const t = useTranslations("landing.deviceShowcase")

  if (device === "mobile") {
    return (
      <div className="mx-auto mb-2 flex items-center justify-center gap-2">
        <div className="h-1 w-12 rounded-full bg-white/20" />
      </div>
    )
  }

  if (device === "tablet") {
    return (
      <div className="mb-2 flex items-center justify-center">
        <span className="size-1.5 rounded-full bg-white/20" />
      </div>
    )
  }

  return (
    <div className="mb-2.5 flex h-8 items-center justify-between rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-3">
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[#ff6b5f]" />
        <span className="size-2.5 rounded-full bg-[#ffcf5a]" />
        <span className="size-2.5 rounded-full bg-[#4ad986]" />
      </div>
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-emerald-400/60" />
        <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-0.5 text-[10px] font-medium text-white/70">
          {t("address")}
        </span>
      </div>
      <span className="text-[10px] text-white/70">{t("live")}</span>
    </div>
  )
}

/* ── Desktop Mock UI ── */
function DesktopMockUi() {
  const t = useTranslations("landing.deviceShowcase")
  const navT = useTranslations("navigation.workspace")

  return (
    <div className="grid h-full grid-cols-[0.22fr_0.78fr] bg-[#111218] text-white">
      <aside className="border-r border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#17171c]">
            S
          </span>
          <div>
            <p className="text-[11px] font-semibold text-white">SignifyAI</p>
            <p className="text-[10px] text-white/70">{t("sidebarSubtitle")}</p>
          </div>
        </div>
        <div className="mt-8 space-y-1">
          {desktopNavItems.map(({ labelKey, Icon }) => (
            <div
              key={labelKey}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors",
                labelKey === "translate"
                  ? "bg-white text-[#17171c] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  : "text-white/70 hover:bg-white/[0.04] hover:text-white/85",
              )}
            >
              <Icon className="size-3.5" />
              {navT(labelKey)}
            </div>
          ))}
        </div>
      </aside>

      <div className="grid grid-rows-[auto_1fr] overflow-hidden">
        <header className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{t("workspaceLabel")}</p>
            <p className="mt-1 text-[15px] font-semibold text-white">{t("translateSession")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-2.5 py-1 text-[10px] text-emerald-200">
              <span className="size-1 rounded-full bg-emerald-300 animate-pulse" />
              {t("confidence")}
            </span>
            <span className="size-8 rounded-full bg-gradient-to-br from-[#ffad9b] to-[#c4703a]" />
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-[1.12fr_0.88fr] gap-3 p-3 sm:p-4">
          {/* Camera panel */}
          <div className="relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#f4d7cd]">
            <div className="absolute inset-5 rounded-[20px] border border-white/[0.25]" />
            <div className="absolute left-7 top-7 flex items-center gap-1.5 rounded-full border border-white/[0.25] bg-black/15 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-xl">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t("cameraActive")}
            </div>
            <div className="absolute left-[29%] top-[24%] size-32 rounded-full border border-white/[0.25] bg-white/15 blur-[1px]" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[18px] border border-white/[0.1] bg-black/40 p-4 backdrop-blur-xl">
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/70">{t("recognizedOutput")}</p>
              <p className="mt-2 text-[22px] font-medium leading-tight text-white">{t("desktopOutput")}</p>
            </div>
            <span className="absolute left-[41%] top-[41%] size-2 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(165,243,252,0.95)]" />
            <span className="absolute left-[46%] top-[48%] size-2 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(165,243,252,0.95)]" />
            <span className="absolute left-[38%] top-[52%] size-2 rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(165,243,252,0.95)]" />
          </div>

          {/* Side panels */}
          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{t("practiceLabel")}</p>
                  <p className="mt-2 text-[18px] font-medium leading-tight text-white">{t("dailyDrill")}</p>
                </div>
                <Hand className="size-5 text-white/70" />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {practiceLetters.map((letter, index) => (
                  <span
                    key={letter}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-[13px] font-semibold transition-transform hover:scale-105",
                      index < 3 ? "bg-white text-[#17171c] shadow-sm" : "bg-white/[0.06] text-white/75",
                    )}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/[0.06] bg-[#2d5a4a]/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{t("statistics")}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[26px] font-semibold leading-none text-white">26</p>
                  <p className="mt-1 text-[10px] text-white/70">{t("letters")}</p>
                </div>
                <div>
                  <p className="text-[26px] font-semibold leading-none text-white">12m</p>
                  <p className="mt-1 text-[10px] text-white/70">{t("practice")}</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-white/80 to-white/40" />
              </div>
            </div>

            <div className="rounded-[20px] border border-white/[0.06] bg-white p-4 text-[#17171c]">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#e8f0ec]">
                  <Volume2 className="size-4 text-[#2d5a4a]" />
                </div>
                <span className="text-[12px] font-semibold">{t("voiceReady")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Tablet Mock UI ── */
function TabletMockUi() {
  const t = useTranslations("landing.deviceShowcase")

  return (
    <div className="flex h-full flex-col bg-[#f7f5f1] p-4 text-[#17171c]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#5f5f5f]">{t("tabletMode")}</p>
          <p className="mt-1 text-[17px] font-medium leading-tight">{t("practiceAndTranslate")}</p>
        </div>
        <span className="size-8 rounded-full bg-gradient-to-br from-[#17171c] to-[#3a3a3a]" />
      </div>

      <div className="mt-4 grid flex-1 gap-3">
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#e8f0ec]">
                <Camera className="size-4 text-[#2d5a4a]" />
              </span>
              <div>
                <p className="text-[13px] font-semibold">{t("translate")}</p>
                <p className="text-[10px] text-[#5f5f5f]">{t("cameraFramed")}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#e8f0ec] px-2.5 py-1 text-[10px] font-medium text-[#2d5a4a]">
              <span className="size-1 rounded-full bg-[#2d5a4a] animate-pulse" />
              {t("live")}
            </span>
          </div>
          <div className="mt-4 h-24 rounded-[16px] bg-[#f4d7cd]">
            <div className="flex h-full items-center justify-center">
              <div className="size-16 rounded-full border border-white/60 bg-white/20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-black/[0.06] bg-[#17171c] p-4 text-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">{t("output")}</p>
            <p className="mt-3 text-[18px] font-medium leading-tight">{t("tabletOutput")}</p>
          </div>
          <div className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#5f5f5f]">{t("accuracy")}</p>
            <p className="mt-3 text-[30px] font-semibold leading-none">92%</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edeae4]">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[#2d5a4a] to-[#4a8a6a]" />
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold">{t("nextDrill")}</span>
            <span className="rounded-full bg-[#f5e6d8] px-2.5 py-1 text-[11px] font-medium text-[#c4703a]">
              {t("letterS")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Mobile Mock UI ── */
function MobileMockUi() {
  const t = useTranslations("landing.deviceShowcase")

  return (
    <div className="flex h-full flex-col bg-[#f8f7f4] p-3 text-[#17171c]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#5f5f5f]">{t("mobile")}</p>
          <p className="mt-1 text-[15px] font-medium leading-tight">{t("quickTranslate")}</p>
        </div>
        <span className="size-8 rounded-full bg-gradient-to-br from-[#ffad9b] to-[#c4703a]" />
      </div>

      <div className="mt-4 rounded-[20px] bg-[#17171c] p-3 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">{t("camera")}</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] text-emerald-200">
            <span className="size-1 rounded-full bg-emerald-300 animate-pulse" />
            {t("live")}
          </span>
        </div>
        <div className="mt-3 flex aspect-[4/3] items-center justify-center rounded-[16px] bg-[#f4d7cd]">
          <div className="size-16 rounded-full border border-white/70 bg-white/25" />
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-black/[0.06] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-[#5f5f5f]" />
          <span className="text-[11px] font-semibold text-[#4a4a4a]">{t("translationResult")}</span>
        </div>
        <p className="mt-3 text-[19px] font-medium leading-tight">{t("mobileOutput")}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[16px] bg-[#e8f0ec] p-3">
          <p className="text-[20px] font-semibold leading-none text-[#2d5a4a]">8</p>
          <p className="mt-1 text-[10px] text-[#2d5a4a]/70">{t("saved")}</p>
        </div>
        <div className="rounded-[16px] bg-[#edeae4] p-3">
          <p className="text-[20px] font-semibold leading-none text-[#1a1a1a]">94%</p>
          <p className="mt-1 text-[10px] text-[#5f5f5f]">{t("accuracy")}</p>
        </div>
      </div>

      <div className="mt-auto rounded-full bg-[#1a1a1a] px-4 py-3 text-center text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        {t("startPractice")}
      </div>
    </div>
  )
}

/* ── Device Preview Wrapper ── */
function DevicePreview({ device, className }: DevicePreviewProps) {
  const t = useTranslations("landing.deviceShowcase")
  const isMobile = device === "mobile"
  const isTablet = device === "tablet"

  const deviceLabel =
    device === "desktop"
      ? t("desktopLabel")
      : device === "tablet"
        ? t("tabletLabel")
        : t("mobileLabel")
  const DeviceIcon = device === "desktop" ? Monitor : device === "tablet" ? Tablet : Smartphone

  return (
    <figure
      className={cn(
        "relative mx-auto w-full",
        isMobile && "max-w-[240px]",
        isTablet && "max-w-[520px]",
        device === "desktop" && "max-w-[920px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden border border-[var(--color-border)] bg-[#15161d] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.18)]",
          isMobile && "rounded-[36px]",
          isTablet && "rounded-[32px]",
          device === "desktop" && "rounded-[28px] p-2.5",
        )}
      >
        <DeviceChrome device={device} />
        <div
          className={cn(
            "overflow-hidden border border-white/[0.08]",
            isMobile && "aspect-[9/17] rounded-[30px]",
            isTablet && "aspect-[4/3] rounded-[26px]",
            device === "desktop" && "aspect-[16/10] rounded-[22px]",
          )}
        >
          {device === "desktop" ? <DesktopMockUi /> : null}
          {device === "tablet" ? <TabletMockUi /> : null}
          {device === "mobile" ? <MobileMockUi /> : null}
        </div>
      </div>
      <figcaption className="mt-4 flex items-center justify-center gap-2 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
        <DeviceIcon className="size-3.5" />
        {deviceLabel}
      </figcaption>
    </figure>
  )
}

/* ── Main Showcase Component ── */
export function LandingDeviceShowcase() {
  const t = useTranslations("landing.deviceShowcase")
  const bullets = t.raw("bullets") as Array<{ label: string; desc: string }>

  return (
    <section className="overflow-hidden bg-[var(--color-bg-base)] pt-20 pb-10 md:pt-28 md:pb-12">
      <div className="cohere-container">
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <div data-animate="fade-right">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--color-text-secondary)]">
                {t("sectionLabel")}
              </p>
            </div>
            <div data-animate="fade-right" style={revealDelay(90)}>
              <h2 className="mt-4 max-w-2xl font-display text-[40px] leading-[1.08] text-[var(--color-text-primary)] md:text-[56px]">
                {t("sectionTitle")}
              </h2>
            </div>
            <div data-animate="fade-right" style={revealDelay(150)}>
              <p className="mt-5 max-w-xl text-[17px] leading-[1.6] text-[var(--color-text-secondary)]">
                {t("sectionBody")}
              </p>
            </div>

            {/* Feature bullets */}
            <div data-animate="fade-right" style={revealDelay(220)} className="mt-8 space-y-3">
              {bullets.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--color-highlight-bg)]">
                    <span className="size-1.5 rounded-full bg-[var(--color-bg-product)]" />
                  </span>
                  <span className="text-[14px] text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">{item.label}</span>
                    <span className="text-[var(--color-text-secondary)]"> — {item.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden="true"
            data-animate="fade-left"
            style={revealDelay(180)}
            className="relative mx-auto grid w-full max-w-[1080px] gap-6 md:grid-cols-[0.65fr_1fr] md:items-end lg:block lg:min-h-[640px]"
          >
            {/* Ambient glow behind devices */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[72%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-bg-product)_14%,transparent),transparent_64%)] blur-3xl lg:block" />

            <DevicePreview
              device="desktop"
              className="order-1 md:col-span-2 lg:absolute lg:right-0 lg:top-7 lg:w-[82%]"
            />
            <DevicePreview
              device="tablet"
              className="order-2 md:order-2 lg:absolute lg:bottom-6 lg:left-0 lg:z-20 lg:w-[44%]"
            />
            <DevicePreview
              device="mobile"
              className="order-3 md:order-3 md:self-start lg:absolute lg:bottom-2 lg:right-[4%] lg:z-30 lg:w-[24%]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
