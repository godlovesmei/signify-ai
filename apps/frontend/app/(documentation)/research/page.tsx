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
export default function ResearchPage() {
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
        <Link href="#introduction" className="block pl-3 border-l-2 border-blue-600 text-blue-600 font-medium">
          Introduction
        </Link>

        <Link href="#why-it-matters" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Why It Matters
        </Link>

        <Link href="#how-it-works" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          How It Works
        </Link>

        <Link href="#technology-behind-it" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Technology Behind It
        </Link>

        <Link href="#ai-machine-learning" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          AI & Machine Learning
        </Link>

        <Link href="#model-training" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Model Training
        </Link>

        <Link href="#accuracy-improvements" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Accuracy & Improvements
        </Link>

        <Link href="#use-cases" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Use Cases
        </Link>

        <Link href="#research-development" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Research & Development
        </Link>

        <Link href="#conclusion" className="block pl-3 border-l-2 border-transparent hover:border-gray-300 hover:text-blue-600 transition">
          Conclusion
        </Link>
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

          {/* Article */}
        <article>
            <Introduction />
        </article>
        <article>
            <WhyItMatters />
        </article>
        <article>
            <HowItWorks />
        </article>
        <article>
            <TechnologyBehindIt />
        </article>
        <article>
            <AIMachineLearning />
        </article>
        <article>
            <ModelTraining />
        </article>
        <article>
            <AccuracyImprovements />
        </article>
        <article>
            <UseCases />
        </article>
        <article>
            <ResearchDevelopment />
        </article>
        <article>
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
