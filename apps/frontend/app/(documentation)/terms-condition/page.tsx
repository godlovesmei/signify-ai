import Link from "next/link";
import { ChevronRight, FileText, Mail } from "lucide-react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using Signify.ai, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the Service.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `Signify.ai provides an AI-powered sign language translation platform that converts camera-captured gestures into text and synthesized speech.`,
  },
  {
    id: "account",
    title: "3. User Accounts",
    content: `When you create an account, you must provide accurate and current information. You are responsible for account activity and for safeguarding access to your account.`,
  },
  {
    id: "privacy",
    title: "4. Privacy & Data",
    content: `Signify.ai is designed around active-session video processing. Translated text may be stored in local history when users keep session records.`,
  },
  {
    id: "ip",
    title: "5. Intellectual Property",
    content: `The Service, including original content, features, and functionality, remains the property of Signify AI and its licensors.`,
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable Use",
    content: `You agree not to use the Service for unlawful activity, unauthorized access, reverse engineering, automated abuse, or harmful content distribution.`,
  },
  {
    id: "disclaimer",
    title: "7. Disclaimer of Warranties",
    content: `The Service is provided as is. Translation accuracy may vary based on lighting, camera quality, signing speed, and model coverage.`,
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    content: `To the maximum extent permitted by law, Signify AI shall not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the Service.`,
  },
  {
    id: "changes",
    title: "9. Changes to Terms",
    content: `We reserve the right to modify these Terms. Continued use after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    id: "contact",
    title: "10. Contact Us",
    content: `Questions about these Terms can be sent to legal@signify.ai. We aim to respond within 5 business days.`,
  },
];

export default function TermsConditionPage() {
  return (
    <div className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <LandingNavbar />
      <main id="main-content" className="pt-32">
        <section className="border-b border-cohere-hairline py-16 md:py-24">
          <div className="cohere-container">
            <p className="text-mono-label text-[12px] text-cohere-slate">Legal</p>
            <h1 className="mt-5 max-w-4xl font-display text-[52px] leading-none md:text-[72px]">
              Terms &amp; Conditions
            </h1>
            <div className="mt-6 flex flex-wrap gap-4 text-[14px] text-cohere-slate">
              <span>
                Last updated:{" "}
                <time dateTime="2026-02-18" className="text-cohere-ink">
                  February 18, 2026
                </time>
              </span>
              <span>{sections.length} sections</span>
              <span>~5 min read</span>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="cohere-container flex flex-col gap-12 lg:flex-row lg:gap-16">
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-32">
                <div className="mb-5 flex items-center gap-2 text-cohere-slate">
                  <FileText className="size-4" />
                  <p className="text-mono-label text-[12px]">On this page</p>
                </div>
                <nav className="border-t border-cohere-hairline">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block border-b border-cohere-hairline py-3 text-[14px] text-cohere-slate transition-colors hover:text-cohere-ink"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-12 rounded-[22px] border border-cohere-hairline bg-cohere-stone p-6 md:p-8">
                <p className="text-mono-label text-[12px] text-cohere-coral">Plain-language summary</p>
                <p className="mt-4 max-w-3xl text-[16px] leading-[1.5] text-cohere-body-muted">
                  SignifyAI is an accessibility tool. We are transparent about model limits,
                  data handling, and the fact that this product is not a certified interpreter.
                </p>
              </div>

              <div className="border-t border-cohere-hairline">
                {sections.map((section) => (
                  <article
                    id={section.id}
                    key={section.id}
                    className="scroll-mt-32 border-b border-cohere-hairline py-8"
                  >
                    <h2 className="text-[24px] leading-[1.3] text-cohere-ink">{section.title}</h2>
                    <p className="mt-4 text-[16px] leading-[1.6] text-cohere-body-muted">
                      {section.content}
                    </p>
                    {section.id === "privacy" && (
                      <div className="mt-5 border-l border-cohere-green pl-4 text-[14px] leading-[1.5] text-cohere-body-muted">
                        Video privacy is a product boundary, not just a policy.{" "}
                        <Link href="/research" className="text-cohere-blue underline underline-offset-4">
                          Read the research notes.
                        </Link>
                      </div>
                    )}
                    {section.id === "disclaimer" && (
                      <div className="mt-5 border-l border-cohere-coral pl-4 text-[14px] leading-[1.5] text-cohere-body-muted">
                        For legal, medical, or official contexts, use a qualified human interpreter.{" "}
                        <Link href="/how-it-works" className="text-cohere-blue underline underline-offset-4">
                          See limitations.
                        </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="mt-12 flex flex-col gap-6 rounded-[22px] border border-cohere-hairline bg-cohere-canvas p-8 md:flex-row md:items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-cohere-stone">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[24px] leading-[1.3]">Questions about these terms?</h3>
                  <p className="mt-2 text-[14px] leading-[1.5] text-cohere-body-muted">
                    We can explain any section in plain language.
                  </p>
                </div>
                <Button asChild>
                  <Link href="mailto:legal@signify.ai">
                    Contact legal
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
