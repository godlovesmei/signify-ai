"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import {
  ArrowRight,
  Globe,
  Shield,
  Play,
  Camera,
  Hand,
  MessageSquare,
  ChevronRight,
  Eye,
  Server,
  FileWarning,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION CONFIG — Smooth, cinematic scroll reveals
   ═══════════════════════════════════════════════════════════════════════════ */

/** Easing: ease-out quint — gentle deceleration, cinematic feel */
const EASE_OUT_QUINT = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Duration presets (in seconds) */
const DURATION = {
  fast: 0.5,      // micro-interactions (hover, etc)
  normal: 0.75,   // standard reveal
  slow: 1.0,      // dramatic entrances
  hero: 0.9,      // hero stagger elements
} as const;

/** Distance presets (in pixels, converted to rem via Tailwind) */
const DISTANCE = {
  sm: "translate-y-4",   // 16px — subtle
  md: "translate-y-8",   // 32px — standard
  lg: "translate-y-12",  // 48px — dramatic
  xl: "translate-y-16",  // 64px — hero
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
   INTERSECTION REVEAL HOOK — respects prefers-reduced-motion
   ═══════════════════════════════════════════════════════════════════════════ */
function useIntersectionReveal(threshold = 0.08, rootMargin = "-60px") {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => {
      el.dataset.visible = "true";
    };

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}

/** Reveal wrapper — smooth fade-up on scroll into view */
function Reveal({
  children,
  delay = 0,
  distance = DISTANCE.md,
  duration = DURATION.normal,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useIntersectionReveal();
  return (
    <div
      ref={ref}
      data-visible="false"
      className={[
        "opacity-0",
        distance,
        "data-[visible=true]:opacity-100",
        "data-[visible=true]:translate-y-0",
        "transition-[opacity,transform]",
        className,
      ].join(" ")}
      style={{
        transitionDuration: `${duration}s`,
        transitionTimingFunction: EASE_OUT_QUINT,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Stagger container for child reveals */
function RevealStagger({
  children,
  staggerDelay = 120,
  baseDelay = 0,
  className = "",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  baseDelay?: number;
  className?: string;
}) {
  const ref = useIntersectionReveal(0.05, "-40px");
  return (
    <div
      ref={ref}
      data-visible="false"
      className={className}
      style={{
        // Children use CSS custom property for stagger
        ["--stagger-delay" as string]: `${staggerDelay}ms`,
        ["--base-delay" as string]: `${baseDelay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Stagger item — must be child of RevealStagger */
function RevealItem({
  children,
  index = 0,
  distance = DISTANCE.md,
  duration = DURATION.normal,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  distance?: string;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={[
        "opacity-0",
        distance,
        "group-data-[visible=true]/stagger:opacity-100",
        "group-data-[visible=true]/stagger:translate-y-0",
        "transition-[opacity,transform]",
        className,
      ].join(" ")}
      style={{
        transitionDuration: `${duration}s`,
        transitionTimingFunction: EASE_OUT_QUINT,
        transitionDelay: `calc(var(--base-delay, 0ms) + ${index} * var(--stagger-delay, 120ms))`,
      }}
    >
      {children}
    </div>
  );
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPEWRITER — demo transcript animation
   ═══════════════════════════════════════════════════════════════════════════ */
const DEMO_PHRASES = [
  "Halo, nama saya Rina.",
  "Saya butuh bantuan.",
  "Terima kasih sudah mengerti.",
  "Di mana pintu keluarnya?",
];

function TypewriterTranscript() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    if (paused) {
      const t = setTimeout(() => {
        setDisplayed("");
        setCharIndex(0);
        setPhraseIndex((i) => (i + 1) % DEMO_PHRASES.length);
        setPaused(false);
      }, 2000);
      return () => clearTimeout(t);
    }

    const current = DEMO_PHRASES[phraseIndex];
    if (charIndex < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, 42);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPaused(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [charIndex, paused, phraseIndex, prefersReduced]);

  const visibleText = prefersReduced
    ? DEMO_PHRASES[phraseIndex]
    : displayed;

  return (
    <span className="font-medium text-foreground">
      {visibleText}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-5 w-0.5 animate-[blink_1s_step-end_infinite] bg-primary align-middle"
      />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DECORATIVE ORB — floating gradient blur
   ═══════════════════════════════════════════════════════════════════════════ */
function GlowOrb({
  className = "",
  color = "primary",
}: {
  className?: string;
  color?: "primary" | "cyan" | "success" | "warning";
}) {
  const colorMap = {
    primary: "bg-primary/20",
    cyan: "bg-cyan-500/15",
    success: "bg-emerald-500/15",
    warning: "bg-amber-500/15",
  };
  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute rounded-full blur-3xl animate-float",
        colorMap[color],
        className,
      ].join(" ")}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO — Cinematic, layered, with glass floating card
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section
      id="main-content"
      aria-labelledby="hero-heading"
      className="relative min-h-screen overflow-hidden flex items-center"
    >
      {/* Background image with parallax feel */}
      <Image
        src="/hero.png"
        alt=""
        fill
        className="object-cover object-center scale-105"
        priority
        quality={90}
      />

      {/* Multi-layer gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/80" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-cyan-500/5" />

      {/* Decorative orbs */}
      <GlowOrb
        color="primary"
        className="top-20 right-1/4 w-96 h-96 opacity-60"
      />
      <GlowOrb
        color="cyan"
        className="bottom-32 left-1/3 w-64 h-64 opacity-40"
      />

      <div className="relative w-full px-6 pb-20 pt-32 md:px-12 lg:px-20">
        <div className="max-w-[640px]">
          {/* Eyebrow */}
          <div
            className="mb-6 opacity-0 translate-y-12"
            style={{
              animation: `fade-up ${DURATION.hero}s ${EASE_OUT_QUINT} forwards`,
            }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold uppercase tracking-widest text-primary border-primary/20">
              <Sparkles className="w-3 h-3" />
              Bahasa Isyarat Indonesia
            </span>
          </div>

          {/* H1 — dramatic scale with gradient span */}
          <h1
            id="hero-heading"
            className="mb-8 text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-[72px] opacity-0 translate-y-12"
            style={{
              animation: `fade-up ${DURATION.hero}s ${EASE_OUT_QUINT} ${0.1}s forwards`,
            }}
          >
            Isyarat Tanganmu
            <br />
            Menjadi Kata{" "}
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Seketika.
            </span>
          </h1>

          {/* Body */}
          <p
            className="mb-10 max-w-[480px] text-lg leading-relaxed text-muted-foreground/90 opacity-0 translate-y-12"
            style={{
              animation: `fade-up ${DURATION.hero}s ${EASE_OUT_QUINT} ${0.2}s forwards`,
            }}
          >
            Kenali alfabet dan kata BISINDO secara real-time langsung dari
            kamera perangkatmu — tanpa unduhan, tanpa akun, langsung di
            browser.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap items-center gap-4 opacity-0 translate-y-12"
            style={{
              animation: `fade-up ${DURATION.hero}s ${EASE_OUT_QUINT} ${0.3}s forwards`,
            }}
          >
            <Button
              variant="default"
              size="lg"
              className="rounded-2xl px-8 h-12 text-base font-semibold shadow-glow-primary hover:shadow-glow-primary/80 transition-all duration-300 hover:-translate-y-0.5"
              asChild
            >
              <Link href="/translate">
                Mulai Deteksi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-border/60 px-8 h-12 text-base backdrop-blur-sm hover:bg-white/5 transition-all duration-300"
              asChild
            >
              <Link href="/how-it-works">
                <Play className="mr-2 h-4 w-4 fill-current" aria-hidden="true" />
                Lihat Demo 60 Detik
              </Link>
            </Button>
          </div>

          {/* Trust line */}
          <div
            className="mt-8 flex items-center gap-4 text-sm text-muted-foreground/70 opacity-0 translate-y-12"
            style={{
              animation: `fade-up ${DURATION.hero}s ${EASE_OUT_QUINT} ${0.4}s forwards`,
            }}
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Privasi terjaga
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>Browser-only</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>Gratis selamanya</span>
          </div>
        </div>

        {/* Floating live transcript card — glassmorphism */}
        <div
          className="absolute bottom-16 right-6 md:right-12 lg:right-20 max-w-sm w-full opacity-0 translate-y-16"
          style={{
            animation: `fade-up ${DURATION.slow}s ${EASE_OUT_QUINT} ${0.6}s forwards`,
          }}
          aria-label="Pratinjau hasil deteksi langsung"
        >
          <div className="glass-strong rounded-3xl p-6 shadow-depth-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Live Detection
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
                24 FPS
              </span>
            </div>

            {/* Simulated detection output */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-lg font-black text-primary glow-primary">
                    A
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      Huruf A
                    </span>
                    <span className="text-[10px] font-mono text-success">
                      98%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-foreground/5 overflow-hidden">
                    <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-primary to-success" />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <p className="text-sm leading-relaxed" aria-live="polite" aria-atomic="true">
                <TypewriterTranscript />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS — With connected timeline
   ═══════════════════════════════════════════════════════════════════════════ */
const HOW_IT_WORKS_STEPS = [
  {
    icon: Camera,
    title: "Buka Kameramu",
    desc: "Langsung di browser. Tidak perlu mengunduh apapun. Bekerja di ponsel, tablet, maupun laptop.",
  },
  {
    icon: Hand,
    title: "Tunjukkan Isyarat BISINDO",
    desc: "AI membaca bentuk tangan dan posisi jari secara real-time, lalu mengenali huruf atau kata alfabet BISINDO.",
  },
  {
    icon: MessageSquare,
    title: "Lihat Hasilnya Seketika",
    desc: "Teks hasil terjemahan muncul langsung. Aktifkan Text-to-Speech untuk menyuarakannya dalam Bahasa Indonesia.",
  },
];

function HowItWorksSection() {
  return (
    <section aria-labelledby="how-heading" className="relative py-32 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <GlowOrb color="cyan" className="top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] opacity-30" />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="text-center max-w-xl mx-auto mb-20">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Cara Kerja
            </span>
            <h2
              id="how-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl"
            >
              Tiga Langkah{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
                Sederhana
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="relative grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {/* Connecting line */}
          <div
            aria-hidden="true"
            className="absolute top-12 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] hidden h-px md:block"
          >
            <div className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 180}
              distance={DISTANCE.md}
              duration={DURATION.normal}
            >
              <div className="relative flex flex-col items-center text-center group">
                {/* Step number / icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-depth-2 transition-all duration-300 group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-glow-primary">
                    <Icon
                      className="h-10 w-10 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                    {i + 1}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE DEMO PREVIEW — Immersive glass dashboard mockup
   ═══════════════════════════════════════════════════════════════════════════ */
function DemoPreviewSection() {
  return (
    <section
      aria-labelledby="demo-heading"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30 border-y border-border/20" />
      <GlowOrb color="primary" className="top-1/2 right-0 w-96 h-96 -translate-y-1/2 opacity-20" />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Demo Langsung
            </span>
            <h2
              id="demo-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl mb-5"
            >
              Coba{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Tanpa Akun
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Rasakan deteksi real-time sebelum masuk. Tidak diperlukan
              informasi pribadi apapun.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120} distance={DISTANCE.md} duration={DURATION.normal}>
          <div className="mx-auto max-w-5xl">
            {/* Browser chrome mockup */}
            <div className="rounded-3xl border border-border/40 bg-card/50 shadow-depth-4 overflow-hidden backdrop-blur-sm">
              {/* Browser header */}
              <div
                aria-hidden="true"
                className="flex items-center gap-3 border-b border-border/30 bg-muted/30 px-6 py-4"
              >
                <div className="flex gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-red-400/80" />
                  <span className="h-3.5 w-3.5 rounded-full bg-amber-400/80" />
                  <span className="h-3.5 w-3.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-md mx-auto rounded-lg border border-border/30 bg-background/60 px-4 py-1.5 text-xs text-muted-foreground/60 text-center font-mono">
                    signify.app/translate
                  </div>
                </div>
                <div className="w-16" />
              </div>

              {/* App mockup content */}
              <div className="grid lg:grid-cols-[1.4fr_1fr] min-h-[420px]">
                {/* Camera side */}
                <div className="relative flex flex-col items-center justify-center gap-6 border-r border-border/20 bg-gradient-to-br from-muted/20 via-background to-muted/10 p-10">
                  {/* Reticle corners */}
                  <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
                  <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
                  <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
                  <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />

                  {/* Scanline */}
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan" />

                  {/* Camera icon */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-glow-primary">
                      <Camera
                        className="h-10 w-10 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground text-center max-w-xs">
                    Tampilan kamera aktif — arahkan tangan ke area ini
                  </p>

                  {/* Live badge */}
                  <div className="absolute top-6 left-6">
                    <span className="badge-live">Live</span>
                  </div>

                  {/* FPS counter */}
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 px-2.5 py-1 rounded-lg glass text-[10px] font-mono text-muted-foreground">
                    <Zap className="w-3 h-3 text-warning" />
                    24 FPS
                  </div>
                </div>

                {/* Sidebar side */}
                <div className="flex flex-col p-8 gap-6">
                  {/* Detection result */}
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                      Hasil Deteksi
                    </p>
                    <div className="glass rounded-2xl p-5 border border-white/5">
                      <div className="flex items-center justify-center h-24 mb-4">
                        <span className="text-7xl font-black bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent glow-primary">
                          A
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/40">
                          <span>Confidence</span>
                          <span className="text-success font-mono">98%</span>
                        </div>
                        <div className="confidence-track">
                          <div className="confidence-fill w-[98%] bg-gradient-to-r from-primary to-success" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sentence builder */}
                  <div>
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                      Kalimat
                    </p>
                    <div className="glass rounded-2xl p-4 border border-white/5 min-h-[60px] flex items-center gap-2">
                      <span className="token-pill">H</span>
                      <span className="token-pill">A</span>
                      <span className="token-pill">L</span>
                      <span className="token-pill">O</span>
                      <span className="w-2 h-8 border-b-2 border-white/20" />
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="lg"
                    className="w-full rounded-xl font-semibold h-11 shadow-glow-primary hover:shadow-glow-primary/80 transition-all duration-300"
                    asChild
                  >
                    <Link href="/translate">
                      Buka Penerjemah
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200} distance={DISTANCE.sm} duration={DURATION.normal}>
          <p className="mt-6 text-center text-sm text-muted-foreground/50">
            Pratinjau terbatas. Deteksi penuh tersedia setelah login dengan
            Google — butuh 10 detik.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WHO IT'S FOR — Cards with hover lift & glow
   ═══════════════════════════════════════════════════════════════════════════ */
const AUDIENCES = [
  {
    badge: "Komunitas Tuli & Difabel Rungu",
    title: "Berkomunikasi Mandiri di Mana Saja",
    desc: "Saat konsultasi dokter, wawancara kerja, atau sekadar di warung kopi — ungkapkan dirimu tanpa perlu menunggu juru bahasa isyarat.",
    cta: { label: "Pelajari lebih lanjut", href: "/how-it-works" },
    accent: "primary",
    icon: Hand,
  },
  {
    badge: "Guru & Siswa SLB",
    title: "Latihan Terstruktur dengan Umpan Balik Langsung",
    desc: "Mode Latihan menampilkan target isyarat dan langsung mengonfirmasi apakah bentuk tangan sudah benar.",
    cta: { label: "Lihat mode latihan", href: "/translate" },
    accent: "cyan",
    icon: GraduationCap,
  },
  {
    badge: "Peneliti & Pengembang AI",
    title: "Data Inferensi Terbuka untuk Riset",
    desc: "Akses koordinat landmark tangan, confidence score per kelas, FPS, dan waktu inferensi langsung dari panel developer.",
    cta: { label: "Buka panel developer", href: "/translate" },
    accent: "success",
    icon: FlaskConical,
  },
  {
    badge: "Masyarakat Umum",
    title: "Pelajari BISINDO dari Nol",
    desc: "Galeri Referensi menampilkan semua huruf alfabet BISINDO dengan foto dan panduan. Langsung praktik di depan kamera.",
    cta: { label: "Lihat galeri referensi", href: "/translate" },
    accent: "warning",
    icon: BookOpen,
  },
];

const accentStyles: Record<
  string,
  { text: string; bg: string; border: string; glow: string; shadow: string }
> = {
  primary: {
    text: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/15",
    glow: "group-hover:shadow-glow-primary",
    shadow: "shadow-glow-primary",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-400/8",
    border: "border-cyan-400/15",
    glow: "group-hover:shadow-glow-cyan",
    shadow: "shadow-glow-cyan",
  },
  success: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/15",
    glow: "group-hover:shadow-glow-success",
    shadow: "shadow-glow-success",
  },
  warning: {
    text: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/15",
    glow: "group-hover:shadow-glow-warning",
    shadow: "shadow-glow-warning",
  },
};

function WhoItsForSection() {
  return (
    <section
      id="untuk-siapa"
      aria-labelledby="audience-heading"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      <GlowOrb
        color="success"
        className="bottom-0 left-0 w-[400px] h-[400px] opacity-20"
      />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="text-center max-w-xl mx-auto mb-20">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Untuk Siapa
            </span>
            <h2
              id="audience-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl"
            >
              Dirancang untuk{" "}
              <span className="bg-gradient-to-r from-success to-cyan-400 bg-clip-text text-transparent">
                Kebutuhan Nyata
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {AUDIENCES.map(
            ({ badge, title, desc, cta, accent, icon: Icon }, i) => {
              const style = accentStyles[accent];
              return (
                <Reveal
                  key={badge}
                  delay={i * 140}
                  distance={DISTANCE.md}
                  duration={DURATION.normal}
                >
                  <div
                    className={[
                      "group relative flex h-full flex-col justify-between rounded-3xl border p-7 transition-all duration-500",
                      "hover:-translate-y-2 hover:border-opacity-40",
                      style.border,
                      style.bg,
                      style.glow,
                    ].join(" ")}
                  >
                    {/* Hover glow orb */}
                    <div
                      className={[
                        "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl -z-10",
                        style.bg.replace("/8", "/20"),
                      ].join(" ")}
                    />

                    <div>
                      <div
                        className={[
                          "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                          style.bg.replace("/8", "/15"),
                        ].join(" ")}
                      >
                        <Icon
                          className={["h-6 w-6", style.text].join(" ")}
                          aria-hidden="true"
                        />
                      </div>
                      <span
                        className={[
                          "mb-3 block text-[10px] font-bold uppercase tracking-[0.15em]",
                          style.text,
                        ].join(" ")}
                      >
                        {badge}
                      </span>
                      <h3 className="mb-3 text-lg font-bold text-foreground leading-snug">
                        {title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground/80">
                        {desc}
                      </p>
                    </div>
                    <Link
                      href={cta.href}
                      className={[
                        "mt-8 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5",
                        style.text,
                      ].join(" ")}
                    >
                      {cta.label}
                      <ArrowUpRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </Reveal>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE DEEP DIVE — Alternating layout with glass cards
   ═══════════════════════════════════════════════════════════════════════════ */
const FEATURE_ROWS = [
  {
    icon: Camera,
    eyebrow: "Deteksi Real-Time",
    title: "Dari Gerakan Tangan ke Teks dalam < 150ms",
    body: "YOLO11 mendeteksi dan mengenali gestur tangan secara real-time. Cukup arahkan kamera — model menangani deteksi dan klasifikasi dalam satu langkah.",
    visual: "from-primary/10 via-primary/5 to-transparent",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    iconBorder: "border-primary/20",
    glow: "shadow-glow-primary",
  },
  {
    icon: Globe,
    eyebrow: "BISINDO & Multibahasa",
    title: "Alfabet BISINDO, Diperluas Bersama Komunitas",
    body: "Sistem ini dibangun bersama pengguna BISINDO natif — bukan hanya dari dataset mentah. Dukungan untuk isyarat kata dan frasa sedang dikembangkan secara aktif.",
    visual: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    iconBorder: "border-cyan-400/20",
    glow: "shadow-glow-cyan",
  },
  {
    icon: Shield,
    eyebrow: "Privasi by Design",
    title: "Video Kameramu Tidak Pernah Meninggalkan Perangkat",
    body: "Bahasa isyarat adalah komunikasi yang personal. Semua pemrosesan terjadi lokal di browser. Kami tidak menyimpan video, tidak merekam sesi, dan tidak memiliki akses ke kamera.",
    visual: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    iconBorder: "border-emerald-400/20",
    glow: "shadow-glow-success",
    highlight: true,
  },
];

function FeatureDeepDiveSection() {
  return (
    <section
      aria-labelledby="features-heading"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/20 border-y border-border/10" />
      <GlowOrb
        color="cyan"
        className="top-1/4 left-0 w-[500px] h-[500px] opacity-15"
      />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="text-center max-w-xl mx-auto mb-20">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Kemampuan Sistem
            </span>
            <h2
              id="features-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl"
            >
              Apa yang Membuatnya{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Berbeda
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col gap-16 max-w-5xl mx-auto">
          {FEATURE_ROWS.map(
            (
              {
                icon: Icon,
                eyebrow,
                title,
                body,
                visual,
                iconColor,
                iconBg,
                iconBorder,
                glow,
                highlight,
              },
              i
            ) => (
              <Reveal
                key={title}
                delay={80}
                distance={DISTANCE.md}
                duration={DURATION.normal}
              >
                <div
                  className={[
                    "group grid items-center gap-10 rounded-3xl border p-8 md:p-12 transition-all duration-500",
                    "hover:border-opacity-60 hover:-translate-y-1",
                    i % 2 === 0
                      ? "md:grid-cols-[1fr_420px]"
                      : "md:grid-cols-[420px_1fr]",
                    highlight
                      ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
                      : "border-border/30 bg-card/30 backdrop-blur-sm",
                  ].join(" ")}
                >
                  <div className={i % 2 !== 0 ? "md:order-2" : ""}>
                    <span className="mb-3 block text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                      <span
                        className={["inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle", iconColor.replace("text-", "bg-")].join(" ")}
                      />
                      {eyebrow}
                    </span>
                    <h3 className="mb-5 text-2xl font-extrabold text-foreground leading-snug md:text-3xl lg:text-4xl">
                      {title}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground/80">
                      {body}
                    </p>
                  </div>

                  <div
                    className={[
                      "relative flex h-56 items-center justify-center rounded-2xl overflow-hidden",
                      "bg-gradient-to-br",
                      visual,
                      i % 2 !== 0 ? "md:order-1" : "",
                    ].join(" ")}
                  >
                    {/* Decorative grid pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                        backgroundSize: "24px 24px",
                      }}
                    />

                    <div
                      className={[
                        "relative flex h-24 w-24 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:scale-110",
                        iconBg,
                        iconBorder,
                        glow,
                      ].join(" ")}
                    >
                      <Icon
                        className={["h-10 w-10", iconColor].join(" ")}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRUST & TRANSPARENCY — Glass cards with icons
   ═══════════════════════════════════════════════════════════════════════════ */
const TRUST_PILLARS = [
  {
    icon: Eye,
    title: "Tidak Ada Pemrosesan Cloud",
    desc: "Kamera diproses lokal di browsermu. Tidak pernah menyentuh server kami — atau server manapun.",
  },
  {
    icon: Server,
    title: "Tidak Ada Penyimpanan Video",
    desc: "Tidak ada yang disimpan. Sama sekali. Kami tidak memiliki log sesi, rekaman isyarat, atau rekaman percakapan.",
  },
  {
    icon: FileWarning,
    title: "Jujur Tentang Keterbatasan",
    desc: "Model bekerja terbaik di ruangan terang dengan visibilitas tangan yang jelas. Kami mendokumentasikan batasannya.",
  },
];

function TrustSection() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/10" />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Privasi
            </span>
            <h2
              id="trust-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl mb-5"
            >
              Cara Kami Menjaga{" "}
              <span className="bg-gradient-to-r from-success to-cyan-400 bg-clip-text text-transparent">
                Privasimu
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kamu memberi kami akses ke kamera. Itu hal yang signifikan.
              Berikut yang terjadi — dan yang tidak terjadi.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TRUST_PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal
              key={title}
              delay={i * 150}
              distance={DISTANCE.md}
              duration={DURATION.normal}
            >
              <div className="group glass rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 hover:border-white/15 hover:shadow-depth-3 h-full">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10 border border-foreground/10 transition-all duration-300 group-hover:scale-110 group-hover:from-primary/10 group-hover:to-primary/5 group-hover:border-primary/20">
                  <Icon
                    className="h-6 w-6 text-foreground/70 group-hover:text-primary transition-colors duration-300"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mb-3 text-lg font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground/80">
                  {desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMMUNITY VOICES — Testimonials with glass cards
   ═══════════════════════════════════════════════════════════════════════════ */
function CommunityVoicesSection() {
  return (
    <section
      aria-labelledby="voices-heading"
      className="relative py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/20 border-y border-border/10" />
      <GlowOrb
        color="primary"
        className="bottom-0 right-1/4 w-[500px] h-[500px] opacity-15"
      />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="text-center max-w-xl mx-auto mb-20">
            <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Testimoni
            </span>
            <h2
              id="voices-heading"
              className="text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl"
            >
              Dari Orang-Orang yang{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-primary bg-clip-text text-transparent">
                Menggunakannya
              </span>
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-12 max-w-5xl mx-auto">
          <Reveal
            className="md:col-span-7"
            delay={0}
            distance={DISTANCE.md}
            duration={DURATION.normal}
          >
            <blockquote className="flex h-full flex-col justify-between rounded-3xl glass-strong p-10 md:p-12 shadow-depth-3 border border-white/10">
              <div>
                <div className="mb-6 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-warning"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xl leading-relaxed text-foreground md:text-2xl md:leading-relaxed font-medium">
                  &ldquo;Saya pakai ini saat wawancara kerja. Untuk pertama
                  kalinya saya tidak perlu bertanya apakah mereka punya juru
                  bahasa isyarat. Saya buka laptopnya, langsung berfungsi.&rdquo;
                </p>
              </div>
              <footer className="mt-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">RP</span>
                </div>
                <cite className="not-italic">
                  <p className="text-sm font-bold text-foreground">Rina P.</p>
                  <p className="text-sm text-muted-foreground">
                    Pengguna Tuli, Surabaya
                  </p>
                </cite>
              </footer>
            </blockquote>
          </Reveal>

          <div className="flex flex-col gap-6 md:col-span-5">
            <Reveal delay={120} distance={DISTANCE.md} duration={DURATION.normal}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl glass p-7 border border-white/5 shadow-depth-2">
                <p className="text-sm leading-relaxed text-muted-foreground/90">
                  &ldquo;Saya pakai ini di kelas untuk memberi umpan balik ke
                  murid secara langsung apakah isyarat mereka sudah benar.
                  Tidak ada alat lain yang bisa melakukan ini.&rdquo;
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/30 to-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-cyan-400">HW</span>
                  </div>
                  <cite className="not-italic">
                    <p className="text-sm font-semibold text-foreground">
                      Pak Hendra W.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Guru SLB, Bandung
                    </p>
                  </cite>
                </footer>
              </blockquote>
            </Reveal>
            <Reveal delay={220} distance={DISTANCE.md} duration={DURATION.normal}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl glass p-7 border border-white/5 shadow-depth-2">
                <p className="text-sm leading-relaxed text-muted-foreground/90">
                  &ldquo;Panel developer-nya memberikan akses ke data landmark
                  dan confidence score yang saya butuhkan untuk penelitian.
                  Jarang ada aplikasi yang setransparan ini.&rdquo;
                </p>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-400">
                      DA
                    </span>
                  </div>
                  <cite className="not-italic">
                    <p className="text-sm font-semibold text-foreground">
                      Dimas A.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Peneliti AI, Universitas Indonesia
                    </p>
                  </cite>
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA — Dramatic gradient with floating elements
   ═══════════════════════════════════════════════════════════════════════════ */
function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20" />

      <div className="relative w-full px-6 md:px-12 lg:px-20">
        <Reveal distance={DISTANCE.lg} duration={DURATION.slow}>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-primary-700 px-10 py-24 text-center md:px-24 shadow-glow-primary">
            {/* Decorative orbs inside CTA */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 -left-20 h-48 w-48 -translate-y-1/2 rounded-full bg-success/20 blur-3xl"
            />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative">
              <h2
                id="cta-heading"
                className="text-4xl font-extrabold text-white md:text-5xl lg:text-6xl leading-tight"
              >
                Mulai Berbicara.
                <br />
                Lewat Tanganmu.
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-lg text-white/70 leading-relaxed">
                Coba BISINDO gratis di browsermu sekarang. Tanpa unduhan. Tanpa
                kartu kredit. Tanpa menunggu.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="mt-10 rounded-2xl px-12 h-14 text-base font-bold bg-white text-primary hover:bg-white/90 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-black/30"
                asChild
              >
                <Link href="/translate">
                  Mulai Sekarang — Gratis
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-white/40">
                Butuh 10 detik untuk mulai
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <DemoPreviewSection />
        <WhoItsForSection />
        <FeatureDeepDiveSection />
        <TrustSection />
        <CommunityVoicesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}