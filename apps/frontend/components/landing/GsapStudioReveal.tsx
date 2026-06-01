"use client";

import { Camera, Cpu, Shield } from "lucide-react";

export default function GsapStudioReveal() {
  return (
    <section className="bg-cohere-canvas py-20 md:py-28">
      <div className="cohere-container">
        <div className="rounded-[22px] bg-cohere-primary p-8 text-white md:p-16">
          <p className="text-mono-label text-[12px] text-white/55">Product mockup</p>
          <h2 className="mt-4 max-w-3xl font-display text-[44px] leading-[1.05] md:text-[60px]">
            A restrained command surface for real-time interpretation.
          </h2>

          <div className="mt-12 rounded-lg border border-white/15 bg-black/25 p-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <Camera className="size-5 text-white/70" />
                <span className="text-mono-label text-[11px] text-white/55">Vision stream</span>
              </div>
              <span className="rounded-[30px] border border-white/20 px-3 py-1 text-[12px]">
                Active
              </span>
            </div>
            <div className="grid gap-4 py-8 md:grid-cols-3">
              {[
                { icon: Cpu, label: "Inference", value: "On-device loop" },
                { icon: Shield, label: "Data", value: "Session scoped" },
                { icon: Camera, label: "Input", value: "640px capture" },
              ].map((item) => (
                <div key={item.label} className="rounded-sm border border-white/15 p-5">
                  <item.icon className="size-5 text-white/60" />
                  <p className="mt-6 text-mono-label text-[11px] text-white/45">{item.label}</p>
                  <p className="mt-2 text-[18px] leading-[1.4] text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
