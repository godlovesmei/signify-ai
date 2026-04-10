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

const SECTIONS = [
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
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const sections = document.querySelectorAll("article[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-32 pb-16 grid grid-cols-12 gap-8">
          <aside className="col-span-3 hidden lg:block">
            <div className="sticky top-28">
              <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-medium tracking-wide text-muted-foreground mb-2">
                  Sign Language Research
                </h2>
                <p className="text-xs text-muted-foreground/60 mb-6">10 articles</p>

                <nav className="space-y-1 text-sm">
                  {SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <Link
                        key={section.id}
                        href={`#${section.id}`}
                        className={`group relative block px-3 py-2 rounded-md transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full" />
                        )}
                        <span className="ml-2">{section.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          <main className="col-span-12 lg:col-span-6 mt-8 lg:mt-12">
            <h1 className="text-5xl lg:text-6xl font-light tracking-tight leading-tight mb-6">
              What is a real-time sign language translator?
            </h1>

            <div className="flex items-center justify-between border-b border-border/40 pb-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                  S
                </div>
                <div>
                  <p className="font-medium text-foreground">Signify Team</p>
                  <p className="text-sm text-muted-foreground">
                    Research &amp; Development
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                12 min read · Updated March 2025
              </div>
            </div>

            <div className="space-y-20">
              <article id="introduction" className="scroll-mt-28">
                <Introduction />
              </article>
              <hr className="border-gray-100" />
              <article id="why-it-matters" className="scroll-mt-28">
                <WhyItMatters />
              </article>
              <hr className="border-gray-100" />
              <article id="how-it-works" className="scroll-mt-28">
                <HowItWorks />
              </article>
              <hr className="border-gray-100" />
              <article
                id="technology-behind-it"
                className="scroll-mt-28"
              >
                <TechnologyBehindIt />
              </article>
              <hr className="border-gray-100" />
              <article id="ai-machine-learning" className="scroll-mt-28">
                <AIMachineLearning />
              </article>
              <hr className="border-gray-100" />
              <article id="model-training" className="scroll-mt-28">
                <ModelTraining />
              </article>
              <hr className="border-gray-100" />
              <article
                id="accuracy-improvements"
                className="scroll-mt-28"
              >
                <AccuracyImprovements />
              </article>
              <hr className="border-gray-100" />
              <article id="use-cases" className="scroll-mt-28">
                <UseCases />
              </article>
              <hr className="border-gray-100" />
              <article
                id="research-development"
                className="scroll-mt-28"
              >
                <ResearchDevelopment />
              </article>
              <hr className="border-gray-100" />
              <article id="conclusion" className="scroll-mt-28">
                <Conclusion />
              </article>
            </div>
          </main>

          <aside className="col-span-3 hidden lg:block">
            <div className="sticky top-28">
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  About this research
                </p>
                <h3 className="text-2xl font-light text-foreground mb-4">
                  AI for Accessibility
                </h3>

                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-primary text-lg leading-5">•</span>
                    <span>
                      Computer vision for real-time gesture recognition
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary text-lg leading-5">•</span>
                    <span>Ethical AI and inclusive design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary text-lg leading-5">•</span>
                    <span>Community-driven data collection</span>
                  </li>
                </ul>

                <p className="text-sm text-muted-foreground mb-6">
                  Supported by 5 research partners across academia and
                  non-profits.
                </p>

                <Link
                  href="/about"
                  className="inline-block w-full text-center px-4 py-2 border border-border/60 rounded-lg text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors duration-200"
                >
                  Learn about Signify →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
}