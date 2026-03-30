'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';

import {
  Camera,
  Cpu,
  MessageSquare,
  Volume2,
  ArrowRight,
  Hand,
  CheckCircle2,
  Zap,
  ChevronRight,
  Shield,
  Globe,
  AlertTriangle,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION HOOK — respects prefers-reduced-motion
   ───────────────────────────────────────────────────────────────────────────── */
function useIntersectionReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

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
   DATA
   ───────────────────────────────────────────────────────────────────────────── */
const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Open Your Camera',
    desc: 'No app download required. Signify runs in any modern browser on desktop, tablet, or phone. Your camera feed stays on your device — it never reaches our servers.',
    details: [
      '720p or higher recommended',
      'Works indoors and outdoors',
      'Front or rear camera supported',
    ],
    color: 'text-blue-500',
    colorBg: 'bg-blue-500/10',
    colorRing: 'ring-blue-500/20',
    colorHover: 'group-hover:bg-blue-500/15 group-hover:ring-blue-500/30',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Sign in Front of It',
    desc: 'Our vision model reads hand shapes, positions, and movement in real time — frame by frame. It handles varied lighting, mixed skin tones, and different hand sizes without needing a perfect environment.',
    details: [
      'Landmark detection per frame',
      'Multi-sign sequence recognition',
      'Adapts to varied lighting',
    ],
    color: 'text-violet-500',
    colorBg: 'bg-violet-500/10',
    colorRing: 'ring-violet-500/20',
    colorHover: 'group-hover:bg-violet-500/15 group-hover:ring-violet-500/30',
  },
  {
    icon: MessageSquare,
    step: '03',
    title: 'Signify Translates',
    desc: 'Recognized signs are instantly mapped to words and phrases. The translation engine handles context and grammar to produce natural, readable text — not just individual sign labels.',
    details: [
      'Contextual phrase completion',
      'ASL and BISINDO support',
      'Continuous sentence building',
    ],
    color: 'text-emerald-500',
    colorBg: 'bg-emerald-500/10',
    colorRing: 'ring-emerald-500/20',
    colorHover: 'group-hover:bg-emerald-500/15 group-hover:ring-emerald-500/30',
  },
  {
    icon: Volume2,
    step: '04',
    title: 'Hear It Spoken Aloud',
    desc: 'Translated text converts to natural-sounding speech via our built-in TTS engine. Enable voice output so your words are heard — not just read — by anyone around you.',
    details: [
      'Natural prosody and rhythm',
      'Multiple voice options',
      'Adjustable speed and pitch',
    ],
    color: 'text-amber-500',
    colorBg: 'bg-amber-500/10',
    colorRing: 'ring-amber-500/20',
    colorHover: 'group-hover:bg-amber-500/15 group-hover:ring-amber-500/30',
  },
];

const faqs = [
  {
    q: 'What sign languages are supported?',
    a: 'Signify currently supports American Sign Language (ASL) and Indonesian Sign Language (BISINDO). We are actively working to expand to British Sign Language (BSL) and other regional systems, with input from native signers throughout the process.',
  },
  {
    q: 'Is my video stored anywhere?',
    a: 'No. All video processing happens locally in your browser or in an ephemeral session — we do not store, log, or share any video footage. This is not just a policy: it is how the system is architecturally built.',
  },
  {
    q: 'What devices work with Signify?',
    a: 'Signify runs in any modern browser on desktop, tablet, or smartphone. No installation required. A front-facing camera with at least 720p resolution provides the best results.',
  },
  {
    q: 'How accurate is the translation?',
    a: 'Our models achieve 95%+ accuracy on standard ASL and BISINDO vocabularies under good lighting conditions. Accuracy varies with lighting quality, camera resolution, and signing speed. We document known limitations openly rather than overselling performance.',
  },
  {
    q: 'Can I use it in a professional or medical setting?',
    a: 'Signify is a communication aid, not a certified interpretation service. For legal, medical, or official contexts requiring certified accuracy, we recommend using Signify alongside a qualified interpreter. We are transparent about where our model performs best.',
  },
  {
    q: 'Is an offline mode available?',
    a: 'A lightweight offline mode is on our roadmap. Currently, an internet connection is required for full model inference. We will notify users when this changes.',
  },
];

const limitations = [
  {
    icon: AlertTriangle,
    title: 'Lighting Matters',
    desc: 'Performance degrades in very dim or heavily backlit environments. Well-lit conditions facing your hands give the best results.',
  },
  {
    icon: Globe,
    title: 'Not All Sign Languages Yet',
    desc: 'We support ASL and BISINDO today. Other sign languages are in development. If yours is missing, you can join the waitlist.',
  },
  {
    icon: Shield,
    title: 'Not a Legal Interpreter',
    desc: 'Signify is a communication aid. For certified legal, medical, or official interpretation, a qualified human interpreter remains the right choice.',
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Page Hero ─────────────────────────────────────────────── */}
      <section
        id="main-content"
        aria-labelledby="page-heading"
        className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-background pt-40 pb-20"
      >
        <div className="w-full px-6 md:px-10">
          <Badge className="mb-5 bg-accent/12 text-accent hover:bg-accent/18 border-0 text-xs font-semibold uppercase tracking-wider">
            How It Works
          </Badge>
          <h1
            id="page-heading"
            className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl"
          >
            From Sign to Speech —{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              in Under 200ms
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            A plain-language explanation of what happens when you use Signify — step by step,
            with no technical jargon required.
          </p>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground font-medium">How It Works</span>
          </nav>
        </div>
      </section>

      <main>
        {/* ── Steps ─────────────────────────────────────────────────── */}
        <section aria-labelledby="steps-heading" className="py-28">
          <div className="w-full px-6 md:px-10">
            <Reveal>
              <h2 id="steps-heading" className="mb-14 text-3xl font-bold text-foreground md:text-4xl">
                The Four Steps
              </h2>
            </Reveal>

            <div className="relative space-y-5">
              {/* Vertical connector line — desktop */}
              <div
                aria-hidden="true"
                className="absolute left-[53px] top-14 bottom-14 hidden w-px border-l-2 border-dashed border-border/50 md:block"
              />

              {steps.map(({ icon: Icon, step, title, desc, details, color, colorBg, colorRing, colorHover }, i) => (
                <Reveal key={step} delay={i * 80}>
                  <div className="group flex flex-col gap-8 rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-black/5 md:flex-row md:items-start">

                    {/* Step indicator */}
                    <div className="flex shrink-0 items-center gap-4 md:flex-col md:items-center md:w-[68px] md:text-center">
                      <div
                        className={[
                          'relative flex h-[54px] w-[54px] items-center justify-center rounded-2xl ring-1 transition-all duration-300 bg-background z-10',
                          colorBg,
                          colorRing,
                          colorHover,
                        ].join(' ')}
                      >
                        <Icon className={['h-6 w-6 transition-colors', color].join(' ')} aria-hidden="true" />
                        <span className={[
                          'absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
                          colorBg.replace('/10', '/80'),
                        ].join(' ')}>
                          {i + 1}
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-border/40 group-hover:text-border/60 transition-colors md:mt-2 md:text-2xl">
                        {step}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="mb-3 text-xl font-bold text-foreground">{title}</h3>
                      <p className="mb-6 text-base leading-relaxed text-muted-foreground">{desc}</p>
                      <ul className="flex flex-wrap gap-2.5" role="list">
                        {details.map((d) => (
                          <li
                            key={d}
                            className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/40 px-4 py-1.5 text-sm text-foreground"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Honest Limitations ────────────────────────────────────── */}
        <section
          aria-labelledby="limitations-heading"
          className="border-y border-border/40 bg-muted/15 py-24"
        >
          <div className="w-full px-6 md:px-10">
            <Reveal>
              <div className="mb-12 max-w-lg">
                <Badge className="mb-4 bg-amber-500/12 text-amber-600 hover:bg-amber-500/18 border-0 text-xs font-semibold uppercase tracking-wider">
                  Honest About Limitations
                </Badge>
                <h2 id="limitations-heading" className="text-3xl font-bold text-foreground md:text-4xl">
                  Where Signify Works Best — and Where It Doesn&apos;t
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  We believe you deserve to know this before depending on it.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-3">
              {limitations.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-7 transition-all duration-300 hover:border-amber-500/30 hover:shadow-md">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12">
                      <Icon className="h-5 w-5 text-amber-600" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2.5 text-base font-bold text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Performance Benchmarks ────────────────────────────────── */}
        <section aria-labelledby="benchmarks-heading" className="py-24">
          <div className="w-full px-6 md:px-10">
            <Reveal>
              <div className="mb-12">
                <h2 id="benchmarks-heading" className="text-3xl font-bold text-foreground md:text-4xl">
                  Performance Benchmarks
                </h2>
                <p className="mt-3 text-base text-muted-foreground">
                  Measured under standard conditions. Results may vary — see limitations above.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'End-to-End Latency', value: '<200ms', sub: 'Under good conditions', icon: Zap, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { label: 'Sign Recognition Accuracy', value: '95.4%', sub: 'Standard ASL/BISINDO vocabulary', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Supported Signs (ASL)', value: '1,200+', sub: 'Actively expanding', icon: Hand, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Uptime', value: '99.9%', sub: '30-day rolling average', icon: Camera, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map(({ label, value, sub, icon: Icon, color, bg }, i) => (
                <Reveal key={label} delay={i * 60}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-md hover:shadow-black/5">
                    <div className={['flex h-10 w-10 items-center justify-center rounded-xl', bg].join(' ')}>
                      <Icon className={['h-5 w-5', color].join(' ')} aria-hidden="true" />
                    </div>
                    <div>
                      <div className={['text-4xl font-bold', color].join(' ')}>{value}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section
          aria-labelledby="faq-heading"
          className="border-t border-border/40 bg-muted/15 py-24"
        >
          <div className="w-full px-6 md:px-10">
            <Reveal>
              <div className="mb-12 max-w-lg">
                <Badge className="mb-4 bg-primary/12 text-primary hover:bg-primary/18 border-0 text-xs font-semibold uppercase tracking-wider">
                  FAQ
                </Badge>
                <h2 id="faq-heading" className="text-3xl font-bold text-foreground md:text-4xl">
                  Common Questions
                </h2>
              </div>
            </Reveal>

            <div className="max-w-3xl space-y-3">
              {faqs.map(({ q, a }, i) => (
                <Reveal key={q} delay={i * 40}>
                  <details className="group rounded-2xl border border-border/50 bg-card open:border-primary/30 transition-colors duration-200">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-7 py-5 text-base font-semibold text-foreground select-none">
                      {q}
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm transition-transform duration-200 group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="border-t border-border/40 px-7 pb-6 pt-5 text-sm leading-relaxed text-muted-foreground">
                      {a}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <section aria-labelledby="cta-heading" className="py-24">
          <div className="w-full px-6 md:px-10">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-primary px-10 py-20 text-center md:px-24">
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
                    Ready to experience it?
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-lg text-primary-foreground/70 leading-relaxed">
                    Open Signify in your browser right now. No account required to try.
                  </p>
                  <Button
                    variant="warning"
                    size="lg"
                    className="mt-10 rounded-2xl px-12 text-base font-bold shadow-2xl shadow-black/20"
                    asChild
                  >
                    <Link href="/translate">
                      Open Signify — it&apos;s free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="mt-4 text-sm text-primary-foreground/50">Takes 10 seconds to start</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}