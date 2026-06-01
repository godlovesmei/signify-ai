"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LandingNavbar from "@/components/layout/LandingNavbar";
import Footer from "@/components/layout/Footer";
import Introduction from "@/components/features/research/Introduction";
import WhyItMatters from "@/components/features/research/Why-It-Matters";
import HowItWorks from "@/components/features/research/How-It-Works";
import TechnologyBehindIt from "@/components/features/research/Technology-Behind-It";
import AIMachineLearning from "@/components/features/research/Ai-Machine-Learning";
import ModelTraining from "@/components/features/research/Model-Training";
import AccuracyImprovements from "@/components/features/research/Accuracy-Improvements";
import UseCases from "@/components/features/research/Use-Cases";
import ResearchDevelopment from "@/components/features/research/Research-Development";
import Conclusion from "@/components/features/research/Conclusion";

const sections = [
  { id: "introduction", title: "Introduction" },
  { id: "why-it-matters", title: "Why It Matters" },
  { id: "how-it-works", title: "How It Works" },
  { id: "technology-behind-it", title: "Technology Behind It" },
  { id: "ai-machine-learning", title: "AI & Machine Learning" },
  { id: "model-training", title: "Model Training" },
  { id: "accuracy-improvements", title: "Accuracy & Improvements" },
  { id: "use-cases", title: "Use Cases" },
  { id: "research-development", title: "Research & Development" },
  { id: "conclusion", title: "Conclusion" },
];

export default function ResearchPage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const nodes = document.querySelectorAll("article[id]");
    nodes.forEach((node) => observer.observe(node));
    return () => nodes.forEach((node) => observer.unobserve(node));
  }, []);

  return (
    <div className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <LandingNavbar />
      <main className="pt-32">
        <section className="border-b border-cohere-hairline py-16 md:py-24">
          <div className="cohere-container">
            <p className="text-mono-label text-[12px] text-cohere-coral">Research</p>
            <h1 className="mt-5 max-w-4xl font-display text-[52px] leading-none md:text-[72px]">
              What is a real-time sign language translator?
            </h1>
            <div className="mt-8 grid gap-4 border-t border-cohere-hairline pt-5 text-[14px] text-cohere-slate md:grid-cols-3">
              <span>Signify Team</span>
              <span>Research & Development</span>
              <span>12 min read · Updated March 2025</span>
            </div>
          </div>
        </section>

        <div className="cohere-container grid gap-12 py-16 lg:grid-cols-[280px_minmax(0,1fr)_280px] lg:py-20">
          <aside className="hidden lg:block">
            <div className="sticky top-32">
              <p className="text-mono-label text-[12px] text-cohere-slate">Contents</p>
              <nav className="mt-5 border-t border-cohere-hairline">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className={[
                      "block border-b border-cohere-hairline py-3 text-[14px] transition-colors",
                      activeSection === section.id
                        ? "text-cohere-ink"
                        : "text-cohere-slate hover:text-cohere-ink",
                    ].join(" ")}
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="space-y-16">
              <article id="introduction" className="scroll-mt-32">
                <Introduction />
              </article>
              <article id="why-it-matters" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <WhyItMatters />
              </article>
              <article id="how-it-works" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <HowItWorks />
              </article>
              <article id="technology-behind-it" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <TechnologyBehindIt />
              </article>
              <article id="ai-machine-learning" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <AIMachineLearning />
              </article>
              <article id="model-training" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <ModelTraining />
              </article>
              <article id="accuracy-improvements" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <AccuracyImprovements />
              </article>
              <article id="use-cases" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <UseCases />
              </article>
              <article id="research-development" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <ResearchDevelopment />
              </article>
              <article id="conclusion" className="scroll-mt-32 border-t border-cohere-hairline pt-16">
                <Conclusion />
              </article>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-32 rounded-sm bg-cohere-stone p-6">
              <p className="text-mono-label text-[12px] text-cohere-slate">About this research</p>
              <h2 className="mt-4 text-[32px] leading-[1.2]">AI for accessibility</h2>
              <ul className="mt-6 space-y-3 text-[14px] leading-[1.4] text-cohere-body-muted">
                <li>Computer vision for gesture recognition</li>
                <li>Ethical AI and inclusive design</li>
                <li>Community-driven data collection</li>
              </ul>
              <Link
                href="/how-it-works"
                className="mt-8 inline-flex text-[14px] text-cohere-blue underline underline-offset-4"
              >
                Learn how it works
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
