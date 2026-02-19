'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import {
  ArrowRight,
  Zap,
  Sun,
  Globe,
  Shield,
  Volume2,
  BarChart3,
  Play,
  Camera,
  Hand,
  MessageSquare,
  Lock,
  AlertCircle,
  ChevronRight,
  Eye,
  Server,
  FileWarning,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION HOOK — respects prefers-reduced-motion
   ───────────────────────────────────────────────────────────────────────────── */
function useIntersectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPEWRITER — demo transcript animation
   ───────────────────────────────────────────────────────────────────────────── */
const DEMO_PHRASES = [
  'Hello, my name is Maya.',
  'I need help with my order.',
  'Thank you for understanding.',
  'Where is the nearest exit?',
];

function TypewriterTranscript() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayed(DEMO_PHRASES[phraseIndex]);
      return;
    }

    if (paused) {
      const t = setTimeout(() => {
        setDisplayed('');
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
      setPaused(true);
    }
  }, [charIndex, paused, phraseIndex]);

  return (
    <span className="font-medium text-foreground">
      {displayed}
      <span className="ml-0.5 inline-block h-5 w-0.5 animate-[blink_1s_step-end_infinite] bg-primary align-middle" />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NAVBAR
   ───────────────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* Skip to main content — first focusable element */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:left-4 focus:top-4 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:ring-2 focus:ring-primary-foreground"
      >
        Skip to main content
      </a>

      <header
        role="banner"
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="w-full flex h-20 items-center justify-between px-6 md:px-10">
          <Logo size="lg" />

          {/* Primary nav — purpose-driven links */}
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {[
              { label: 'How It Works', href: '/how-it-works' },
              { label: 'Who It\'s For', href: '#who-its-for' },
              { label: 'Research', href: '/research' },
              { label: 'About', href: '/about' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA — new visitors aren't signed in; lead with value */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="default"
              className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex"
              asChild
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              size="default"
              className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-px"
              asChild
            >
              <Link href="/register">Try Free</Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION REVEAL WRAPPER
   ───────────────────────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useIntersectionReveal();
  return (
    <div
      ref={ref}
      className={[
        'transition-all duration-700',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className,
      ].join(' ')}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="main-content"
      aria-labelledby="hero-heading"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Background photo — contained to right side via gradient mask */}
      <Image
        src="/hero.png"
        alt="Person using sign language in a natural conversation setting"
        fill
        className="object-cover object-center"
        priority
        quality={90}
      />
      {/* Gradient: left side fully readable, right side shows image */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />

      <div className="relative container flex min-h-screen flex-col justify-center px-6 pb-24 pt-36 md:px-10">
        <div className="max-w-[580px]">

          {/* Eyebrow — problem-framing stat, not product boast */}
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:100ms]">
            For 70 million Deaf and Hard of Hearing people worldwide
          </p>

          {/* H1 — empathy-led, describes the frustration */}
          <h1
            id="hero-heading"
            className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-[68px] animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:200ms]"
          >
            Communication
            <br />
            Shouldn&apos;t Require an
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Interpreter in the Room.
            </span>
          </h1>

          {/* Body — plain language, what it does */}
          <p className="mb-10 max-w-[460px] text-lg leading-relaxed text-muted-foreground animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:300ms]">
            Signify translates sign language into spoken words and text in real time — so you
            can be understood anywhere, by anyone, without waiting for help.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:400ms]">
            <Button
              size="lg"
              className="rounded-2xl bg-warning px-8 text-warning-foreground hover:bg-warning/90 shadow-lg shadow-warning/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-warning/30"
              asChild
            >
              <Link href="/translate">Start Translating</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-border/60 px-8 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
              asChild
            >
              <Link href="/how-it-works">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch 60-second Demo
              </Link>
            </Button>
          </div>

          {/* Objection-removal trust line */}
          <p className="mt-7 text-sm text-muted-foreground/80 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:500ms]">
            No account needed to try &nbsp;·&nbsp; Works in your browser &nbsp;·&nbsp; Free to start
          </p>
        </div>

        {/* Live transcript preview — bottom-left floating card */}
        <div className="absolute bottom-12 left-6 max-w-xs rounded-2xl border border-border/50 bg-background/80 p-4 shadow-xl shadow-black/10 backdrop-blur-md md:left-10 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:700ms]">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)] animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Live transcript</span>
          </div>
          <p className="text-sm leading-relaxed">
            <TypewriterTranscript />
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS_STEPS = [
  {
    icon: Camera,
    step: '01',
    title: 'Open Your Camera',
    desc: 'No download. Opens directly in your browser on any device — phone, tablet, or laptop.',
  },
  {
    icon: Hand,
    step: '02',
    title: 'Sign in Front of It',
    desc: 'Our AI reads hand shapes, movement, and position in real time across ASL, BISINDO, and more.',
  },
  {
    icon: MessageSquare,
    step: '03',
    title: 'Signify Speaks for You',
    desc: 'Translated text appears instantly. Enable voice output to have it spoken aloud in natural language.',
  },
];

function HowItWorksSection() {
  return (
    <section aria-labelledby="how-heading" className="py-28 bg-background">
      <div className="container px-6 md:px-10">
        <Reveal>
          {/* Direct heading — no badge decoration */}
          <h2
            id="how-heading"
            className="mb-16 text-4xl font-bold text-foreground md:text-5xl"
          >
            Here&apos;s Exactly How It Works
          </h2>
        </Reveal>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connecting dashed line — desktop only */}
          <div
            aria-hidden="true"
            className="absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px border-t-2 border-dashed border-border/60 md:block"
          />

          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, step, title, desc }, i) => (
            <Reveal key={step} delay={i * 120}>
              <div className="relative flex flex-col gap-5">
                {/* Step number + icon */}
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 hover:bg-primary/20 hover:ring-primary/40">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE DEMO PREVIEW
   ───────────────────────────────────────────────────────────────────────────── */
function DemoPreviewSection() {
  return (
    <section aria-labelledby="demo-heading" className="py-24 bg-muted/20 border-y border-border/40">
      <div className="container px-6 md:px-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              id="demo-heading"
              className="text-4xl font-bold text-foreground md:text-5xl mb-4"
            >
              Try It Without Creating an Account
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience real-time translation before signing up. No personal information required.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* Browser frame mockup */}
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="mx-auto rounded-md border border-border/40 bg-background/60 px-4 py-1 text-xs text-muted-foreground">
                signify.ai/translate
              </div>
            </div>

            {/* Demo body */}
            <div className="grid md:grid-cols-2 min-h-[280px]">
              {/* Camera feed placeholder */}
              <div className="relative flex flex-col items-center justify-center gap-4 border-r border-border/40 bg-muted/30 p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <Camera className="h-9 w-9 text-primary" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Camera feed appears here
                </p>
                <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm border border-border/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              </div>

              {/* Transcript area */}
              <div className="flex flex-col justify-between p-8">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Transcript
                  </p>
                  <div className="min-h-[80px] rounded-xl bg-muted/40 border border-border/30 p-4">
                    <p className="text-sm leading-relaxed">
                      <TypewriterTranscript />
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="mt-6 w-full rounded-xl bg-warning text-warning-foreground hover:bg-warning/90 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-warning/25"
                  asChild
                >
                  <Link href="/translate">
                    Open Signify — it&apos;s free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-5 text-center text-sm text-muted-foreground/70">
            This is a limited preview. Full translation is available after free sign-up. Takes 10 seconds to start.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WHO IT'S FOR
   ───────────────────────────────────────────────────────────────────────────── */
const AUDIENCES = [
  {
    badge: 'Deaf & HoH Community',
    title: 'Communicate Independently in Any Setting',
    desc: 'Whether you\'re at a medical appointment, a job interview, or a coffee shop — Signify lets you be understood on your own terms, without waiting for an interpreter to be arranged.',
    cta: { label: 'See how it helps', href: '/use-cases/deaf-hoh' },
    accent: 'text-primary',
    accentBg: 'bg-primary/8',
    accentBorder: 'border-primary/20',
  },
  {
    badge: 'Sign Language Learners',
    title: 'Practice and Get Instant Feedback',
    desc: 'See your signs translated in real time. Understand where recognition succeeds and where it needs improvement — a study tool that responds to you.',
    cta: { label: 'Start learning', href: '/use-cases/learners' },
    accent: 'text-accent',
    accentBg: 'bg-accent/8',
    accentBorder: 'border-accent/20',
  },
  {
    badge: 'Workplaces & Professionals',
    title: 'Accessible Meetings for Every Team Member',
    desc: 'Remove the logistical barrier of scheduling interpreters for every meeting. Signify works in real time so no one is left waiting or excluded.',
    cta: { label: 'Explore for teams', href: '/use-cases/workplace' },
    accent: 'text-warning',
    accentBg: 'bg-warning/8',
    accentBorder: 'border-warning/20',
  },
];

function WhoItsForSection() {
  return (
    <section id="who-its-for" aria-labelledby="audience-heading" className="py-28 bg-background">
      <div className="container px-6 md:px-10">
        <Reveal>
          <div className="mb-14">
            <Badge className="mb-4 bg-accent/12 text-accent hover:bg-accent/18 border-0 text-xs font-semibold uppercase tracking-wider">
              Built for Real Needs
            </Badge>
            <h2
              id="audience-heading"
              className="text-4xl font-bold text-foreground md:text-5xl"
            >
              Who Uses Signify
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {AUDIENCES.map(({ badge, title, desc, cta, accent, accentBg, accentBorder }, i) => (
            <Reveal key={badge} delay={i * 100}>
              <div
                className={[
                  'group relative flex h-full flex-col justify-between rounded-2xl border p-7 transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-1',
                  accentBorder,
                  accentBg,
                ].join(' ')}
              >
                <div>
                  <span
                    className={[
                      'mb-4 inline-block text-xs font-bold uppercase tracking-widest',
                      accent,
                    ].join(' ')}
                  >
                    {badge}
                  </span>
                  <h3 className="mb-3 text-xl font-bold text-foreground leading-snug">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                <Link
                  href={cta.href}
                  className={[
                    'mt-8 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5',
                    accent,
                  ].join(' ')}
                >
                  {cta.label}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURE DEEP DIVE — alternating rows, not a grid
   ───────────────────────────────────────────────────────────────────────────── */
const FEATURE_ROWS = [
  {
    icon: Sun,
    eyebrow: 'Vision Model',
    title: 'Translate in Any Lighting Condition',
    body: 'Our model is trained across varied environments — dim rooms, outdoor light, mixed skin tones, and different hand sizes. Accuracy should not depend on having a perfect studio setup.',
    visual: 'bg-gradient-to-br from-amber-500/10 to-orange-500/5',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  {
    icon: Globe,
    eyebrow: 'Language Support',
    title: 'ASL, BISINDO, and More — With Community Input',
    body: 'We actively expand language support with native signers involved in the process, not just sourced datasets. If your sign language isn\'t supported yet, you can join the waitlist or contribute.',
    visual: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
  },
  {
    icon: Shield,
    eyebrow: 'Privacy by Design',
    title: 'Your Video Never Leaves Your Device',
    body: 'Sign language is intimate and personal. All processing happens locally in your browser. We have no access to your camera feed, we store no video, and we keep no session logs. This isn\'t a policy — it\'s how the system is built.',
    visual: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
    highlight: true,
  },
];

function FeatureDeepDiveSection() {
  return (
    <section aria-labelledby="features-heading" className="py-28 bg-muted/10 border-y border-border/30">
      <div className="container px-6 md:px-10">
        <Reveal>
          <div className="mb-16">
            <Badge className="mb-4 bg-primary/12 text-primary hover:bg-primary/18 border-0 text-xs font-semibold uppercase tracking-wider">
              Capabilities
            </Badge>
            <h2
              id="features-heading"
              className="max-w-lg text-4xl font-bold text-foreground md:text-5xl"
            >
              What Makes Signify Different
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col gap-14">
          {FEATURE_ROWS.map(({ icon: Icon, eyebrow, title, body, visual, iconColor, iconBg, highlight }, i) => (
            <Reveal key={title} delay={60}>
              <div
                className={[
                  'group grid items-center gap-10 rounded-3xl border border-border/40 p-8 md:p-12 transition-all duration-300 hover:border-border/70 hover:shadow-xl hover:shadow-black/5',
                  i % 2 === 0 ? 'md:grid-cols-[1fr_400px]' : 'md:grid-cols-[400px_1fr]',
                  highlight ? 'ring-1 ring-emerald-500/20' : '',
                  'bg-card',
                ].join(' ')}
              >
                {/* Text — reorder on even/odd */}
                <div className={i % 2 !== 0 ? 'md:order-2' : ''}>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {eyebrow}
                  </span>
                  <h3 className="mb-4 text-2xl font-bold text-foreground leading-snug md:text-3xl">{title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
                </div>

                {/* Visual block */}
                <div
                  className={[
                    'flex h-44 items-center justify-center rounded-2xl',
                    visual,
                    i % 2 !== 0 ? 'md:order-1' : '',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-20 w-20 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                      iconBg,
                    ].join(' ')}
                  >
                    <Icon className={['h-9 w-9', iconColor].join(' ')} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRUST & TRANSPARENCY
   ───────────────────────────────────────────────────────────────────────────── */
const TRUST_PILLARS = [
  {
    icon: Eye,
    title: 'No Cloud Processing',
    desc: 'Your camera feed is processed locally in your browser. It never reaches our servers — or any server.',
  },
  {
    icon: Server,
    title: 'No Video Storage',
    desc: 'Nothing is saved. Ever. We have no server-side logs of your sessions, your signs, or your conversations.',
  },
  {
    icon: FileWarning,
    title: 'Honest About Limitations',
    desc: 'Our model performs best in well-lit environments with clear hand visibility. We document where it falls short — because you deserve to know before you depend on it.',
  },
];

function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="py-28 bg-background">
      <div className="container px-6 md:px-10">
        <Reveal>
          <div className="mb-14 max-w-lg">
            <h2
              id="trust-heading"
              className="text-4xl font-bold text-foreground md:text-5xl mb-4"
            >
              How We Think About Privacy
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              You&apos;re giving us access to your camera. That&apos;s significant. Here is exactly what happens — and what doesn&apos;t.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TRUST_PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-md hover:shadow-black/5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
                  <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                </div>
                <h3 className="mb-2.5 text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMMUNITY VOICES
   ───────────────────────────────────────────────────────────────────────────── */
function CommunityVoicesSection() {
  return (
    <section aria-labelledby="voices-heading" className="py-28 bg-muted/20 border-y border-border/30">
      <div className="container px-6 md:px-10">
        <Reveal>
          <h2
            id="voices-heading"
            className="mb-16 text-4xl font-bold text-foreground md:text-5xl"
          >
            From the People Who Use It
          </h2>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Primary quote — large, prominent */}
          <Reveal className="md:col-span-8" delay={0}>
            <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-10 md:p-12">
              <p className="text-xl leading-relaxed text-foreground md:text-2xl md:leading-relaxed font-medium">
                &ldquo;I used Signify in a job interview. For the first time, I didn&apos;t need to ask if they
                had an interpreter available. I just opened my laptop and it worked.&rdquo;
              </p>
              <footer className="mt-8">
                <p className="text-sm font-semibold text-foreground">Maya R.</p>
                <p className="text-sm text-muted-foreground">Deaf professional, Jakarta</p>
              </footer>
            </blockquote>
          </Reveal>

          {/* Secondary quotes */}
          <div className="flex flex-col gap-6 md:col-span-4">
            <Reveal delay={80}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;As someone learning ASL, getting real-time feedback on whether my signs are
                  being recognized correctly is genuinely useful. Nothing else does this.&rdquo;
                </p>
                <footer className="mt-6">
                  <p className="text-sm font-semibold text-foreground">Daniel K.</p>
                  <p className="text-xs text-muted-foreground">ASL learner, hearing, Seoul</p>
                </footer>
              </blockquote>
            </Reveal>
            <Reveal delay={160}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;We use it in team standups. Our Deaf colleague can contribute in real time
                  without anyone needing to arrange anything in advance.&rdquo;
                </p>
                <footer className="mt-6">
                  <p className="text-sm font-semibold text-foreground">Priya M.</p>
                  <p className="text-xs text-muted-foreground">Engineering manager, Bangalore</p>
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CTA SECTION — soft close
   ───────────────────────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="py-28 bg-background">
      <div className="container px-6 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-10 py-20 text-center md:px-24">
            {/* Subtle decorative glow — not flashy */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-accent/10 blur-2xl translate-x-1/4 translate-y-1/4"
            />

            <div className="relative">
              <h2
                id="cta-heading"
                className="text-4xl font-bold text-primary-foreground md:text-5xl"
              >
                Start a Conversation.
                <br />
                No Interpreter Needed.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg text-primary-foreground/70 leading-relaxed">
                Try Signify free in your browser right now. No download. No credit card. No waiting.
              </p>
              <Button
                size="lg"
                className="mt-10 rounded-2xl bg-warning px-12 text-warning-foreground shadow-2xl shadow-black/20 hover:bg-warning/90 text-base font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                asChild
              >
                <Link href="/translate">
                  Open Signify — it&apos;s free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-primary-foreground/50">
                Takes 10 seconds to start
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="container px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Breaking communication barriers with AI-powered sign language translation.
              Built with and for the Deaf and Hard of Hearing community.
            </p>
          </div>

          {/* Links */}
          {[
            {
              heading: 'Product',
              links: [
                { label: 'How It Works', href: '/how-it-works' },
                { label: 'Who It\'s For', href: '#who-its-for' },
                { label: 'Learn Sign Language', href: '/learn' },
                { label: 'Pricing', href: '/pricing' },
              ],
            },
            {
              heading: 'Company',
              links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Careers', href: '/careers' },
              ],
            },
            {
              heading: 'Legal & Access',
              links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms-condition' },
                { label: 'Accessibility Statement', href: '/accessibility' },
                { label: 'Contact', href: '/contact' },
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-wider text-foreground">
                {heading}
              </h4>
              <ul className="space-y-3.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; 2026 Signify AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link
              href="/accessibility"
              className="hover:text-foreground transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Accessibility Statement
            </Link>
            <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              WCAG 2.1 AA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT PAGE
   ───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/*
        Global keyframes — defined once, used by hero animations and typewriter cursor.
        Add these to your globals.css if you prefer:

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>

      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
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
    </>
  );
}