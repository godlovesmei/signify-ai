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
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

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

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <LandingNavbar />
      <main id="main-content" className="pt-32">
        <section className="border-b border-cohere-hairline py-16 md:py-24">
          <div className="cohere-container">
            <p className="text-mono-label text-[12px] text-cohere-slate">How it works</p>
            <h1 className="mt-5 max-w-4xl font-display text-[52px] leading-none md:text-[72px]">
              From camera frame to spoken sentence.
            </h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-[1.4] text-cohere-body-muted">
              A plain-language breakdown of the recognition loop, the sentence builder, and the
              limits users should understand before relying on the tool.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="cohere-container">
            <div className="border-t border-cohere-hairline">
              {steps.map((item) => (
                <article
                  key={item.step}
                  className="grid gap-6 border-b border-cohere-hairline py-8 md:grid-cols-[88px_1fr_1fr] md:items-start"
                >
                  <div>
                    <div className="flex size-12 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-stone">
                      <item.icon className="size-5" />
                    </div>
                    <p className="mt-4 text-mono-label text-[12px] text-cohere-slate">{item.step}</p>
                  </div>
                  <div>
                    <h2 className="text-[32px] leading-[1.2]">{item.title}</h2>
                    <p className="mt-4 max-w-xl text-[16px] leading-[1.5] text-cohere-body-muted">{item.desc}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2 md:justify-end">
                    {item.details.map((detail) => (
                      <li
                        key={detail}
                        className="inline-flex items-center gap-2 rounded-[30px] border border-cohere-hairline px-3 py-1 text-[14px] text-cohere-ink"
                      >
                        <CheckCircle2 className="size-3.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cohere-stone py-16 md:py-24">
          <div className="cohere-container">
            <p className="text-mono-label text-[12px] text-cohere-coral">Honest limitations</p>
            <h2 className="mt-4 max-w-3xl text-[40px] leading-[1.2] md:text-[48px]">
              The product is useful because the boundaries are visible.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {limitations.map((item) => (
                <article key={item.title} className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-6">
                  <item.icon className="size-5 text-cohere-coral" />
                  <h3 className="mt-6 text-[24px] leading-[1.3]">{item.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.5] text-cohere-body-muted">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="cohere-container">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-mono-label text-[12px] text-cohere-slate">FAQ</p>
                <h2 className="mt-4 text-[40px] leading-[1.2] md:text-[48px]">Common questions.</h2>
              </div>
              <div className="border-t border-cohere-hairline">
                {faqs.map(([question, answer]) => (
                  <details key={question} className="group border-b border-cohere-hairline py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px]">
                      {question}
                      <span className="text-cohere-slate transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-4 max-w-2xl text-[16px] leading-[1.5] text-cohere-body-muted">{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="cohere-container">
            <div className="rounded-[22px] bg-cohere-green p-8 text-white md:p-14">
              <p className="text-mono-label text-[12px] text-white/55">Try the workspace</p>
              <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <h2 className="max-w-3xl font-display text-[44px] leading-[1.05] md:text-[60px]">
                  Open a camera session and test the recognition loop.
                </h2>
                <Button asChild size="lg" className="bg-white text-cohere-primary hover:bg-cohere-stone">
                  <Link href="/translate">
                    Start translating
                    <ArrowRight className="size-4" />
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
