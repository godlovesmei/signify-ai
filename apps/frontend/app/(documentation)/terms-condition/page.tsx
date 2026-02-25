'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ChevronRight, FileText, Mail } from 'lucide-react';

function useIntersectionReveal(threshold = 0.1) {
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
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className,
      ].join(' ')}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;

      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });

    return () => observers.forEach((o) => o?.disconnect());
  }, [ids]);

  return activeId;
}

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using Signify.ai ("the Service"), you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: `Signify.ai provides an AI-powered, real-time sign language translation platform that converts sign language gestures captured via camera into text and synthesized speech. The Service is designed to facilitate communication for the Deaf and Hard of Hearing (DHH) community and their interlocutors.`,
  },
  {
    id: 'account',
    title: '3. User Accounts',
    content: `When you create an account, you must provide accurate, complete, and current information. You are responsible for safeguarding your password and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use. Signify AI reserves the right to terminate accounts, remove content, or cancel services at our sole discretion.`,
  },
  {
    id: 'privacy',
    title: '4. Privacy & Data',
    content: `Signify.ai processes video frames locally or in ephemeral sessions to perform translation. We do not store, retain, or share your video footage. Translated text may be temporarily cached in your session for continuity but is not persisted to our servers unless you explicitly save your history. Please review our Privacy Policy for full details on data handling.`,
  },
  {
    id: 'ip',
    title: '5. Intellectual Property',
    content: `The Service and its original content, features, and functionality are and will remain the exclusive property of Signify AI and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Signify AI. You retain ownership of any content you create using the Service.`,
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use',
    content: `You agree not to use the Service to: (a) engage in any unlawful activity; (b) transmit harmful, threatening, or discriminatory content; (c) attempt to gain unauthorized access to any portion of the Service; (d) reverse-engineer, decompile, or attempt to extract source code; (e) use automated scripts to access the Service in a way that could harm its performance or availability.`,
  },
  {
    id: 'disclaimer',
    title: '7. Disclaimer of Warranties',
    content: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. Signify AI does not warrant that the Service will be uninterrupted, error-free, or completely accurate. Translation accuracy may vary based on lighting conditions, camera quality, and signing speed. The Service is not intended as a substitute for professional interpretation services in critical or legal contexts.`,
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, Signify AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of or inability to use the Service. Our total liability for any claims under these Terms shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    id: 'changes',
    title: '9. Changes to Terms',
    content: `We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or a prominent notice within the Service. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.`,
  },
  {
    id: 'contact',
    title: '10. Contact Us',
    content: `If you have any questions about these Terms and Conditions, please contact us at legal@signify.ai. We aim to respond to all inquiries within 5 business days.`,
  },
];

const sectionIds = sections.map((s) => s.id);

function TableOfContents() {
  const activeId = useActiveSection(sectionIds);

  return (
    <aside aria-label="Table of contents" className="hidden lg:block lg:w-64 shrink-0">
      <div className="sticky top-28">
        <div className="mb-5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            On this page
          </p>
        </div>
        <nav aria-label="Section navigation">
          <ul className="space-y-0.5" role="list">
            {sections.map(({ id, title }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={[
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all duration-150',
                    activeId === id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  ].join(' ')}
                  aria-current={activeId === id ? 'location' : undefined}
                >
                  {activeId === id && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  )}
                  <span className={activeId === id ? '' : 'ml-3.5'}>{title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default function TermsConditionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section
        id="main-content"
        aria-labelledby="page-heading"
        className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-background pt-40 pb-16"
      >
        <div className="w-full px-6 md:px-10">
          <Badge className="mb-5 bg-muted text-muted-foreground hover:bg-muted border-0 text-xs font-semibold uppercase tracking-wider">
            Legal
          </Badge>
          <h1
            id="page-heading"
            className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl"
          >
            Terms &amp; Conditions
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span>
              Last updated:{' '}
              <time dateTime="2026-02-18" className="font-semibold text-foreground">
                February 18, 2026
              </time>
            </span>
            <span className="hidden md:block h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span>{sections.length} sections</span>
            <span className="hidden md:block h-1 w-1 rounded-full bg-border" aria-hidden="true" />
            <span>~5 min read</span>
          </div>

          <nav aria-label="Breadcrumb" className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground font-medium">Terms &amp; Conditions</span>
          </nav>
        </div>
      </section>

      <div className="w-full px-6 py-16 md:px-10">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">

          <TableOfContents />

          <main className="flex-1 min-w-0">

            <Reveal>
              <div className="mb-12 rounded-2xl border border-primary/20 bg-primary/5 p-7">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                  Plain-Language Summary
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  Signify.ai is an accessibility tool. We don&apos;t store your video. We respect your
                  privacy by design, not just by policy. We&apos;re honest about what the service
                  can and can&apos;t do. The full legal terms are below — but if something is
                  unclear, please reach out and we&apos;ll explain it in plain language.
                </p>
              </div>
            </Reveal>

            <div className="space-y-0">
              {sections.map(({ id, title, content }, i) => (
                <Reveal key={id} delay={i * 30}>
                  <article
                    id={id}
                    className="scroll-mt-28 border-b border-border/40 py-10 last:border-0"
                  >
                    <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
                    <p className="text-base leading-relaxed text-muted-foreground">{content}</p>

                    {id === 'privacy' && (
                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 mt-1.5" aria-hidden="true" />
                        <p>
                          This is a foundational commitment, not just a legal statement. All video
                          processing is architecturally designed to stay local.{' '}
                          <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:no-underline">
                            Read our full Privacy Policy.
                          </Link>
                        </p>
                      </div>
                    )}

                    {id === 'disclaimer' && (
                      <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-400">
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 mt-1.5" aria-hidden="true" />
                        <p>
                          Signify is a communication aid, not a certified interpreter. For legal,
                          medical, or official contexts, a qualified human interpreter remains the
                          appropriate choice.{' '}
                          <Link href="/how-it-works#limitations" className="font-semibold underline underline-offset-2 hover:no-underline">
                            See our limitations documentation.
                          </Link>
                        </p>
                      </div>
                    )}
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={80}>
              <div className="mt-12 flex flex-col items-center gap-6 rounded-2xl border border-border/50 bg-card p-10 text-center md:flex-row md:text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    Questions about these terms?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We&apos;re happy to explain anything in plain language. No legal jargon in our replies.
                  </p>
                </div>
                <Button
                  className="shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-6 transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-primary/20"
                  asChild
                >
                  <Link href="mailto:legal@signify.ai">
                    Contact Legal Team
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}