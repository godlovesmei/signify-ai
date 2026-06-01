"use client";

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
import { Button } from "@/components/ui/button";

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

function AgentConsoleCard() {
  const text = useTypewriter();

  return (
    <div className="rounded-lg bg-cohere-primary p-5 text-white md:p-6">
      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <div>
          <p className="text-mono-label text-[11px] text-white/50">Agent console</p>
          <h2 className="mt-2 text-[24px] leading-[1.3]">BISINDO interpreter</h2>
        </div>
        <div className="rounded-[32px] border border-white/20 px-3 py-1 text-[12px] text-white">
          Live
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Model", "Latency", "Privacy"].map((label, index) => (
          <div key={label} className="rounded-sm border border-white/12 p-3">
            <p className="text-mono-label text-[10px] text-white/45">{label}</p>
            <p className="mt-2 text-[14px] text-white">
              {index === 0 ? "YOLOv11" : index === 1 ? "Sub-second" : "Local-first"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-sm border border-white/15 bg-black/25 p-4">
        <p className="text-mono-label text-[10px] text-white/45">Generated response</p>
        <p className="mt-3 min-h-8 text-[18px] leading-[1.4] text-white">
          {text}
          <span className="ml-1 inline-block h-5 w-px animate-blink bg-white align-middle" />
        </p>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="bg-cohere-canvas pt-36 md:pt-40">
      <div className="cohere-container pb-20 pt-12 md:pb-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-mono-label text-[12px] text-cohere-slate">SignifyAI for BISINDO</p>
          <h1 className="mt-5 font-display text-[56px] leading-none text-cohere-ink sm:text-[72px] lg:text-[96px]">
            Silent communication, clearly understood.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-[18px] leading-[1.4] text-cohere-body-muted">
            A controlled AI workspace for translating Indonesian sign language gestures into
            text and voice without turning accessibility into spectacle.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/translate">
                Start translating
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Link
              href="/how-it-works"
              className="text-[16px] text-cohere-ink underline underline-offset-4 transition-colors hover:text-cohere-blue"
            >
              Explore the system
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <AgentConsoleCard />
          <div className="overflow-hidden rounded-[22px] bg-cohere-stone">
            <Image
              src="/hero.png"
              alt="SignifyAI BISINDO translation interface preview"
              width={900}
              height={700}
              priority
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-cohere-hairline bg-cohere-canvas py-16">
      <div className="cohere-container text-center">
        <p className="text-[14px] text-cohere-body-muted">
          Built for accessibility workflows across learning, research, and everyday communication.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-8 text-mono-label text-[12px] text-cohere-ink sm:grid-cols-4">
          <span>Community</span>
          <span>Education</span>
          <span>Research</span>
          <span>Public Access</span>
        </div>
      </div>
    </section>
  );
}

function CapabilitySection() {
  return (
    <section id="how-it-works" className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
          <div>
            <p className="text-mono-label text-[12px] text-cohere-slate">Capabilities</p>
            <h2 className="mt-4 font-display text-[44px] leading-[1.05] text-cohere-ink md:text-[60px]">
              Three quiet steps from gesture to sentence.
            </h2>
          </div>
          <p className="max-w-xl text-[18px] leading-[1.4] text-cohere-body-muted lg:justify-self-end">
            The interface avoids unnecessary chrome: camera, prediction, sentence assembly,
            and speech controls stay visible exactly where the task needs them.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {capabilities.map((item, index) => (
            <article key={item.title} className="border-t border-cohere-hairline pt-6">
              <div className="flex size-12 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-stone text-cohere-ink">
                <item.icon className="size-5" />
              </div>
              <p className="mt-8 text-mono-label text-[12px] text-cohere-slate">0{index + 1}</p>
              <h3 className="mt-3 text-[24px] leading-[1.3] text-cohere-ink">{item.title}</h3>
              <p className="mt-4 text-[16px] leading-[1.5] text-cohere-body-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DarkFeatureBand() {
  return (
    <section className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <div className="rounded-[22px] bg-cohere-green p-8 text-white md:p-16 lg:p-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-mono-label text-[12px] text-white/55">Privacy architecture</p>
              <h2 className="mt-4 font-display text-[42px] leading-[1.1] md:text-[60px]">
                Camera work stays controlled.
              </h2>
            </div>
            <div className="grid gap-4">
              {[
                { icon: Shield, text: "Video frames are processed for the active recognition flow." },
                { icon: Lock, text: "Saved history stores translated text, not raw camera footage." },
                { icon: MessageSquare, text: "Users can clear logs and rebuild sentences at any time." },
              ].map((item) => (
                <div key={item.text} className="flex gap-4 border-t border-white/20 pt-4">
                  <item.icon className="mt-1 size-5 shrink-0 text-white/70" />
                  <p className="text-[18px] leading-[1.4] text-white/80">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCards() {
  return (
    <section className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <p className="text-mono-label text-[12px] text-cohere-slate">Workspace modules</p>
        <h2 className="mt-4 max-w-3xl font-display text-[44px] leading-[1.05] text-cohere-ink md:text-[60px]">
          Product surfaces for translation, practice, and research.
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.title} className="rounded-sm bg-cohere-stone p-8 text-cohere-ink">
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
              <Link
                href={product.href}
                className="mt-8 inline-flex items-center gap-2 text-[14px] text-cohere-ink underline underline-offset-4 hover:text-cohere-blue"
              >
                Open module <ArrowRight className="size-4" />
              </Link>
            </article>
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
    <section className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-mono-label text-[12px] text-cohere-slate">Research table</p>
            <h2 className="mt-4 text-[32px] leading-[1.2] text-cohere-ink md:text-[48px]">
              Learn how the system behaves.
            </h2>
          </div>
          <Link href="/research" className="text-[14px] text-cohere-blue underline underline-offset-4">
            View all research
          </Link>
        </div>

        <div className="border-t border-cohere-hairline">
          {rows.map(([title, topic, date]) => (
            <Link
              key={title}
              href="/research"
              className="grid gap-3 border-b border-cohere-hairline py-6 text-cohere-ink transition-colors hover:bg-cohere-stone/50 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <span className="text-[18px] leading-[1.4]">{title}</span>
              <span className="w-fit rounded-[30px] border border-cohere-hairline px-3 py-1 text-[14px] text-cohere-slate">
                {topic}
              </span>
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
    <section className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <div className="rounded-[22px] bg-cohere-pale-blue p-8 md:p-14">
          <p className="text-mono-label text-[12px] text-cohere-coral">Start a session</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <h2 className="max-w-3xl font-display text-[44px] leading-[1.05] text-cohere-ink md:text-[60px]">
              Translate, practice, and review in one calm workspace.
            </h2>
            <Button asChild size="lg">
              <Link href="/translate">
                Open SignifyAI
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cohere-canvas text-cohere-ink">
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
