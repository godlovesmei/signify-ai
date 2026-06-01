"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import GsapStudioReveal from "@/components/landing/GsapStudioReveal";
import { GlowCard } from "@/components/landing/GlowCard";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { MagneticButton } from "@/components/landing/MagneticButton";
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
  Fingerprint,
  Radio,
  ScanEye,
} from "lucide-react";

import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATION CONFIG — Apple Spring (Taktile & Responsive)
   ═══════════════════════════════════════════════════════════════════════════ */

const APPLE_SPRING = {
  type: "spring",
  stiffness: 260,
  damping: 30,
  mass: 1,
};

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...APPLE_SPRING,
      delay: delay / 1000,
    },
  }),
};

/** Reveal wrapper — smooth spring fade-up on scroll */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={FADE_UP}
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container for child reveals */
function RevealStagger({
  children,
  staggerDelay = 0.1,
  className = "",
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Stagger item — must be child of RevealStagger */
function RevealItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: APPLE_SPRING,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
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
      }, 1800);
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
   HERO — Cohere Stark & Precise
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section 
      ref={containerRef}
      aria-label="Hero" 
      className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-cohere-canvas"
    >
      {/* Subtle Hairline Grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: "radial-gradient(var(--cohere-hairline) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      
      {/* Very subtle focal glow */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[-10%] left-[-5%] -z-10 size-[600px] rounded-full bg-cohere-stone blur-[120px] opacity-50"
      />
      
      <motion.div style={{ opacity }} className="mx-auto w-[92%] max-w-[1400px] grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-24 md:pt-32 lg:pt-40">
        <div className="relative z-10 text-center lg:text-left">
          <Reveal delay={100}>
            <div className="mb-6 md:mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-cohere-stone border border-cohere-hairline">
              <Sparkles className="size-3 text-cohere-ink" />
              <span className="text-mono-label !text-[10px] text-cohere-ink">Signify AI v2.0</span>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <h1 className="mb-6 md:mb-8 text-5xl font-display font-medium tracking-tight text-cohere-ink sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-[0.95]">
              Silent <br />
              <span className="text-cohere-slate">vividly</span> <br />
              understood.
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="mb-8 md:mb-12 mx-auto lg:mx-0 max-w-[520px] text-lg md:text-xl leading-relaxed text-cohere-muted font-medium tracking-tight text-unica-ui">
              Menerjemahkan BISINDO secara presisi melalui kamera. Teknologi cerdas dengan antarmuka yang tenang, menghadirkan inklusi dalam setiap interaksi.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-5">
              <Link href="/translate" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="h-14 md:h-16 rounded-sm px-10 md:px-12 text-sm md:text-base bg-cohere-ink text-cohere-canvas hover:bg-neutral-800 transition-colors w-full font-bold" 
                >
                  Mulai Deteksi
                  <ArrowUpRight className="ml-1 size-4 md:size-5" />
                </Button>
              </Link>
              
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 md:h-16 rounded-sm px-10 md:px-12 text-sm md:text-base border-cohere-hairline bg-cohere-canvas hover:bg-cohere-stone text-cohere-ink transition-colors w-full font-bold" 
                >
                  Pelajari Teknologi
                </Button>
              </Link>
            </div>
          </Reveal>

          {/* Micro-bar */}
          <Reveal delay={600}>
            <div className="mt-10 md:mt-14 flex items-center justify-center lg:justify-start gap-6 text-mono-label !text-[9px] text-cohere-muted">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="size-3" /> Privasi Dulu
              </span>
              <span className="w-1 h-px bg-cohere-hairline" />
              <span className="flex items-center gap-1.5">
                <Radio className="size-3" /> Real-time
              </span>
              <span className="w-1 h-px bg-cohere-hairline" />
              <span className="flex items-center gap-1.5">
                <ScanEye className="size-3" /> AI Lokal
              </span>
            </div>
          </Reveal>
        </div>

        {/* Device Frame */}
        <div className="relative hidden lg:block">
          <Reveal delay={600} className="relative z-20">
            <div className="relative rounded-md border border-cohere-hairline bg-cohere-canvas p-1 shadow-2xl">
              <div className="aspect-[4/3] relative rounded-sm overflow-hidden bg-cohere-stone">
                {/* Hairline grid */}
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(var(--cohere-hairline)_1px,transparent_1px),linear-gradient(90deg,var(--cohere-hairline)_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {/* Hand */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Hand className="size-44 text-cohere-ink opacity-10" />
                </div>

                {/* UI Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <div className="rounded-md border border-cohere-hairline bg-cohere-canvas p-6 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-2 rounded-full bg-cohere-ink" />
                      <span className="text-mono-label !text-[9px] text-cohere-muted">Live Processing</span>
                    </div>
                    <div className="text-xl md:text-2xl font-medium text-cohere-ink tracking-tight flex items-center text-unica-ui">
                      <TypewriterTranscript />
                    </div>
                  </div>
                </div>

                {/* Accuracy Badge */}
                <div className="absolute top-6 right-6">
                  <div className="rounded-full px-4 py-1.5 bg-cohere-ink text-cohere-canvas flex items-center gap-2">
                    <span className="text-mono-label !text-[9px]">99.2% accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS — With connected timeline and glow cards
   ═══════════════════════════════════════════════════════════════════════════ */
const HOW_IT_WORKS_STEPS = [
  {
    icon: Camera,
    title: "Buka Kamera",
    desc: "Akses instan di browser. Tanpa aplikasi, tanpa hambatan.",
    color: "var(--cohere-ink)",
  },
  {
    icon: Hand,
    title: "Berisyarat",
    desc: "AI mengenali bentuk tangan BISINDO secara real-time.",
    color: "var(--cohere-ink)",
  },
  {
    icon: MessageSquare,
    title: "Terjemahkan",
    desc: "Lihat teks hasil terjemahan dan dengarkan suaranya.",
    color: "var(--cohere-ink)",
  },
];

function HowItWorksSection() {
  const containerRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Cards entrance
    gsap.from(".how-it-works-card", {
      y: 80,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 75%",
      }
    });

    // Connecting line draw
    if (lineRef.current) {
      gsap.fromTo(lineRef.current, 
        { scaleX: 0 },
        { 
          scaleX: 1, 
          duration: 1.5, 
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          }
        }
      );
    }
  }, { scope: containerRef });

  return (
    <section ref={containerRef} id="how-it-works" className="relative py-24 md:py-40 overflow-hidden bg-cohere-canvas">
      {/* Section divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[92%] max-w-[1400px] h-px bg-cohere-hairline" />
      
      <div className="mx-auto w-[92%] max-w-[1400px]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 md:gap-20 mb-16 md:mb-24">
          <Reveal>
            <div className="mb-4 inline-flex items-center gap-2 px-2 py-0.5 rounded-sm border border-cohere-hairline text-mono-label !text-[10px] text-cohere-muted">
              Workflow
            </div>
            <h2 className="text-4xl xs:text-5xl font-display font-medium tracking-tight text-cohere-ink sm:text-6xl md:text-7xl lg:text-8xl">
              Tiga Langkah <br /> 
              Sederhana.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="max-w-[420px] text-base md:text-lg text-cohere-muted font-medium leading-relaxed text-unica-ui">
              Kami merancang proses sesingkat mungkin agar teknologi ini dapat langsung membantu komunikasi Anda.
            </p>
          </Reveal>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-cohere-hairline -z-10 overflow-hidden">
            <div ref={lineRef} className="absolute inset-0 bg-cohere-ink origin-left" />
          </div>

          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <div 
              key={step.title}
              className="how-it-works-card group relative flex flex-col items-center text-center p-8 bg-cohere-stone border border-cohere-hairline rounded-sm transition-all hover:border-cohere-slate"
            >
              <div className="mb-8 flex size-20 items-center justify-center rounded-sm bg-cohere-canvas border border-cohere-hairline text-cohere-ink transition-transform group-hover:scale-105">
                <step.icon className="size-8" strokeWidth={1} />
              </div>
              
              <h3 className="mb-4 text-2xl font-display font-medium text-cohere-ink">
                {step.title}
              </h3>
              <p className="text-cohere-muted font-medium text-unica-ui">
                {step.desc}
              </p>
              
              {/* Sequence Number */}
              <div className="absolute top-4 right-4 text-mono-label !text-[10px] text-cohere-hairline group-hover:text-cohere-slate transition-colors">
                0{i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
          <div 
            ref={lineRef}
            className="absolute top-[4.5rem] left-[16%] right-[16%] h-px bg-gradient-to-r from-primary/30 via-accent/30 to-highlight/30 hidden md:block origin-left"
          />

          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, desc, color }, i) => (
            <div key={title} className="how-it-works-card h-full">
              <GlowCard 
                className="h-full p-8 md:p-10" 
                glowColor={color}
              >
                <div className="mb-6 md:mb-8 flex size-14 md:size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/10">
                  <Icon className="size-6 md:size-7" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 md:mb-4 text-xl md:text-2xl font-bold tracking-tight text-foreground">{title}</h3>
                <p className="text-sm md:text-base text-muted-foreground/80 font-medium leading-relaxed tracking-tight">{desc}</p>
                <div className="absolute top-8 md:top-10 right-8 md:right-10 text-4xl md:text-5xl font-black text-foreground/[0.03] dark:text-white/[0.03]">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </GlowCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WHO IT'S FOR — Cohere Bento Grid
   ═══════════════════════════════════════════════════════════════════════════ */
const AUDIENCES = [
  {
    title: "Komunitas Tuli",
    desc: "Berkomunikasi mandiri di dokter, kantor, atau kafe. Ungkapkan dirimu tanpa hambatan.",
    icon: MessageSquare,
    size: "large",
  },
  {
    title: "Siswa SLB",
    desc: "Latihan BISINDO dengan umpan balik visual instan.",
    icon: GraduationCap,
    size: "small",
  },
  {
    title: "Peneliti AI",
    desc: "Akses data koordinat landmark dan skor konfidensi.",
    icon: FlaskConical,
    size: "small",
  },
  {
    title: "Masyarakat Umum",
    desc: "Pelajari alfabet isyarat dasar dari nol.",
    icon: BookOpen,
    size: "medium",
  },
];

function WhoItsForSection() {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden bg-cohere-canvas">
      {/* Subtle border bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92%] max-w-[1400px] h-px bg-cohere-hairline" />

      <div className="mx-auto w-[92%] max-w-[1400px]">
        <Reveal className="mb-14 md:mb-20">
          <div className="mb-4 inline-flex items-center gap-2 px-2 py-0.5 rounded-sm border border-cohere-hairline text-mono-label !text-[10px] text-cohere-muted">
            Audiens
          </div>
          <h2 className="text-4xl xs:text-5xl font-display font-medium tracking-tight text-cohere-ink sm:text-6xl md:text-7xl">
            Inklusivitas untuk <br /> 
            Setiap Individu.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {AUDIENCES.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "group relative border border-cohere-hairline bg-cohere-stone p-8 flex flex-col justify-between transition-all hover:bg-cohere-canvas",
                item.size === "large" ? "sm:col-span-2 sm:row-span-2 min-h-[420px]" : "min-h-[300px]",
                item.size === "medium" ? "sm:col-span-2" : ""
              )}
            >
              <div>
                <div className="mb-6 flex size-12 items-center justify-center bg-cohere-ink text-cohere-canvas rounded-sm">
                  <item.icon className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className={cn(
                  "font-display font-medium tracking-tight text-cohere-ink", 
                  item.size === "large" ? "text-4xl md:text-5xl" : "text-xl md:text-2xl"
                )}>
                  {item.title}
                </h3>
              </div>
              
              <div className="mt-8">
                <p className={cn(
                  "text-cohere-muted font-medium tracking-tight leading-relaxed text-unica-ui",
                  item.size === "large" ? "text-lg max-w-[440px]" : "text-base max-w-[320px]"
                )}>
                  {item.desc}
                </p>
                <div className="mt-6 flex items-center gap-2 text-mono-label !text-[10px] text-cohere-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="size-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRUST — Cohere Privacy Focus
   ═══════════════════════════════════════════════════════════════════════════ */
function TrustSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from(".trust-item", {
      x: -40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
      }
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative py-24 md:py-40 overflow-hidden bg-cohere-canvas">
      <div className="mx-auto w-[92%] max-w-[1400px]">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
          <div>
            <Reveal>
              <div className="mb-4 inline-flex items-center gap-2 px-2 py-0.5 rounded-sm border border-cohere-hairline text-mono-label !text-[10px] text-cohere-muted">
                Keamanan
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-display font-medium tracking-tight mb-6 md:mb-8 text-cohere-ink">
                Privasi Anda <br /> Adalah Janji Kami.
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-cohere-muted font-medium max-w-[500px] mb-10 md:mb-14 leading-relaxed text-unica-ui">
                Kamera Anda diproses secara lokal di browser. Tidak ada data video yang meninggalkan perangkat Anda. Pernah.
              </p>
            </Reveal>
            
            <div className="flex flex-col gap-5 md:gap-6">
              {[
                { icon: Shield, text: "Data lokal, tanpa cloud." },
                { icon: Lock, text: "Enkripsi end-to-end pada sesi chat." },
                { icon: Eye, text: "Transparansi penuh pada algoritma." },
              ].map((item, i) => (
                <div key={i} className="trust-item flex items-center gap-4 md:gap-5 text-base md:text-lg font-medium text-cohere-ink text-unica-ui">
                  <div className="size-10 md:size-12 rounded-sm border border-cohere-hairline bg-cohere-stone flex items-center justify-center text-cohere-ink shadow-sm">
                    <item.icon className="size-4 md:size-5" strokeWidth={1.5} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          
          <Reveal delay={300}>
            <div className="relative aspect-square max-w-[520px] mx-auto lg:mr-0 rounded-md border border-cohere-hairline bg-cohere-canvas p-8 md:p-14 overflow-hidden shadow-2xl">
               {/* Background pattern */}
               <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,var(--cohere-ink)_1px,transparent_1px),linear-gradient(-45deg,var(--cohere-ink)_1px,transparent_1px)] bg-[size:30px_30px]" />
               </div>
               
               <div className="relative z-10 h-full flex flex-col justify-center text-center">
                 <div className="mb-2">
                   <span className="text-7xl sm:text-8xl md:text-[130px] font-display font-medium leading-none tracking-tighter text-cohere-ink">
                     <AnimatedCounter target={100} suffix="%" duration={2.5} />
                   </span>
                 </div>
                 <div className="text-lg md:text-xl font-medium tracking-tight text-cohere-muted text-unica-ui">
                   On-Device Processing.
                 </div>
                 <div className="mt-8 flex justify-center gap-2">
                   <div className="h-1 w-12 rounded-full bg-cohere-ink" />
                   <div className="h-1 w-12 rounded-full bg-cohere-hairline" />
                   <div className="h-1 w-12 rounded-full bg-cohere-stone" />
                 </div>
               </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA — Cohere Bold
   ═══════════════════════════════════════════════════════════════════════════ */
function CtaSection() {
  return (
    <section className="relative py-28 md:py-48 overflow-hidden bg-cohere-canvas border-t border-cohere-hairline">
      <div className="mx-auto w-[92%] max-w-[1100px] text-center relative z-10">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-cohere-hairline text-mono-label !text-[10px] text-cohere-muted">
            Mulai Sekarang
          </div>
          <h2 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-medium tracking-tight text-cohere-ink mb-10 md:mb-14">
            Speak with <br />
            freedom.
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/translate" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="h-16 md:h-20 rounded-sm px-12 md:px-16 text-lg md:text-xl font-bold bg-cohere-ink text-cohere-canvas hover:bg-neutral-800 transition-colors w-full" 
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            
            <Link href="/auth" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 md:h-20 rounded-sm px-12 md:px-16 text-lg md:text-xl font-bold border-cohere-hairline bg-cohere-canvas hover:bg-cohere-stone text-cohere-ink transition-colors w-full" 
              >
                Masuk Akun
              </Button>
            </Link>
          </div>
          
          <p className="mt-10 md:mt-14 text-mono-label !text-[10px] text-cohere-muted">
            Bekerja di Chrome, Safari, dan Edge. Tanpa unduhan.
          </p>
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
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <GsapStudioReveal />
        <HowItWorksSection />
        <WhoItsForSection />
        <TrustSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}