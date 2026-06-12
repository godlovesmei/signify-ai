"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  GraduationCap,
  Hand,
  Lock,
  MessageSquare,
  Shield,
  Sparkles,
  Volume2,
} from "lucide-react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import { LoginModal } from "@/components/auth/LoginModal";
import { LandingDeviceShowcase } from "@/components/landing/LandingDeviceShowcase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import { sanitizeRelativePath } from "@/lib/authRedirect";
import { createClient } from "@/utils/supabase/client";

const phrases = [
  "Halo, nama saya Rina.",
  "Saya butuh bantuan.",
  "Terima kasih.",
  "Di mana pintu keluar?",
];

const capabilities = [
  {
    icon: Camera,
    title: "Browser camera",
    body: "Open a session from desktop or mobile and keep the interface focused on the live camera feed.",
  },
  {
    icon: Hand,
    title: "BISINDO alphabet",
    body: "Frame-by-frame prediction turns hand shapes into a clean sequence of letters.",
  },
  {
    icon: Volume2,
    title: "Text to speech",
    body: "Read the built sentence aloud in Bahasa Indonesia when a user needs spoken output.",
  },
];

const products = [
  {
    title: "Translate workspace",
    body: "A dark product field for camera input, confidence scoring, sentence assembly, and session logs.",
    href: "/translate",
    checks: ["Real-time prediction", "Editable sentence buffer", "Session export"],
  },
  {
    title: "Practice studio",
    body: "Targeted alphabet drills with adaptive weak-letter queues and local progress tracking.",
    href: "/practice",
    checks: ["Hold-to-confirm flow", "Reference overlays", "Accuracy history"],
  },
  {
    title: "Research library",
    body: "A publishing surface for explaining the model, limitations, and accessibility decisions.",
    href: "/research",
    checks: ["Readable sections", "Clear limitations", "Model context"],
  },
];

const trustItems = [
  "Community",
  "Education",
  "Research",
  "Public Access",
  "Accessibility",
  "BISINDO",
];

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-in" | "clip";
};

type ProtectedNavigateHandler = (nextPath?: string) => void;

function motionStyle(delay = 0): CSSProperties {
  return { "--delay": `${delay}ms` } as CSSProperties;
}

function Reveal({ children, className = "", delay = 0, variant = "fade-up" }: RevealProps) {
  return (
    <div
      data-animate={variant}
      style={motionStyle(delay)}
      className={className}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PROFESSIONAL CSS — Custom properties, advanced techniques,
   scroll-driven animations, and micro-interactions
   ──────────────────────────────────────────────────────────────── */
function PageMotionStyles() {
  return (
    <style jsx global>{`
      :root {
        --scroll-progress: 0;
      }

      .landing-page {
        --mouse-x: 50%;
        --mouse-y: 50%;
        --surface-0: var(--color-bg-base);
        --surface-1: var(--color-card-bg);
        --surface-2: var(--color-bg-subtle);
        --surface-3: var(--color-bg-tertiary);
        --ink-primary: var(--color-text-primary);
        --ink-secondary: var(--color-text-secondary);
        --ink-tertiary: var(--color-text-muted);
        --ink-muted: color-mix(in srgb, var(--color-text-muted) 68%, transparent);
        --accent-warm: var(--color-accent);
        --accent-warm-light: color-mix(in srgb, var(--color-accent) 16%, var(--color-bg-base));
        --accent-green: var(--color-bg-product);
        --accent-green-light: var(--color-highlight-bg);
        --accent-blue: var(--color-action);
        --accent-blue-light: var(--color-bg-tertiary);
        --border-subtle: color-mix(in srgb, var(--color-border) 62%, transparent);
        --border-medium: var(--color-border);
        --spotlight-glow: color-mix(in srgb, var(--color-bg-inverse) 12%, transparent);
        --shadow-ambient: 0 1px 2px color-mix(in srgb, var(--cohere-black) 5%, transparent);
        --shadow-elevated: 0 16px 48px color-mix(in srgb, var(--cohere-black) 9%, transparent);
        --shadow-floating: 0 24px 72px color-mix(in srgb, var(--cohere-black) 14%, transparent);
      }

      .dark .landing-page {
        --shadow-ambient: 0 0 0 1px color-mix(in srgb, var(--color-border) 50%, transparent);
        --shadow-elevated: 0 0 0 1px color-mix(in srgb, var(--color-border) 65%, transparent);
        --shadow-floating: 0 0 0 1px color-mix(in srgb, var(--color-border) 85%, transparent);
      }

      /* ── Scroll Progress Bar ── */
      .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 80;
        height: 2px;
        width: 100%;
        transform: scaleX(var(--scroll-progress));
        transform-origin: left center;
        background: linear-gradient(90deg, var(--accent-warm), var(--accent-green), var(--accent-blue));
        pointer-events: none;
        box-shadow: 0 0 8px color-mix(in srgb, var(--accent-warm) 36%, transparent);
      }

      /* ── Core Animation System ── */
      [data-animate] {
        opacity: 0;
        transform: translate3d(0, 52px, 0);
        filter: blur(10px);
        transition:
          opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1),
          transform 1100ms cubic-bezier(0.16, 1, 0.3, 1),
          filter 1100ms cubic-bezier(0.16, 1, 0.3, 1),
          clip-path 1100ms cubic-bezier(0.16, 1, 0.3, 1);
        transition-delay: var(--delay, 0ms);
        will-change: opacity, transform, filter;
      }

      [data-animate="fade-down"] {
        transform: translate3d(0, -44px, 0);
      }

      [data-animate="fade-left"] {
        transform: translate3d(56px, 0, 0);
      }

      [data-animate="fade-right"] {
        transform: translate3d(-56px, 0, 0);
      }

      [data-animate="scale-in"] {
        transform: translate3d(0, 28px, 0) scale(0.96);
      }

      [data-animate="clip"] {
        opacity: 1;
        transform: none;
        filter: none;
        clip-path: inset(0 0 100% 0);
      }

      [data-animate].is-visible {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0);
      }

      [data-animate="clip"].is-visible {
        clip-path: inset(0 0 0 0);
      }

      /* ── Spotlight / Glow Hover Effect ── */
      [data-spotlight] {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        transition:
          transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 350ms ease,
          box-shadow 350ms ease;
      }

      [data-spotlight] > * {
        position: relative;
        z-index: 1;
      }

      [data-spotlight]::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        background: radial-gradient(
          500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          var(--spotlight-glow),
          transparent 50%
        );
        opacity: 0;
        transition: opacity 400ms ease;
        pointer-events: none;
      }

      [data-spotlight]:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-floating);
      }

      [data-spotlight]:hover::before {
        opacity: 1;
      }

      /* ── Arrow Link Micro-interaction ── */
      [data-arrow-link] {
        position: relative;
      }

      [data-arrow-link] svg {
        transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      [data-arrow-link]:hover svg {
        transform: translateX(5px);
      }

      /* ── Hero Ambient Background ── */
      .hero-motion-shell {
        position: relative;
        overflow: hidden;
      }

      .hero-motion-shell::before,
      .hero-motion-shell::after {
        content: "";
        position: absolute;
        pointer-events: none;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.4;
        animation: ambient-drift 20s ease-in-out infinite alternate;
      }

      .hero-motion-shell::before {
        width: 500px;
        height: 500px;
        top: -5%;
        left: -10%;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent-warm) 15%, transparent), transparent 70%);
      }

      .hero-motion-shell::after {
        width: 600px;
        height: 600px;
        right: -15%;
        bottom: -10%;
        background: radial-gradient(circle, color-mix(in srgb, var(--accent-green) 12%, transparent), transparent 70%);
        animation-delay: -8s;
      }

      .hero-motion-content {
        position: relative;
        z-index: 1;
      }

      /* ── Floating Animation ── */
      .floating-card {
        animation: float-gentle 7s ease-in-out infinite;
      }

      /* ── Image Zoom on Hover ── */
      .hero-image-zoom img {
        transform: scale(1.02);
        transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .hero-image-zoom:hover img {
        transform: scale(1.08);
      }

      /* ── Marquee / Trust Strip ── */
      .signify-marquee {
        overflow: hidden;
        mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
      }

      .signify-marquee-track {
        display: flex;
        width: max-content;
        gap: 0.75rem;
        animation: marquee-scroll 28s linear infinite;
      }

      .signify-marquee:hover .signify-marquee-track {
        animation-play-state: paused;
      }

      .signify-marquee-item {
        display: inline-flex;
        min-width: 160px;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 1px solid var(--border-subtle);
        border-radius: 100px;
        padding: 0.75rem 1.25rem;
        background: var(--surface-1);
        box-shadow: var(--shadow-ambient);
        transition:
          transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
          background 250ms ease,
          box-shadow 250ms ease;
      }

      .signify-marquee-item:hover {
        transform: translateY(-3px);
        background: var(--surface-0);
        box-shadow: var(--shadow-elevated);
      }

      /* ── Sticky Parallax Band ── */
      .sticky-band {
        transform: translate3d(0, var(--parallax-y, 0), 0);
        transition: transform 100ms linear;
        will-change: transform;
      }

      .horizontal-feature-card,
      .horizontal-cta-card {
        display: block !important;
        height: auto !important;
        min-height: unset !important;
        aspect-ratio: auto !important;
      }

      .horizontal-feature-card {
        padding: clamp(1.5rem, 3vw, 2.5rem);
      }

      .horizontal-cta-card {
        padding: clamp(1.5rem, 2.8vw, 2.25rem);
      }

      @media (min-width: 1024px) {
        .horizontal-feature-card .relative.grid {
          grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
        }
      }

      /* ── Research Row — ENHANCED ── */
      .research-row {
        position: relative;
        transition:
          background-color 350ms cubic-bezier(0.16, 1, 0.3, 1),
          transform 350ms cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 350ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .research-row::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, var(--accent-warm), var(--accent-green));
        transform: scaleY(0);
        transform-origin: top;
        transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
        border-radius: 0 2px 2px 0;
      }

      .research-row:hover {
        background: var(--surface-1);
        transform: translateX(4px);
        box-shadow: var(--shadow-elevated);
      }

      .research-row:hover::before {
        transform: scaleY(1);
      }

      .research-row .row-arrow {
        opacity: 0;
        transform: translateX(-8px);
        transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .research-row:hover .row-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      .research-row .row-meta {
        transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .research-row:hover .row-meta {
        transform: translateX(-4px);
      }

      /* ── Product Card — ENHANCED ── */
      .product-card-animated {
        transition:
          transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .product-card-animated:hover {
        transform: translateY(-6px) scale(1.005);
      }

      .product-card-animated .product-icon-wrap {
        transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .product-card-animated:hover .product-icon-wrap {
        transform: scale(1.05) rotate(-2deg);
      }

      /* ── Capability Card — ENHANCED ── */
      .capability-card {
        transition:
          transform 400ms cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 400ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 400ms ease;
      }

      .capability-card:hover {
        transform: translateY(-6px);
        box-shadow: var(--shadow-floating);
      }

      .capability-card .capability-number {
        transition: color 300ms ease;
      }

      .capability-card:hover .capability-number {
        color: var(--accent-warm);
      }

      .capability-card .capability-icon {
        transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      .capability-card:hover .capability-icon {
        transform: scale(1.1) rotate(3deg);
      }

      /* ── CTA Card Glow ── */
      .cta-glow {
        position: relative;
      }

      .cta-glow::after {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        background: linear-gradient(
          135deg,
          color-mix(in srgb, var(--accent-warm) 20%, transparent),
          color-mix(in srgb, var(--accent-green) 15%, transparent),
          color-mix(in srgb, var(--accent-blue) 20%, transparent)
        );
        z-index: -1;
        opacity: 0;
        transition: opacity 500ms ease;
        filter: blur(20px);
      }

      .cta-glow:hover::after {
        opacity: 1;
      }

      /* ── Magnetic Button Effect ── */
      .magnetic-btn {
        transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* ── Noise Texture Overlay ── */
      .noise-overlay::after {
        content: "";
        position: absolute;
        inset: 0;
        opacity: 0.03;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        background-repeat: repeat;
        background-size: 128px;
      }

      /* ── Gradient Text ── */
      .gradient-text {
        background: linear-gradient(135deg, var(--ink-primary) 0%, var(--accent-warm) 50%, var(--accent-green) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* ── Shimmer Effect ── */
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .shimmer {
        background: linear-gradient(
          90deg,
          transparent 0%,
          color-mix(in srgb, var(--color-bg-inverse) 12%, transparent) 50%,
          transparent 100%
        );
        background-size: 200% 100%;
        animation: shimmer 3s ease-in-out infinite;
      }

      /* ── Keyframes ── */
      @keyframes marquee-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(calc(-50% - 0.375rem)); }
      }

      @keyframes float-gentle {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        33% { transform: translateY(-12px) rotate(0.5deg); }
        66% { transform: translateY(-6px) rotate(-0.5deg); }
      }

      @keyframes ambient-drift {
        from { transform: translate3d(0, 0, 0) scale(1); }
        to { transform: translate3d(60px, -40px, 0) scale(1.1); }
      }

      @keyframes blink {
        0%, 48% { opacity: 1; }
        49%, 100% { opacity: 0; }
      }

      .animate-blink {
        animation: blink 1s step-end infinite;
      }

      @keyframes pulse-soft {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .pulse-soft {
        animation: pulse-soft 2s ease-in-out infinite;
      }

      @keyframes scan-line {
        0% { transform: translateY(0); opacity: 0.5; }
        50% { transform: translateY(280px); opacity: 1; }
        100% { transform: translateY(0); opacity: 0.5; }
      }

      .scanline {
        animation: scan-line 3.5s ease-in-out infinite;
      }

      /* ── Reduced Motion ── */
      @media (prefers-reduced-motion: reduce) {
        .scroll-progress { display: none; }
        [data-animate],
        [data-animate].is-visible,
        .floating-card,
        .signify-marquee-track,
        .hero-motion-shell::before,
        .hero-motion-shell::after,
        .scanline,
        .shimmer,
        .pulse-soft {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
          clip-path: none !important;
        }
      }
    `}</style>
  );
}

/* ────────────────────────────────────────────────────────────────
   HOOKS
   ──────────────────────────────────────────────────────────────── */

function useCohereLikeMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animatedElements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));

    if (reduceMotion.matches) {
      animatedElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    animatedElements.forEach((element) => observer.observe(element));

    let animationFrame = 0;

    const updateScrollMotion = () => {
      animationFrame = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      document.documentElement.style.setProperty("--scroll-progress", String(progress));

      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
        const speed = Number(element.dataset.parallax || 0.08);
        const rect = element.getBoundingClientRect();
        const distanceFromCenter = rect.top + rect.height / 2 - window.innerHeight / 2;
        element.style.setProperty("--parallax-y", `${distanceFromCenter * speed * -0.1}px`);
      });
    };

    const requestScrollMotion = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateScrollMotion);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!target) return;

      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    };

    updateScrollMotion();
    window.addEventListener("scroll", requestScrollMotion, { passive: true });
    window.addEventListener("resize", requestScrollMotion);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      observer.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", requestScrollMotion);
      window.removeEventListener("resize", requestScrollMotion);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);
}

function useTypewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    if (text.length < phrase.length) {
      const timeoutId = window.setTimeout(() => {
        setText(phrase.slice(0, text.length + 1));
      }, 52);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setText("");
      setPhraseIndex((index) => (index + 1) % phrases.length);
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [phraseIndex, text]);

  return text;
}

/* ────────────────────────────────────────────────────────────────
   COMPONENTS
   ──────────────────────────────────────────────────────────────── */

function MacSignScannerCard() {
  const text = useTypewriter();

  return (
    <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 shadow-[var(--shadow-elevated)]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--accent-warm)_14%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--accent-blue)_12%,transparent)] blur-3xl" />

      {/* mac shell */}
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[#111218] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* top chrome */}
        <div className="flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#15161d] px-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1">
            <span className="size-1.5 rounded-full bg-emerald-400 pulse-soft" />
            <span className="text-[11px] font-medium text-white/60">
              SignifyAI · Live recognition
            </span>
          </div>

          <div className="text-[11px] text-white/25">⌘K</div>
        </div>

        <div className="grid gap-0 lg:h-[min(46vw,480px)] lg:grid-cols-[1.15fr_0.85fr]">
          {/* live camera / scanning panel */}
          <div className="relative min-h-[320px] overflow-hidden border-r border-white/[0.06] bg-[#f4d7cd] md:min-h-[380px] lg:min-h-0">
            <Image
              src="/hero.png"
              alt="Sign language recognition live preview"
              width={1200}
              height={900}
              className="h-full w-full object-contain object-center opacity-[0.92]"
              priority
            />

            {/* glass wash */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)_32%,rgba(0,0,0,0.18)_100%)]" />

            {/* scanning frame */}
            <div className="pointer-events-none absolute inset-6 rounded-[24px] border border-white/[0.12]">
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/8 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-xl">
                <span className="size-1.5 rounded-full bg-emerald-400 pulse-soft" />
                Tracking hands
              </div>

              <div className="absolute right-5 top-5 rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur-xl">
                98.4% confidence
              </div>

              {/* corner brackets */}
              <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-[12px] border-l-[1.5px] border-t-[1.5px] border-white/70" />
              <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-[12px] border-r-[1.5px] border-t-[1.5px] border-white/70" />
              <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[12px] border-b-[1.5px] border-l-[1.5px] border-white/70" />
              <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-[12px] border-b-[1.5px] border-r-[1.5px] border-white/70" />

              {/* sign-language landmark dots */}
              <div className="absolute right-[17%] top-[42%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_20px_rgba(137,240,255,0.9)]" />
              <div className="absolute right-[20%] top-[48%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_20px_rgba(137,240,255,0.9)]" />
              <div className="absolute right-[24%] top-[52%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_20px_rgba(137,240,255,0.9)]" />
              <div className="absolute right-[18%] top-[58%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_20px_rgba(137,240,255,0.9)]" />
              <div className="absolute right-[14%] top-[54%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_20px_rgba(137,240,255,0.9)]" />

              {/* subtle links between points */}
              <span className="absolute right-[18.3%] top-[44.3%] h-[54px] w-px rotate-[28deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/90 to-[#89f0ff]/0" />
              <span className="absolute right-[21.7%] top-[49.2%] h-[44px] w-px rotate-[40deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/80 to-[#89f0ff]/0" />
              <span className="absolute right-[16.4%] top-[50.4%] h-[42px] w-px -rotate-[35deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/80 to-[#89f0ff]/0" />

              {/* scanning line */}
              <div className="scanline absolute inset-x-5 top-16 h-px bg-gradient-to-r from-transparent via-[#7cf7ff] to-transparent shadow-[0_0_20px_rgba(124,247,255,0.9)]" />

              {/* bottom output bubble */}
              <div className="absolute bottom-5 left-5 right-5 rounded-[20px] border border-white/[0.08] bg-black/35 p-4 backdrop-blur-xl">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Recognized output
                </p>
                <p className="mt-2 text-[22px] font-medium leading-[1.25] text-white">
                  {text}
                  <span className="ml-1 inline-block h-5 w-px animate-blink bg-white/70 align-middle" />
                </p>
              </div>
            </div>
          </div>

          {/* side diagnostic panel */}
          <div className="flex min-h-[320px] flex-col bg-[#111218] p-4 md:min-h-[380px] lg:min-h-0 lg:overflow-hidden">
            <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                Session
              </p>
              <h3 className="mt-2 text-[21px] font-medium text-white">
                BISINDO recognition
              </h3>
              <p className="mt-2 text-[13px] leading-[1.5] text-white/50">
                Real-time camera understanding tuned for hand pose recognition and low-friction output.
              </p>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Model</p>
                <p className="mt-2 text-[16px] font-medium text-white">YOLOv11 + landmarks</p>
              </div>

              <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Latency</p>
                <p className="mt-2 text-[16px] font-medium text-white">Sub-second</p>
              </div>

              <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">Privacy</p>
                <p className="mt-2 text-[16px] font-medium text-white">Local-first</p>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] border border-emerald-400/12 bg-emerald-400/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/80">
                  Active intent
                </p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                  <span className="size-1 rounded-full bg-emerald-300 pulse-soft" />
                  Live
                </span>
              </div>
              <p className="mt-3 text-[16px] font-medium text-white">Translation ready</p>
              <p className="mt-2 text-[13px] leading-[1.45] text-white/50">
                Hand gesture sequence has been identified and transformed into natural Indonesian output.
              </p>
            </div>

            <div className="mt-auto hidden pt-3 xl:block">
              <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/35">
                    Pipeline
                  </p>
                  <p className="text-[11px] text-white/40">Camera → Detect → Decode → Speak</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    "Frame capture stable",
                    "Hands isolated",
                    "Gesture decoded",
                    "Voice output available",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-white/70" />
                      <span className="text-[12px] text-white/65">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── HERO SECTION ── */
function HeroSection({ onStartTranslating }: { onStartTranslating: ProtectedNavigateHandler }) {
  return (
    <section className="hero-motion-shell bg-[var(--surface-0)] pt-24 md:pt-28">
      <div className="hero-motion-content cohere-container pb-12 pt-8 md:pb-16">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal delay={130}>
            <h1 className="font-display text-[52px] leading-[1.05] text-[var(--ink-primary)] sm:text-[68px] lg:text-[88px]">
              Silent communication,{" "}
              <span className="relative inline-block">
                clearly
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C50 2 150 2 198 8" stroke="var(--accent-warm)" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.45"/>
                </svg>
              </span>{" "}
              understood.
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.6] text-[var(--ink-secondary)]">
              A controlled AI workspace for translating Indonesian sign language gestures into
              text and voice — without turning accessibility into spectacle.
            </p>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                data-arrow-link
                onClick={() => onStartTranslating("/translate")}
                className="magnetic-btn h-12 px-8"
              >
                Start translating
                <ArrowRight className="size-4" />
              </Button>

              <Button
                asChild
                variant="secondary"
                className="h-12 text-[15px] [&_[data-button-underline]]:bg-[linear-gradient(90deg,#ff7a67_0%,#c98cff_52%,#5468ff_100%)] [&_[data-button-underline]]:duration-500"
              >
                <Link href="/how-it-works">Explore the system</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={360} variant="scale-in" className="mt-10 md:mt-14">
          <MacSignScannerCard />
        </Reveal>
      </div>
    </section>
  );
}

/* ── TRUST STRIP ── */
function TrustStrip() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface-0)] py-14 md:py-16">
      <div className="cohere-container text-center">
        <Reveal delay={120} variant="clip">
          <div className="signify-marquee text-[12px] font-medium tracking-[0.08em] uppercase text-[var(--ink-secondary)]">
            <div className="signify-marquee-track" aria-hidden="true">
              {[...trustItems, ...trustItems].map((item, index) => (
                <span key={`${item}-${index}`} className="signify-marquee-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── CAPABILITY SECTION ── */
function CapabilitySection() {
  return (
    <section id="how-it-works" className="bg-[var(--surface-0)] py-20 md:py-28">
      <div className="cohere-container">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.5fr] lg:items-end">
          <div>
            <Reveal variant="fade-right">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-tertiary)]">
                Capabilities
              </p>
            </Reveal>
            <Reveal delay={90} variant="fade-right">
              <h2 className="mt-4 font-display text-[40px] leading-[1.08] text-[var(--ink-primary)] md:text-[56px]">
                Three quiet steps from gesture to sentence.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={150} variant="fade-left" className="lg:justify-self-end">
            <p className="max-w-xl text-[17px] leading-[1.6] text-[var(--ink-secondary)]">
              The interface avoids unnecessary chrome: camera, prediction, sentence assembly,
              and speech controls stay visible exactly where the task needs them.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3 md:items-stretch">
          {capabilities.map((item, index) => (
            <article
              key={item.title}
              data-animate="fade-up"
              data-spotlight
              style={motionStyle(index * 120)}
              className="capability-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-7 text-[var(--ink-primary)] shadow-[var(--shadow-ambient)]"
            >
              <div className="capability-icon flex size-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-0)] text-[var(--ink-primary)] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-bg-inverse)_8%,transparent)]">
                <item.icon className="size-5" />
              </div>
              <p className="capability-number mt-7 text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-muted)]">
                0{index + 1}
              </p>
              <h3 className="mt-3 text-[22px] font-medium leading-[1.3] text-[var(--ink-primary)]">
                {item.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--ink-secondary)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── DARK FEATURE BAND ── */
function DarkFeatureBand() {
  return (
    <section className="bg-[var(--surface-0)] py-14 md:py-20">
      <div className="cohere-container">
        <Reveal variant="fade-left">
          <Card
            data-parallax="0.08"
            data-spotlight
            className="horizontal-feature-card sticky-band noise-overlay relative w-full overflow-hidden gap-0 rounded-[24px] border-transparent bg-[var(--color-bg-product)] text-white"
          >
            {/* Decorative elements */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--accent-warm)_12%,transparent)] blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white/50">
                  Privacy architecture
                </p>
                <h2 className="mt-4 font-display text-[40px] leading-[1.1] text-white md:text-[56px]">
                  Camera work stays controlled.
                </h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { icon: Shield, text: "Video frames are processed for the active recognition flow." },
                  { icon: Lock, text: "Saved history stores translated text, not raw camera footage." },
                  { icon: MessageSquare, text: "Users can clear logs and rebuild sentences at any time." },
                ].map((item, index) => (
                  <div
                    key={item.text}
                    data-animate="fade-left"
                    style={motionStyle(index * 100)}
                    className="flex gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08]">
                      <item.icon className="size-4 text-white/80" />
                    </div>
                    <p className="text-[16px] leading-[1.5] text-white/75">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* ── PRODUCT CARDS ── */
function ProductCards() {
  return (
    <section id="products" className="scroll-mt-28 bg-[var(--surface-0)] py-20 md:py-28">
      <div className="cohere-container">
        <Reveal variant="fade-right">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-tertiary)]">
            Workspace modules
          </p>
        </Reveal>
        <Reveal delay={90} variant="fade-right">
          <h2 className="mt-4 max-w-3xl font-display text-[40px] leading-[1.08] text-[var(--ink-primary)] md:text-[56px]">
            Product surfaces for translation, practice, and research.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {products.map((product, index) => (
            <Card
              key={product.title}
              asChild
              variant="product"
              data-animate={index % 2 === 0 ? "fade-right" : "fade-left"}
              data-spotlight
              style={motionStyle(index * 120)}
              className="product-card-animated gap-0 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-8 text-[var(--ink-primary)] shadow-[var(--shadow-ambient)]"
            >
              <article>
                <div className="product-icon-wrap mb-6 flex size-11 items-center justify-center rounded-xl bg-[var(--surface-0)] text-[var(--ink-primary)]">
                  {index === 0 ? <Camera className="size-5" /> :
                   index === 1 ? <Hand className="size-5" /> :
                   <BookOpen className="size-5" />}
                </div>
                <h3 className="text-[26px] font-medium leading-[1.2]">{product.title}</h3>
                <p className="mt-4 text-[15px] leading-[1.6] text-[var(--ink-secondary)]">{product.body}</p>
                <ul className="mt-8 space-y-3 border-t border-[var(--border-subtle)] pt-6">
                  {product.checks.map((check) => (
                    <li key={check} className="flex items-center gap-3 text-[14px] text-[var(--ink-secondary)]">
                      <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent-green-light)]">
                        <Check className="size-3 text-[var(--accent-green)]" />
                      </span>
                      {check}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="mt-8 justify-start text-[var(--ink-primary)] hover:text-[var(--accent-warm)]"
                >
                  <Link href={product.href} data-arrow-link>
                    Open module <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── RESEARCH ROWS — ENHANCED ── */
function ResearchRows() {
  const rows = [
    {
      title: "Model transparency",
      topic: "Research",
      meta: "Updated 2026",
      icon: FlaskConical,
      iconClassName: "bg-[var(--accent-warm-light)] text-[var(--accent-warm)]",
      badgeClassName: "bg-[var(--accent-warm-light)] text-[var(--accent-warm)]",
    },
    {
      title: "Known limitations",
      topic: "Safety",
      meta: "5 min read",
      icon: Shield,
      iconClassName: "bg-[var(--accent-green-light)] text-[var(--accent-green)]",
      badgeClassName: "bg-[var(--accent-green-light)] text-[var(--accent-green)]",
    },
    {
      title: "BISINDO learning path",
      topic: "Education",
      meta: "26 letters",
      icon: GraduationCap,
      iconClassName: "bg-[var(--accent-blue-light)] text-[var(--accent-blue)]",
      badgeClassName: "bg-[var(--accent-blue-light)] text-[var(--accent-blue)]",
    },
  ];

  return (
    <section className="bg-[var(--surface-0)] py-20 md:py-28">
      <div className="cohere-container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal variant="fade-right">
              <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--ink-tertiary)]">
                Research table
              </p>
            </Reveal>
            <Reveal delay={90} variant="fade-right">
              <h2 className="mt-4 text-[36px] leading-[1.15] text-[var(--ink-primary)] md:text-[48px]">
                Learn how the{" "}
                <span className="relative inline-block">
                  system
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 120 8" fill="none">
                    <path d="M2 5C30 1 90 1 118 5" stroke="var(--accent-warm)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.42"/>
                  </svg>
                </span>{" "}
                behaves.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140} variant="fade-left">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="group rounded-full px-4"
            >
              <Link href="/research">
                View all research
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow-ambient)]">
          {rows.map((row, index) => {
            const { title, topic, meta, icon: Icon, iconClassName, badgeClassName } = row;
            return (
            <Link
              key={title}
              href="/research"
              data-animate={index % 2 === 0 ? "fade-right" : "fade-left"}
              style={motionStyle(index * 100)}
              className="research-row group flex items-center gap-4 rounded-xl px-5 py-5 text-[var(--ink-primary)] md:gap-6 md:px-6 md:py-6"
            >
              {/* Icon */}
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
                <Icon className="size-4.5" />
              </div>

              {/* Title */}
              <span className="flex-1 text-[17px] font-medium leading-[1.4] md:text-[18px]">
                {title}
              </span>

              {/* Arrow (hidden until hover) */}
              <ChevronRight className="row-arrow size-5 shrink-0 text-[var(--ink-muted)]" />

              {/* Meta group */}
              <div className="row-meta flex shrink-0 items-center gap-3">
                <Badge
                  variant="outline"
                  className={`rounded-full border-none px-3 py-1 text-[12px] font-medium ${badgeClassName}`}
                >
                  {topic}
                </Badge>
                <span className="hidden items-center gap-1.5 text-[13px] text-[var(--ink-tertiary)] md:flex">
                  {meta.includes("min") ? <Clock className="size-3.5" /> : null}
                  {meta.includes("letters") ? <FileText className="size-3.5" /> : null}
                  {meta.includes("2026") ? <Sparkles className="size-3.5" /> : null}
                  {meta}
                </span>
              </div>
            </Link>
          );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── CTA SECTION ── */
function CtaSection({ onOpenWorkspace }: { onOpenWorkspace: ProtectedNavigateHandler }) {
  return (
    <section className="bg-[var(--surface-0)] py-14 md:py-20">
      <div className="cohere-container">
        <Reveal variant="fade-left">
          <Card
            data-spotlight
            className="horizontal-cta-card cta-glow relative w-full gap-0 overflow-hidden rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--ink-primary)]"
          >
            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--accent-warm)_8%,transparent)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent-green)_8%,transparent)] blur-3xl" />

            <div className="relative">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <h2 className="max-w-4xl font-display text-[40px] leading-[1.08] text-[var(--ink-primary)] md:text-[56px] lg:max-w-none">
                  Translate, practice, and review in one calm workspace.
                </h2>
                <Button
                  variant="primary"
                  size="lg"
                  data-arrow-link
                  onClick={() => onOpenWorkspace("/translate")}
                  className="magnetic-btn h-12 shrink-0 px-7"
                >
                  Open SignifyAI
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  useCohereLikeMotion();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginNextPath, setLoginNextPath] = useState<string | null>(null);

  const openLogin = useCallback((nextPath: string | null = null) => {
    setLoginNextPath(nextPath);
    setLoginOpen(true);
  }, []);

  const navigateProtected = useCallback(
    async (nextPath = "/translate") => {
      const safeNextPath = sanitizeRelativePath(nextPath);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        router.push(safeNextPath);
        return;
      }

      openLogin(safeNextPath);
    },
    [openLogin, router],
  );

  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-[var(--surface-0)] text-[var(--ink-primary)]">
      <PageMotionStyles />
      <div className="scroll-progress" aria-hidden="true" />
      <LandingNavbar onLoginRequest={openLogin} />
      <main id="main-content">
        <HeroSection onStartTranslating={(nextPath) => void navigateProtected(nextPath)} />
        <LandingDeviceShowcase />
        <TrustStrip />
        <CapabilitySection />
        <DarkFeatureBand />
        <ProductCards />
        <ResearchRows />
        <CtaSection onOpenWorkspace={(nextPath) => void navigateProtected(nextPath)} />
      </main>
      <Footer />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        nextPath={loginNextPath}
      />
    </div>
  );
}
