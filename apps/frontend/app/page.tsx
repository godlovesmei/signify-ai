"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Hand,
  Lock,
  MessageSquare,
  Shield,
  Volume2,
} from "lucide-react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";

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

function PageMotionStyles() {
  return (
    <style jsx global>{`
      :root {
        --scroll-progress: 0;
      }

      .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 80;
        height: 3px;
        width: 100%;
        transform: scaleX(var(--scroll-progress));
        transform-origin: left center;
        background: linear-gradient(90deg, #ff7759, #003c33, #315cfd);
        pointer-events: none;
      }

      [data-animate] {
        opacity: 0;
        transform: translate3d(0, 36px, 0);
        filter: blur(10px);
        transition:
          opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
          filter 900ms cubic-bezier(0.22, 1, 0.36, 1),
          clip-path 900ms cubic-bezier(0.22, 1, 0.36, 1);
        transition-delay: var(--delay, 0ms);
        will-change: opacity, transform, filter, clip-path;
      }

      [data-animate="fade-down"] {
        transform: translate3d(0, -28px, 0);
      }

      [data-animate="fade-left"] {
        transform: translate3d(34px, 0, 0);
      }

      [data-animate="fade-right"] {
        transform: translate3d(-34px, 0, 0);
      }

      [data-animate="scale-in"] {
        transform: translate3d(0, 24px, 0) scale(0.96);
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

      [data-spotlight] {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        transition:
          transform 280ms ease,
          border-color 280ms ease,
          box-shadow 280ms ease;
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
          420px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
          rgba(255, 255, 255, 0.24),
          transparent 42%
        );
        opacity: 0;
        transition: opacity 250ms ease;
        pointer-events: none;
      }

      [data-spotlight]:hover {
        transform: translateY(-6px);
        box-shadow: 0 24px 70px rgba(23, 23, 28, 0.14);
      }

      [data-spotlight]:hover::before {
        opacity: 1;
      }

      [data-arrow-link] svg {
        transition: transform 220ms ease;
      }

      [data-arrow-link]:hover svg {
        transform: translateX(5px);
      }

      .hero-motion-shell {
        position: relative;
        overflow: hidden;
      }

      .hero-motion-shell::before,
      .hero-motion-shell::after {
        content: "";
        position: absolute;
        pointer-events: none;
        border-radius: 999px;
        filter: blur(52px);
        opacity: 0.55;
        animation: slow-orbit 18s ease-in-out infinite alternate;
      }

      .hero-motion-shell::before {
        width: 360px;
        height: 360px;
        top: 7rem;
        left: -8rem;
        background: rgba(255, 119, 89, 0.18);
      }

      .hero-motion-shell::after {
        width: 420px;
        height: 420px;
        right: -9rem;
        bottom: 3rem;
        background: rgba(0, 60, 51, 0.14);
        animation-delay: -6s;
      }

      .hero-motion-content {
        position: relative;
        z-index: 1;
      }

      .floating-card {
        animation: float-card 6s ease-in-out infinite;
      }

      .hero-image-zoom img {
        transform: scale(1.03);
        transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .hero-image-zoom:hover img {
        transform: scale(1.08);
      }

      .signify-marquee {
        overflow: hidden;
        mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
      }

      .signify-marquee-track {
        display: flex;
        width: max-content;
        gap: 1rem;
        animation: marquee-left 24s linear infinite;
      }

      .signify-marquee:hover .signify-marquee-track {
        animation-play-state: paused;
      }

      .signify-marquee-item {
        display: inline-flex;
        min-width: 170px;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--cohere-hairline, rgba(23, 23, 28, 0.12));
        border-radius: 999px;
        padding: 0.9rem 1.2rem;
        background: rgba(255, 255, 255, 0.34);
        transition:
          transform 220ms ease,
          background 220ms ease;
      }

      .signify-marquee-item:hover {
        transform: translateY(-3px);
        background: rgba(255, 255, 255, 0.68);
      }

      .sticky-band {
        transform: translate3d(0, var(--parallax-y, 0), 0);
        transition: transform 120ms linear;
        will-change: transform;
      }

      .research-row svg,
      .product-card-animated svg {
        transition: transform 220ms ease;
      }

      .research-row:hover svg,
      .product-card-animated:hover svg {
        transform: translateX(4px);
      }

      .research-row {
        position: relative;
      }

      .research-row::before {
        content: "";
        position: absolute;
        left: 0;
        bottom: -1px;
        height: 1px;
        width: 100%;
        transform: scaleX(0);
        transform-origin: left;
        background: currentColor;
        opacity: 0.35;
        transition: transform 320ms ease;
      }

      .research-row:hover::before {
        transform: scaleX(1);
      }

      @keyframes marquee-left {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(calc(-50% - 0.5rem));
        }
      }

      @keyframes float-card {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-14px);
        }
      }

      @keyframes slow-orbit {
        from {
          transform: translate3d(0, 0, 0) scale(1);
        }
        to {
          transform: translate3d(44px, -28px, 0) scale(1.08);
        }
      }

      @keyframes blink {
        0%, 48% {
          opacity: 1;
        }
        49%, 100% {
          opacity: 0;
        }
      }

      .animate-blink {
        animation: blink 1s step-end infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .scroll-progress {
          display: none;
        }

        [data-animate],
        [data-animate].is-visible,
        .floating-card,
        .signify-marquee-track,
        .hero-motion-shell::before,
        .hero-motion-shell::after {
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
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
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
        element.style.setProperty("--parallax-y", `${distanceFromCenter * speed * -0.12}px`);
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
      }, 48);
      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setText("");
      setPhraseIndex((index) => (index + 1) % phrases.length);
    }, 1600);
    return () => window.clearTimeout(timeoutId);
  }, [phraseIndex, text]);

  return text;
}

function MacSignScannerCard() {
  const text = useTypewriter();

  return (
    <div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[24px] border border-black/8 bg-[#f5f3f6] p-2.5 shadow-[0_18px_54px_rgba(16,16,24,0.08)]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#ff8f7b]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-40 w-40 rounded-full bg-[#8f7bff]/16 blur-3xl" />

      {/* mac shell */}
      <div className="relative overflow-hidden rounded-[20px] border border-black/8 bg-[#0f1015] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {/* top chrome */}
        <div className="flex h-10 items-center justify-between border-b border-white/8 bg-[#15161d] px-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
            SignifyAI · Live recognition
          </div>

          <div className="text-[11px] text-white/35">⌘K</div>
        </div>

        <div className="grid gap-0 lg:h-[min(46vw,480px)] lg:grid-cols-[1.15fr_0.85fr]">
          {/* live camera / scanning panel */}
          <div className="relative min-h-[320px] overflow-hidden border-r border-white/8 bg-[#f4d7cd] md:min-h-[380px] lg:min-h-0">
            <Image
              src="/hero.png"
              alt="Sign language recognition live preview"
              width={1200}
              height={900}
              className="h-full w-full object-contain object-center opacity-[0.92]"
              priority
            />

            {/* glass wash */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)_32%,rgba(0,0,0,0.20)_100%)]" />

            {/* scanning frame */}
            <div className="pointer-events-none absolute inset-6 rounded-[22px] border border-white/12">
              <div className="absolute left-5 top-5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300 backdrop-blur-md">
                Tracking hands
              </div>

              <div className="absolute right-5 top-5 rounded-full border border-white/12 bg-black/25 px-3 py-1 text-[11px] font-medium text-white/75 backdrop-blur-md">
                98.4% confidence
              </div>

              {/* corner brackets */}
              <span className="absolute left-4 top-4 h-8 w-8 rounded-tl-[10px] border-l-2 border-t-2 border-white/80" />
              <span className="absolute right-4 top-4 h-8 w-8 rounded-tr-[10px] border-r-2 border-t-2 border-white/80" />
              <span className="absolute bottom-4 left-4 h-8 w-8 rounded-bl-[10px] border-b-2 border-l-2 border-white/80" />
              <span className="absolute bottom-4 right-4 h-8 w-8 rounded-br-[10px] border-b-2 border-r-2 border-white/80" />

              {/* sign-language landmark dots */}
              <div className="absolute right-[17%] top-[42%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_16px_rgba(137,240,255,0.85)]" />
              <div className="absolute right-[20%] top-[48%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_16px_rgba(137,240,255,0.85)]" />
              <div className="absolute right-[24%] top-[52%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_16px_rgba(137,240,255,0.85)]" />
              <div className="absolute right-[18%] top-[58%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_16px_rgba(137,240,255,0.85)]" />
              <div className="absolute right-[14%] top-[54%] size-2 rounded-full bg-[#89f0ff] shadow-[0_0_16px_rgba(137,240,255,0.85)]" />

              {/* subtle links between points */}
              <span className="absolute right-[18.3%] top-[44.3%] h-[54px] w-px rotate-[28deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/90 to-[#89f0ff]/0" />
              <span className="absolute right-[21.7%] top-[49.2%] h-[44px] w-px rotate-[40deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/80 to-[#89f0ff]/0" />
              <span className="absolute right-[16.4%] top-[50.4%] h-[42px] w-px -rotate-[35deg] bg-gradient-to-b from-[#89f0ff]/0 via-[#89f0ff]/80 to-[#89f0ff]/0" />

              {/* scanning line */}
              <div className="scanline absolute inset-x-5 top-16 h-px bg-gradient-to-r from-transparent via-[#7cf7ff] to-transparent shadow-[0_0_16px_rgba(124,247,255,0.8)]" />

              {/* bottom output bubble */}
              <div className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-white/12 bg-black/38 p-4 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                  Recognized output
                </p>
                <p className="mt-2 text-[22px] font-medium leading-[1.25] text-white">
                  {text}
                  <span className="ml-1 inline-block h-5 w-px animate-blink bg-white/80 align-middle" />
                </p>
              </div>
            </div>
          </div>

          {/* side diagnostic panel */}
          <div className="flex min-h-[320px] flex-col bg-[#111218] p-4 md:min-h-[380px] lg:min-h-0 lg:overflow-hidden">
            <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                Session
              </p>
              <h3 className="mt-1.5 text-[21px] font-medium text-white">
                BISINDO recognition
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.5] text-white/55">
                Real-time camera understanding tuned for hand pose recognition and low-friction output.
              </p>
            </div>

            <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Model</p>
                <p className="mt-1.5 text-[16px] font-medium text-white">YOLOv11 + landmarks</p>
              </div>

              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Latency</p>
                <p className="mt-1.5 text-[16px] font-medium text-white">Sub-second</p>
              </div>

              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">Privacy</p>
                <p className="mt-1.5 text-[16px] font-medium text-white">Local-first</p>
              </div>
            </div>

            <div className="mt-3 rounded-[18px] border border-emerald-400/15 bg-emerald-400/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-300/85">
                  Active intent
                </p>
                <span className="rounded-full bg-emerald-300/12 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                  Live
                </span>
              </div>
              <p className="mt-2.5 text-[16px] font-medium text-white">Translation ready</p>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-white/55">
                Hand gesture sequence has been identified and transformed into natural Indonesian output.
              </p>
            </div>

            <div className="mt-auto hidden pt-3 xl:block">
              <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                    Pipeline
                  </p>
                  <p className="text-[11px] text-white/45">Camera → Detect → Decode → Speak</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    "Frame capture stable",
                    "Hands isolated",
                    "Gesture decoded",
                    "Voice output available",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-white/75" />
                      <span className="text-[12px] text-white/72">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scanline {
          animation: scanner-move 3.2s ease-in-out infinite;
        }

        @keyframes scanner-move {
          0% {
            transform: translateY(0);
            opacity: 0.55;
          }
          50% {
            transform: translateY(250px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="hero-motion-shell bg-cohere-canvas pt-24 md:pt-28">
      <div className="hero-motion-content cohere-container pb-12 pt-8 md:pb-16">
        <div className="mx-auto max-w-5xl text-center">
          {/* hero-display: CohereText, 96px, weight 400, line-height 1 per DESIGN.md */}
          <Reveal delay={90}>
            <h1 className="mt-4 font-display text-[56px] leading-none text-cohere-ink sm:text-[72px] lg:text-[96px]">
              Silent communication, clearly understood.
            </h1>
          </Reveal>
          {/* body-large: Unica77, 18px, weight 400, line-height 1.4 */}
          <Reveal delay={170}>
            <p className="mx-auto mt-5 max-w-2xl text-[18px] leading-[1.4] text-cohere-body-muted">
              A controlled AI workspace for translating Indonesian sign language gestures into
              text and voice without turning accessibility into spectacle.
            </p>
          </Reveal>
          <Reveal delay={250}>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {/* button-primary: near-black pill, 14px Unica77 500, 32px pill radius */}
              <Button asChild size="lg">
                <Link href="/translate" data-arrow-link>
                  Start translating
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {/* button-secondary: text-only, no fill, ink color */}
              <Button asChild variant="secondary">
                <Link href="/how-it-works">Explore the system</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 md:mt-10">
          <MacSignScannerCard />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    /* trust-logo-strip: canvas bg, ink text, caption typography */
    <section className="border-y border-cohere-hairline bg-cohere-canvas py-12 md:py-14">
      <div className="cohere-container text-center">
        {/* caption: Unica77, 14px, weight 400 */}
        <Reveal>
          <p className="text-[14px] text-cohere-body-muted">
            Built for accessibility workflows across learning, research, and everyday communication.
          </p>
        </Reveal>
        <Reveal delay={120} variant="clip">
          <div className="signify-marquee mt-10 text-mono-label text-[12px] text-cohere-ink">
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

function CapabilitySection() {
  return (
    /* capability-card section: canvas bg, ink text */
    <section id="how-it-works" className="bg-cohere-canvas py-16 md:py-24">
      <div className="cohere-container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
          <div>
            <Reveal>
              <p className="text-mono-label text-[12px] text-cohere-slate">Capabilities</p>
            </Reveal>
            {/* section-display: Unica77, 60px, weight 400, line-height 1 */}
            <Reveal delay={90}>
              <h2 className="mt-4 font-display text-[44px] leading-[1.05] text-cohere-ink md:text-[60px]">
                Three quiet steps from gesture to sentence.
              </h2>
            </Reveal>
          </div>
          {/* body-large: 18px, line-height 1.4 */}
          <Reveal delay={150} variant="fade-left" className="lg:justify-self-end">
            <p className="max-w-xl text-[18px] leading-[1.4] text-cohere-body-muted">
              The interface avoids unnecessary chrome: camera, prediction, sentence assembly,
              and speech controls stay visible exactly where the task needs them.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3 md:items-stretch">
          {capabilities.map((item, index) => (
            <article
              key={item.title}
              data-animate="fade-up"
              data-spotlight
              style={motionStyle(index * 110)}
              className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-white/8 bg-white/[0.03] p-6 text-cohere-ink transition-all duration-300 hover:-translate-y-1 hover:border-white/12 hover:bg-white/[0.05] hover:shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
            >
              {/* capability icon: softened square, still restrained */}
              <div className="flex size-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-cohere-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/[0.06]">
                <item.icon className="size-5" />
              </div>
              <p className="mt-6 text-mono-label text-[12px] text-cohere-slate">0{index + 1}</p>
              {/* feature-heading: Unica77, 24px, weight 400, line-height 1.3 */}
              <h3 className="mt-3 text-[24px] leading-[1.3] text-cohere-ink">{item.title}</h3>
              {/* body: 16px, line-height 1.5 */}
              <p className="mt-3 text-[16px] leading-[1.5] text-cohere-body-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DarkFeatureBand() {
  return (
    /* dark-feature-band: deep-green (#003c33) bg, on-dark text, lg radius (22px), 80px padding */
    <section className="bg-cohere-canvas py-16 md:py-24">
      <div className="cohere-container">
        <Reveal variant="scale-in">
          <Card
            variant="hero"
            data-parallax="0.1"
            data-spotlight
            className="sticky-band gap-0 border-transparent bg-cohere-green p-8 text-white md:p-16 lg:p-20"
          >
            <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <p className="text-mono-label text-[12px] text-white/55">Privacy architecture</p>
                {/* section-display: 60px, weight 400 */}
                <h2 className="mt-4 font-display text-[42px] leading-[1.1] md:text-[60px]">
                  Camera work stays controlled.
                </h2>
              </div>
              <div className="grid gap-4">
                {[
                  { icon: Shield, text: "Video frames are processed for the active recognition flow." },
                  { icon: Lock, text: "Saved history stores translated text, not raw camera footage." },
                  { icon: MessageSquare, text: "Users can clear logs and rebuild sentences at any time." },
                ].map((item, index) => (
                  <div
                    key={item.text}
                    data-animate="fade-left"
                    style={motionStyle(index * 90)}
                    className="flex gap-4 border-t border-white/20 pt-4"
                  >
                    <item.icon className="mt-1 size-5 shrink-0 text-white/70" />
                    {/* body-large: 18px, line-height 1.4 */}
                    <p className="text-[18px] leading-[1.4] text-white/80">{item.text}</p>
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

function ProductCards() {
  return (
    /* product-card: soft-stone bg (#eeece7), ink text, sm radius (8px), 32px padding */
    <section id="products" className="scroll-mt-28 bg-cohere-canvas py-16 md:py-24">
      <div className="cohere-container">
        <Reveal>
          <p className="text-mono-label text-[12px] text-cohere-slate">Workspace modules</p>
        </Reveal>
        {/* section-display: 60px */}
        <Reveal delay={90}>
          <h2 className="mt-4 max-w-3xl font-display text-[44px] leading-[1.05] text-cohere-ink md:text-[60px]">
            Product surfaces for translation, practice, and research.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {products.map((product, index) => (
            <Card
              key={product.title}
              asChild
              variant="product"
              data-animate="fade-up"
              data-spotlight
              style={motionStyle(index * 110)}
              className="product-card-animated gap-0 text-cohere-ink"
            >
              <article>
                {/* card-heading: Unica77, 32px, weight 400, line-height 1.2 */}
                <h3 className="text-[32px] leading-[1.2]">{product.title}</h3>
                <p className="mt-5 text-[16px] leading-[1.5] text-cohere-body-muted">{product.body}</p>
                <ul className="mt-8 space-y-3 border-t border-cohere-hairline pt-6">
                  {product.checks.map((check) => (
                    <li key={check} className="flex gap-3 text-[14px] text-cohere-ink">
                      <Check className="mt-0.5 size-4 shrink-0" />
                      {check}
                    </li>
                  ))}
                </ul>
                {/* button-secondary: text-only, no fill */}
                <Button asChild variant="secondary" size="sm" className="mt-8 justify-start">
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

function ResearchRows() {
  const rows = [
    ["Model transparency", "Research", "Updated 2026"],
    ["Known limitations", "Safety", "5 min read"],
    ["BISINDO learning path", "Education", "26 letters"],
  ];

  return (
    /* research-table: canvas bg, ink text, body-large typography, rule-separated rows */
    <section className="bg-cohere-canvas py-16 md:py-24">
      <div className="cohere-container">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <p className="text-mono-label text-[12px] text-cohere-slate">Research table</p>
            </Reveal>
            {/* section-heading: 48px, weight 400 */}
            <Reveal delay={90}>
              <h2 className="mt-4 text-[32px] leading-[1.2] text-cohere-ink md:text-[48px]">
                Learn how the system behaves.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140} variant="fade-left">
            <Button asChild variant="secondary" size="sm">
              <Link href="/research">View all research</Link>
            </Button>
          </Reveal>
        </div>

        <div className="border-t border-cohere-hairline">
          {rows.map(([title, topic, date], index) => (
            <Link
              key={title}
              href="/research"
              data-animate="fade-up"
              data-arrow-link
              style={motionStyle(index * 90)}
              className="research-row grid gap-3 border-b border-cohere-hairline py-6 text-cohere-ink transition-colors hover:bg-cohere-stone/50 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              {/* body-large: 18px, line-height 1.4 */}
              <span className="text-[18px] leading-[1.4]">{title}</span>
              {/* outline badge: hairline border, transparent fill */}
              <Badge variant="outline" className="text-[14px] font-normal text-cohere-slate">
                {topic}
              </Badge>
              <span className="text-[14px] text-cohere-slate">{date}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-cohere-canvas py-16 md:py-24">
      <div className="cohere-container">
        {/* hero-photo-card variant: lg radius (22px), pale-blue bg */}
        <Reveal variant="scale-in">
          <Card
            variant="hero"
            data-spotlight
            className="gap-0 border-transparent bg-surface-tertiary p-8 text-surface-tertiary-foreground md:p-14"
          >
            {/* coral accent label — DESIGN.md: coral for editorial taxonomy and warm accents */}
            <p className="text-mono-label text-[12px] text-cohere-coral">Start a session</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              {/* section-display: 60px, weight 400 */}
              <h2 className="max-w-3xl font-display text-[44px] leading-[1.05] text-surface-tertiary-foreground md:text-[60px]">
                Translate, practice, and review in one calm workspace.
              </h2>
              {/* button-primary: near-black pill */}
              <Button asChild size="lg">
                <Link href="/translate" data-arrow-link>
                  Open SignifyAI
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  useCohereLikeMotion();

  return (
    <div className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <PageMotionStyles />
      <div className="scroll-progress" aria-hidden="true" />
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <TrustStrip />
        <CapabilitySection />
        <DarkFeatureBand />
        <ProductCards />
        <ResearchRows />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
