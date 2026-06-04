"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import DocumentationHero from "../_components/DocumentationHero";

const researchSections = [
  { id: "introduction", title: "Introduction", Component: Introduction },
  { id: "why-it-matters", title: "Why It Matters", Component: WhyItMatters },
  { id: "how-it-works", title: "How It Works", Component: HowItWorks },
  {
    id: "technology-behind-it",
    title: "Technology Behind It",
    Component: TechnologyBehindIt,
  },
  {
    id: "ai-machine-learning",
    title: "AI & Machine Learning",
    Component: AIMachineLearning,
  },
  { id: "model-training", title: "Model Training", Component: ModelTraining },
  {
    id: "accuracy-improvements",
    title: "Accuracy & Improvements",
    Component: AccuracyImprovements,
  },
  { id: "use-cases", title: "Use Cases", Component: UseCases },
  {
    id: "research-development",
    title: "Research & Development",
    Component: ResearchDevelopment,
  },
  { id: "conclusion", title: "Conclusion", Component: Conclusion },
];

export default function ResearchPage() {
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
    <main ref={mainRef} id="main-content" className="pt-32">
      <DocumentationHero
        eyebrow="Research"
        tone="accent"
        title="What is a real-time sign language translator?"
        meta={
          <>
            <span>Signify Team</span>
            <span>Research &amp; Development</span>
            <span>12 min read · Updated March 2025</span>
          </>
        }
      />

      <section
        aria-label="Research contents"
        className="border-b border-[var(--color-border)] lg:hidden"
      >
        <div className="cohere-container overflow-x-auto py-4">
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
                {section.title}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="cohere-container grid gap-12 py-20 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_260px] xl:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                Contents
              </p>
              <nav aria-label="Research contents" className="mt-5 border-t border-[var(--color-border)]">
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
                    {section.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="space-y-20">
              {researchSections.map(({ id, Component }, index) => (
                <article
                  id={id}
                  key={id}
                  data-animate
                  className={[
                    "scroll-mt-32",
                    index > 0 ? "border-t border-[var(--color-border)] pt-20" : "",
                  ].join(" ")}
                >
                  <Component />
                </article>
              ))}
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-32">
              <Card
                variant="product"
                data-animate
                className="gap-0"
              >
                <p className="text-mono-label text-[12px] text-[var(--color-text-secondary)]">
                  About this research
                </p>
                <h2 className="mt-4 text-[32px] leading-[1.2]">AI for accessibility</h2>
                <ul className="mt-6 border-t border-[var(--color-border)] text-[14px] leading-[1.4] text-[var(--color-text-secondary)]">
                  <li className="border-b border-[var(--color-border)] py-3">
                    Computer vision for gesture recognition
                  </li>
                  <li className="border-b border-[var(--color-border)] py-3">
                    Ethical AI and inclusive design
                  </li>
                  <li className="border-b border-[var(--color-border)] py-3">
                    Community-driven data collection
                  </li>
                </ul>
                <Button asChild variant="secondary" size="sm" className="mt-6 self-start">
                  <Link href="/how-it-works">Learn how it works</Link>
                </Button>
              </Card>
            </div>
          </aside>
      </div>
    </main>
  );
}
