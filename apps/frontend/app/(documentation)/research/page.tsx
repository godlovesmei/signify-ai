"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Introduction from "./sections/introduction";
import WhyItMatters from "./sections/why-it-matters";
import HowItWorks from "./sections/how-it-works";
import TechnologyBehindIt from "./sections/technology-behind-it";
import AIMachineLearning from "./sections/ai-machine-learning";
import ModelTraining from "./sections/model-training";
import AccuracyImprovements from "./sections/accuracy-improvements";
import UseCases from "./sections/use-cases";
import ResearchDevelopment from "./sections/research-development";
import Conclusion from "./sections/conclusion";

// Buat array untuk mempermudah mapping menu sidebar
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
    // IntersectionObserver mendeteksi elemen mana yang sedang tampil di layar
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Jika elemen memotong area viewport (sedang dibaca), set state-nya
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        // Margin ini memastikan section dianggap "aktif" saat berada di tengah atas layar,
        // bukan baru saat menyentuh piksel teratas browser.
        rootMargin: "-20% 0px -70% 0px",
      }
    );

    // Ambil semua tag <article> yang memiliki ID lalu observasi
    const sections = document.querySelectorAll("article[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-12 gap-10">
        
        {/* LEFT SIDEBAR */}
        <aside className="col-span-3 hidden lg:block">
          <div className="sticky top-24">
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-wide mb-6">
                Sign Language Research
              </h2>

              <nav className="space-y-4 text-sm">
                {SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  
                  return (
                    <Link
                      key={section.id}
                      href={`#${section.id}`}
                      className={`block pl-3 border-l-2 transition ${
                        isActive
                          ? "border-blue-600 text-blue-600 font-medium"
                          : "border-transparent text-gray-600 hover:border-gray-300 hover:text-blue-600"
                      }`}
                    >
                      {section.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="col-span-12 lg:col-span-6">
          
          {/* Author */}
          <div className="mb-8">
            <p className="text-sm text-gray-500">Author</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 rounded-full bg-gray-300" />
              <div>
                <p className="font-medium">Your Name</p>
                <p className="text-sm text-gray-500">
                  Founder, Signify Research
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-light leading-tight mb-8">
            What is a real-time sign language translator?
          </h1>

          {/* PENTING: Atribut id="nama-section" WAJIB ditambahkan di sini
            agar bisa dilacak oleh IntersectionObserver dan target href
          */}
          <article id="introduction">
            <Introduction />
          </article>
          <article id="why-it-matters">
            <WhyItMatters />
          </article>
          <article id="how-it-works">
            <HowItWorks />
          </article>
          <article id="technology-behind-it">
            <TechnologyBehindIt />
          </article>
          <article id="ai-machine-learning">
            <AIMachineLearning />
          </article>
          <article id="model-training">
            <ModelTraining />
          </article>
          <article id="accuracy-improvements">
            <AccuracyImprovements />
          </article>
          <article id="use-cases">
            <UseCases />
          </article>
          <article id="research-development">
            <ResearchDevelopment />
          </article>
          <article id="conclusion">
            <Conclusion />
          </article>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="col-span-3 hidden lg:block">
          <div className="bg-gray-50 p-6 rounded-xl border">
            <p className="text-sm text-gray-500 uppercase mb-2">
              Research Focus
            </p>
            <h3 className="text-xl font-semibold mb-4">
              AI for Accessibility
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Exploring computer vision, machine learning and ethical AI
              approaches for inclusive communication technologies.
            </p>
            <Link
              href="/about"
              className="text-blue-600 font-medium hover:underline"
            >
              Learn about Signify →
            </Link>
          </div>
        </aside>

      </div>
    </div>
  );
}