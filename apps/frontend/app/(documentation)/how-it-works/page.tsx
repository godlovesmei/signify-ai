import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Hand,
  MessageSquare,
  Shield,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import DocumentationHero from "../_components/DocumentationHero";

const steps = [
  {
    icon: Camera,
    step: "01",
    title: "Open the camera",
    desc: "Signify runs in the browser and requests camera access only for the active session.",
    details: ["Front or rear camera", "No app download", "Responsive workspace"],
  },
  {
    icon: Cpu,
    step: "02",
    title: "Run recognition",
    desc: "The model reads hand shapes frame by frame and produces confidence-scored predictions.",
    details: ["Image preprocessing", "YOLO inference", "Confidence gating"],
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Build a sentence",
    desc: "Confirmed letters are committed into a sentence buffer that can be edited or cleared.",
    details: ["Delete last", "Add spaces", "Export sessions"],
  },
  {
    icon: Volume2,
    step: "04",
    title: "Speak it aloud",
    desc: "Text-to-speech can read generated sentences in Bahasa Indonesia when voice output helps.",
    details: ["Adjustable speed", "Volume control", "Manual playback"],
  },
];

const limitations = [
  {
    icon: AlertTriangle,
    title: "Lighting matters",
    desc: "Very dim or backlit rooms can reduce prediction quality. Keep hands visible and centered.",
  },
  {
    icon: Hand,
    title: "Alphabet scope",
    desc: "This release focuses on BISINDO alphabet recognition rather than full certified interpretation.",
  },
  {
    icon: Shield,
    title: "Not a legal interpreter",
    desc: "Use Signify as a communication aid, not as a certified interpreter for critical contexts.",
  },
];

const faqs = [
  ["What sign languages are supported?", "The workspace focuses on BISINDO alphabet recognition and related learning flows."],
  ["Is my video stored?", "The product is designed around active-session processing. Saved history stores translated text entries."],
  ["What devices work?", "Modern desktop and mobile browsers with camera access are supported."],
  ["How accurate is it?", "Accuracy depends on camera quality, lighting, signing speed, and whether the sign is in the trained scope."],
];

function StepDetailBadge({ detail }: { detail: string }) {
  return (
    <Badge
      variant="outline"
      className="gap-2 border-[var(--color-border)] text-[14px] font-normal normal-case text-[var(--color-text-primary)]"
    >
      <CheckCircle2 className="size-3.5" />
      {detail}
    </Badge>
  );
}

export default function HowItWorksPage() {
  return (
    <main id="main-content" className="pt-32">
      <DocumentationHero
        eyebrow="How it works"
        title="From camera frame to spoken sentence."
        lead="A plain-language breakdown of the recognition loop, the sentence builder, and the limits users should understand before relying on the tool."
      />

      <section className="py-20 md:py-24">
          <div className="cohere-container">
            <div className="border-t border-[var(--color-border)]">
              {steps.map((item) => (
                <article
                  key={item.step}
                  data-animate
                  className="grid gap-6 border-b border-[var(--color-border)] py-8 md:grid-cols-[88px_1fr_1fr] md:items-start"
                >
                  <div>
                    <div className="flex size-12 items-center justify-center rounded-sm border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                      <item.icon className="size-5" />
                    </div>
                    <p className="mt-4 text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                      {item.step}
                    </p>
                  </div>
                  <div>
                    <h2 className="text-[32px] leading-[1.2]">{item.title}</h2>
                    <p className="mt-4 max-w-xl text-[16px] leading-[1.5] text-[var(--color-text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                  <ul className="flex flex-wrap gap-2 md:justify-end">
                    {item.details.map((detail) => (
                      <li key={detail}>
                        <StepDetailBadge detail={detail} />
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
      </section>

      <section className="bg-[var(--color-bg-subtle)] py-20 md:py-24">
          <div className="cohere-container">
            <div data-animate>
              <p className="text-mono-label text-[12px] text-[var(--color-accent)]">
                Honest limitations
              </p>
              <h2 className="mt-4 max-w-3xl text-[40px] leading-[1.2] md:text-[48px]">
                The product is useful because the boundaries are visible.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {limitations.map((item) => (
                <Card
                  key={item.title}
                  asChild
                  data-animate
                  className="gap-0"
                >
                  <article>
                    <item.icon className="size-5 text-[var(--color-accent)]" />
                    <h3 className="mt-6 text-[24px] leading-[1.3]">{item.title}</h3>
                    <p className="mt-3 text-[16px] leading-[1.5] text-[var(--color-text-secondary)]">
                      {item.desc}
                    </p>
                  </article>
                </Card>
              ))}
            </div>
          </div>
      </section>

      <section className="py-20 md:py-24">
          <div className="cohere-container">
            <div data-animate className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                  FAQ
                </p>
                <h2 className="mt-4 text-[40px] leading-[1.2] md:text-[48px]">Common questions.</h2>
              </div>
              <div className="border-t border-[var(--color-border)]">
                {faqs.map(([question, answer]) => (
                  <details
                    key={question}
                    className="group border-b border-[var(--color-border)] py-5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] transition-colors hover:text-[var(--color-action)]">
                      {question}
                      <span
                        aria-hidden="true"
                        className="text-[var(--color-text-secondary)] transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-[16px] leading-[1.5] text-[var(--color-text-secondary)]">
                      {answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
      </section>

      <section className="py-20 md:py-24">
          <div className="cohere-container">
            <Card
              variant="hero"
              data-animate
              className="gap-0 border-transparent bg-[var(--color-bg-product)] p-8 text-[var(--color-text-on-dark)] [--color-bg-inverse:var(--color-text-on-dark)] [--color-text-inverse:var(--color-bg-product)] md:p-14"
            >
              <p className="text-mono-label text-[12px] text-[var(--color-text-on-dark)] opacity-60">
                Try the workspace
              </p>
              <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <h2 className="max-w-3xl text-[44px] leading-[1.05] md:text-[60px]">
                  Open a camera session and test the recognition loop.
                </h2>
                <Button asChild variant="primary" size="lg">
                  <Link href="/translate">
                    Start translating
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
      </section>
    </main>
  );
}
