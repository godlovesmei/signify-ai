import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import DocumentationHero from "../_components/DocumentationHero";
import { buildPageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return buildPageMetadata({
    locale,
    pathname: "/how-it-works",
    title: t("pages.howItWorks.title"),
    description: t("pages.howItWorks.description"),
    keywords: t.raw("keywords") as string[],
    imageAlt: t("imageAlt"),
  });
}

type HowItWorksStep = {
  step: string;
  title: string;
  desc: string;
  details: string[];
};

type HowItWorksLimitation = {
  title: string;
  desc: string;
};

type HowItWorksFaq = {
  question: string;
  answer: string;
};

const stepIcons: LucideIcon[] = [Camera, Cpu, MessageSquare, Volume2];
const limitationIcons: LucideIcon[] = [AlertTriangle, Hand, Shield];

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
  const t = useTranslations("docs.howItWorks");
  const steps = (t.raw("steps") as HowItWorksStep[]).map((step, index) => ({
    ...step,
    icon: stepIcons[index] ?? Camera,
  }));
  const limitations = (t.raw("limitations") as HowItWorksLimitation[]).map(
    (limitation, index) => ({
      ...limitation,
      icon: limitationIcons[index] ?? AlertTriangle,
    }),
  );
  const faqs = t.raw("faqs") as HowItWorksFaq[];

  return (
    <main id="main-content" className="pt-24 md:pt-28">
      <DocumentationHero
        eyebrow={t("title")}
        title={t("title")}
        lead={t("lead")}
      />

      <section className="py-16 md:py-20">
          <div className="cohere-container">
            <div className="border-t border-[var(--color-border)]">
              {steps.map((item) => (
                <article
                  key={item.step}
                  data-animate
                  className="grid gap-5 border-b border-[var(--color-border)] py-6 md:grid-cols-[88px_1fr_1fr] md:items-start"
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

      <section className="bg-[var(--color-bg-subtle)] py-16 md:py-20">
          <div className="cohere-container">
            <div data-animate>
              <p className="text-mono-label text-[12px] text-[var(--color-accent)]">
                {t("limitationsLabel")}
              </p>
              <h2 className="mt-4 max-w-3xl text-[40px] leading-[1.2] md:text-[48px]">
                {t("limitationsTitle")}
              </h2>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
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

      <section className="py-16 md:py-20">
          <div className="cohere-container">
            <div data-animate className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                  {t("faqLabel")}
                </p>
                <h2 className="mt-4 text-[40px] leading-[1.2] md:text-[48px]">
                  {t("faqTitle")}
                </h2>
              </div>
              <div className="border-t border-[var(--color-border)]">
                {faqs.map(({ question, answer }) => (
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

      <section className="py-16 md:py-20">
          <div className="cohere-container">
            <Card
              variant="hero"
              data-animate
              className="gap-0 border-transparent bg-[var(--color-bg-product)] p-7 text-[var(--color-text-on-dark)] [--color-bg-inverse:var(--color-text-on-dark)] [--color-text-inverse:var(--color-bg-product)] md:p-12"
            >
              <p className="text-mono-label text-[12px] text-[var(--color-text-on-dark)] opacity-60">
                {t("ctaLabel")}
              </p>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <h2 className="max-w-3xl text-[44px] leading-[1.05] md:text-[60px]">
                  {t("ctaTitle")}
                </h2>
                <Button asChild variant="primary" size="lg">
                  <Link href="/translate">
                    {t("ctaButton")}
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
