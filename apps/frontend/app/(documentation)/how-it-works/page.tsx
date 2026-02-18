import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Camera,
  Cpu,
  MessageSquare,
  Volume2,
  ArrowRight,
  Hand,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/* ─── Shared Nav (same as homepage) ──────────────────────────────── */
function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-6 md:px-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
            <Hand className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Signify<span className="text-primary">.ai</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/how-it-works" className="text-sm font-medium text-primary">
            Documentation
          </Link>
        </nav>
        <Button variant="outline" size="sm" className="rounded-xl border-border/60" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    </header>
  );
}

/* ─── Steps data ──────────────────────────────────────────────────── */
const steps = [
  {
    icon: Camera,
    step: '01',
    title: 'Capture',
    desc: 'Your device camera captures your hand gestures in real time. Signify.ai works with any standard webcam or phone camera — no special hardware needed.',
    details: ['720p or higher resolution recommended', 'Works indoors & outdoors', 'Supports both hands'],
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Analyze',
    desc: 'Our deep learning models process each video frame, identifying hand shapes, positions, and movement trajectories to recognize signs with 95%+ accuracy.',
    details: ['Computer vision + landmark detection', 'Edge-optimized inference', 'Multi-sign sequence recognition'],
  },
  {
    icon: MessageSquare,
    step: '03',
    title: 'Translate',
    desc: 'Recognized signs are instantly mapped to words and phrases. The translation engine handles context and grammar to produce natural, readable text output.',
    details: ['Contextual phrase completion', 'ASL & BISINDO support', 'Continuous sentence building'],
  },
  {
    icon: Volume2,
    step: '04',
    title: 'Speak',
    desc: 'Translated text is converted to natural-sounding speech via our TTS engine, enabling seamless two-way communication between signing and hearing individuals.',
    details: ['Natural prosody & rhythm', 'Multiple voice options', 'Adjustable speed & pitch'],
  },
];

const faqs = [
  {
    q: 'What sign languages are supported?',
    a: 'Signify.ai currently supports American Sign Language (ASL) and Indonesian Sign Language (BISINDO). We are actively expanding to include British Sign Language (BSL) and more regional systems.',
  },
  {
    q: 'Is my video stored anywhere?',
    a: 'No. All video processing happens locally or in an ephemeral session — we do not store, log, or share any video footage. Privacy is a foundational principle, not an afterthought.',
  },
  {
    q: 'What devices are supported?',
    a: 'Signify.ai runs in any modern browser on desktop, tablet, or smartphone. No installation required. A front-facing camera with at least 720p resolution provides the best results.',
  },
  {
    q: 'How accurate is the translation?',
    a: 'Our models achieve 95%+ accuracy on standard ASL and BISINDO vocabularies. Accuracy can vary based on lighting conditions, camera quality, and signing speed.',
  },
  {
    q: 'Can I use it offline?',
    a: 'A lightweight offline mode is on our roadmap. Currently, an internet connection is required for full model inference.',
  },
];

/* ─── Page ────────────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Page Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-border/50 bg-gradient-to-b from-[var(--surface-tertiary)]/30 to-background py-20">
        <div className="container px-6 md:px-10">
          <Badge className="mb-5 bg-accent/15 text-accent hover:bg-accent/20 border-0">
            Documentation
          </Badge>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight text-foreground md:text-6xl">
            How Signify.ai{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            A step-by-step breakdown of how Signify.ai transforms sign language gestures into
            text and speech in under 200 milliseconds.
          </p>
        </div>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container px-6 md:px-10">
          <div className="space-y-6">
            {steps.map(({ icon: Icon, step, title, desc, details }, i) => (
              <div
                key={step}
                className="group flex flex-col gap-8 rounded-2xl border border-border/60 bg-card p-8 transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 md:flex-row md:items-start"
              >
                {/* Step number + icon */}
                <div className="flex shrink-0 items-center gap-5 md:flex-col md:items-center md:w-28 md:text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-accent/15">
                    <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-accent" />
                  </div>
                  <span className="text-4xl font-bold text-border/60 group-hover:text-accent/30 transition-colors">
                    {step}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="mb-3 text-xl font-semibold text-foreground">{title}</h3>
                  <p className="mb-5 leading-relaxed text-muted-foreground">{desc}</p>
                  <ul className="flex flex-wrap gap-3">
                    {details.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-1.5 text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Performance specs ─────────────────────────────────────── */}
      <section className="border-y border-border/50 bg-muted/30 py-16">
        <div className="container px-6 md:px-10">
          <h2 className="mb-10 text-2xl font-bold text-foreground">Performance Benchmarks</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'End-to-End Latency', value: '<200ms', icon: Zap },
              { label: 'Sign Recognition Accuracy', value: '95.4%', icon: CheckCircle2 },
              { label: 'Supported Signs (ASL)', value: '1,200+', icon: Hand },
              { label: 'Uptime SLA', value: '99.9%', icon: Camera },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border-border/60">
                <CardHeader className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary">{value}</div>
                  <CardDescription className="text-sm">{label}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container px-6 md:px-10">
          <div className="mb-12 max-w-lg">
            <Badge className="mb-4 bg-accent/15 text-accent hover:bg-accent/20 border-0">FAQ</Badge>
            <h2 className="text-4xl font-bold text-foreground">Common Questions</h2>
          </div>
          <div className="max-w-3xl space-y-4">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-border/60 bg-card open:border-accent/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 font-medium text-foreground">
                  {q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="border-t border-border/50 px-6 pb-6 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="container px-6 md:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-10 py-14 text-center">
            <div className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
                Ready to experience it firsthand?
              </h2>
              <p className="mt-3 text-primary-foreground/70">
                No sign-up required to try a live demo.
              </p>
              <Button
                size="lg"
                className="mt-7 rounded-2xl bg-warning px-8 text-warning-foreground hover:bg-warning/90 shadow-lg shadow-black/20"
                asChild
              >
                <Link href="/translate">
                  Try Signify.ai Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        &copy; 2026 Signify AI. All rights reserved. &middot;{' '}
        <Link href="/terms-condition" className="hover:text-primary transition-colors">
          Terms
        </Link>
      </footer>
    </div>
  );
}