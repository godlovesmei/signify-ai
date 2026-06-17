"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import AccuracyImprovements from "@/components/features/research/Accuracy-Improvements";
import AIMachineLearning from "@/components/features/research/Ai-Machine-Learning";
import Conclusion from "@/components/features/research/Conclusion";
import HowItWorks from "@/components/features/research/How-It-Works";
import Introduction from "@/components/features/research/Introduction";
import ModelTraining from "@/components/features/research/Model-Training";
import ResearchDevelopment from "@/components/features/research/Research-Development";
import TechnologyBehindIt from "@/components/features/research/Technology-Behind-It";
import UseCases from "@/components/features/research/Use-Cases";
import WhyItMatters from "@/components/features/research/Why-It-Matters";
import type { ResearchSectionKey } from "@/components/features/research/ResearchSectionContent";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import DocumentationHero from "../_components/DocumentationHero";

const researchSections = [
  { id: "introduction", sectionKey: "introduction", Component: Introduction },
  { id: "why-it-matters", sectionKey: "whyItMatters", Component: WhyItMatters },
  { id: "how-it-works", sectionKey: "howItWorks", Component: HowItWorks },
  {
    id: "technology-behind-it",
    sectionKey: "technologyBehindIt",
    Component: TechnologyBehindIt,
  },
  {
    id: "ai-machine-learning",
    sectionKey: "aiMachineLearning",
    Component: AIMachineLearning,
  },
  { id: "model-training", sectionKey: "modelTraining", Component: ModelTraining },
  {
    id: "accuracy-improvements",
    sectionKey: "accuracyImprovements",
    Component: AccuracyImprovements,
  },
  { id: "use-cases", sectionKey: "useCases", Component: UseCases },
  {
    id: "research-development",
    sectionKey: "researchDevelopment",
    Component: ResearchDevelopment,
  },
  { id: "conclusion", sectionKey: "conclusion", Component: Conclusion },
] satisfies Array<{
  id: string;
  sectionKey: ResearchSectionKey;
  Component: ComponentType;
}>;

export default function ResearchPage() {
  const t = useTranslations("docs.research");
  const aboutPoints = t.raw("about.points") as string[];
  const mainRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState(researchSections[0].id);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("article[id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main ref={mainRef} id="main-content" className="pt-24 md:pt-28">
      <DocumentationHero
        eyebrow={t("meta.eyebrow")}
        tone="accent"
        title={t("title")}
        meta={
          <>
            <span>{t("meta.team")}</span>
            <span>{t("meta.category")}</span>
            <span>
              {t("meta.readTime")} · {t("meta.updated")}
            </span>
          </>
        }
      />

      <section
        aria-label={t("contents")}
        className="border-b border-[var(--color-border)] lg:hidden"
      >
        <div className="cohere-container overflow-x-auto py-3">
          <nav className="flex w-max gap-2">
            {researchSections.map((section) => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                aria-current={activeSection === section.id ? "location" : undefined}
                className={[
                  "rounded-xl border px-3 py-1.5 text-[13px] transition-colors",
                  activeSection === section.id
                    ? "border-[var(--color-action)] text-[var(--color-action)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                {t(`sections.${section.sectionKey}.title`)}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="cohere-container grid gap-10 py-14 md:py-16 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_260px] xl:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
              <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                {t("contents")}
              </p>
              <nav aria-label={t("contents")} className="mt-4 border-t border-[var(--color-border)]">
                {researchSections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    aria-current={activeSection === section.id ? "location" : undefined}
                    className={[
                      "block border-b border-l-2 border-b-[var(--color-border)] py-3 pl-3 text-[14px] transition-colors",
                      activeSection === section.id
                        ? "border-l-[var(--color-action)] text-[var(--color-action)]"
                        : "border-l-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                    ].join(" ")}
                  >
                    {t(`sections.${section.sectionKey}.title`)}
                  </Link>
                ))}
              </nav>
          </div>
        </aside>

          <div className="min-w-0">
            <div className="space-y-14 md:space-y-16">
              {researchSections.map(({ id, Component }, index) => (
                <article
                  id={id}
                  key={id}
                  data-animate
                  className={[
                    "scroll-mt-24",
                    index > 0 ? "border-t border-[var(--color-border)] pt-12 md:pt-14" : "",
                  ].join(" ")}
                >
                  <Component />
                </article>
              ))}
            </div>
          </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <Card variant="product" data-animate className="gap-0">
              <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                {t("about.label")}
              </p>
              <h2 className="mt-4 text-[32px] leading-[1.2]">
                {t("about.title")}
              </h2>
              <ul className="mt-6 border-t border-[var(--color-border)] text-[14px] leading-[1.4] text-[var(--color-text-secondary)]">
                {aboutPoints.map((point) => (
                  <li key={point} className="border-b border-[var(--color-border)] py-3">
                    {point}
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" size="sm" className="mt-6 self-start">
                <Link href="/how-it-works">{t("learnHow")}</Link>
              </Button>
            </Card>
          </div>
        </aside>
      </div>
    </main>
  );
}
