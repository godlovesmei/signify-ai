import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hand } from 'lucide-react';

/* ─── Navbar ──────────────────────────────────────────────────────── */
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
          <Link href="/how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
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

/* ─── Sections data ───────────────────────────────────────────────── */
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
    content: `The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. Signify AI does not warrant that the Service will be uninterrupted, error-free, or completely accurate. Translation accuracy may vary based on lighting, camera quality, and signing speed. The Service is not intended as a substitute for professional interpretation services in critical or legal contexts.`,
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
    content: `If you have any questions about these Terms and Conditions, please contact us at legal@signify.ai or write to: Signify AI Legal Team, [Company Address]. We aim to respond to all inquiries within 5 business days.`,
  },
];

/* ─── Page ────────────────────────────────────────────────────────── */
export default function TermsConditionPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Page Hero */}
      <section className="border-b border-border/50 bg-gradient-to-b from-[var(--surface-tertiary)]/30 to-background py-16">
        <div className="container px-6 md:px-10">
          <Badge className="mb-5 bg-accent/15 text-accent hover:bg-accent/20 border-0">
            Legal
          </Badge>
          <h1 className="max-w-2xl text-5xl font-bold leading-tight text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: <span className="text-foreground font-medium">February 18, 2026</span>
          </p>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Please read these terms carefully before using Signify.ai. By using our service,
            you agree to these conditions.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="container px-6 py-16 md:px-10">
        <div className="flex flex-col gap-10 lg:flex-row">

          {/* Sticky Table of Contents */}
          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-24">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                On this page
              </p>
              <nav className="space-y-1">
                {sections.map(({ id, title }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-primary"
                  >
                    {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 max-w-3xl">
            {/* Intro box */}
            <div className="mb-10 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Summary:</strong> Signify.ai is an
              accessibility-focused translation tool. We don't store your video, we respect
              your privacy, and we aim to be transparent. The full legal details are below.
            </div>

            <div className="space-y-12">
              {sections.map(({ id, title, content }) => (
                <section key={id} id={id} className="scroll-mt-24">
                  <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
                  <p className="leading-relaxed text-muted-foreground">{content}</p>
                  <div className="mt-6 h-px bg-border/50" />
                </section>
              ))}
            </div>

            {/* Bottom contact */}
            <div className="mt-14 rounded-2xl border border-border/60 bg-card p-8 text-center">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Questions about our terms?
              </h3>
              <p className="mb-5 text-sm text-muted-foreground">
                Our team is happy to clarify anything in plain language.
              </p>
              <Button
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                asChild
              >
                <Link href="mailto:legal@signify.ai">Contact Legal Team</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        &copy; 2026 Signify AI. All rights reserved. &middot;{' '}
        <Link href="/how-it-works" className="hover:text-primary transition-colors">
          Documentation
        </Link>
      </footer>
    </div>
  );
}