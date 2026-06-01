"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { Camera, Zap, Shield, Sparkles, Scan, Eye, Cpu } from "lucide-react";
import { motion } from "motion/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function GsapStudioReveal() {
  const container = useRef<HTMLDivElement>(null);
  const videoMockRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const floatingOrbsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Initial Entrance
    gsap.from(".reveal-up", {
      y: 80,
      opacity: 0,
      duration: 1.4,
      stagger: 0.25,
      ease: "power4.out",
      scrollTrigger: {
        trigger: container.current,
        start: "top 85%",
      }
    });

    // 2. Floating orbs parallax
    if (floatingOrbsRef.current) {
      gsap.to(".floating-orb", {
        y: -60,
        rotation: 15,
        scrollTrigger: {
          trigger: container.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 2,
        }
      });
    }

    // 3. The Big Reveal (Pin & Scrub)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: "top top",
        end: "+=250%",
        scrub: 1.5,
        pin: true,
        anticipatePin: 1,
      }
    });

    tl.to(videoMockRef.current, {
      scale: 1.15,
      y: -40,
      rotateX: 5,
      boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
      ease: "none",
    })
    .to(statsRef.current, {
      x: 0,
      opacity: 1,
      rotateY: 0,
      ease: "power2.out",
    }, 0.3)
    .to(headlineRef.current, {
      opacity: 0.08,
      scale: 0.85,
      y: -80,
      filter: "blur(4px)",
      ease: "none",
    }, 0);

  }, { scope: container });

  return (
    <section ref={container} className="relative h-screen bg-black overflow-hidden flex flex-col items-center justify-center py-20">
      {/* Background Neural Textures */}
      <div className="absolute inset-0 z-0 opacity-[0.15]">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
         <div className="h-full w-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 brightness-100 contrast-150 mix-blend-overlay" />
      </div>

      {/* Floating ambient orbs */}
      <div ref={floatingOrbsRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="floating-orb absolute top-[20%] left-[10%] size-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="floating-orb absolute bottom-[30%] right-[15%] size-48 rounded-full bg-accent/15 blur-[80px]" />
        <div className="floating-orb absolute top-[60%] left-[60%] size-32 rounded-full bg-highlight/10 blur-[60px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl px-6 flex flex-col items-center">
        <h2 
          ref={headlineRef}
          className="reveal-up text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-center uppercase mb-16 md:mb-24 text-white/90"
          style={{ willChange: "transform, opacity, filter" }}
        >
          Vision becomes <span className="text-white/30 italic">Intelligence</span>
        </h2>

        <div className="relative w-full aspect-video md:aspect-[21/9] max-w-5xl perspective-[1500px]">
          {/* Main "Studio" Mockup */}
          <div 
            ref={videoMockRef}
            className="reveal-up absolute inset-0 rounded-[2.5rem] md:rounded-[3.5rem] bg-white/[0.03] border border-white/[0.08] overflow-hidden shadow-2xl backdrop-blur-3xl"
            style={{ willChange: "transform", transformStyle: "preserve-3d" }}
          >
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]" />
            
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.08]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-5 opacity-10">
                <div className="relative">
                  <Camera className="size-20 text-white" strokeWidth={1} />
                  <div className="absolute inset-0 blur-xl bg-primary/50" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Vision Stream Alpha</span>
              </div>
            </div>

            {/* Simulated UI Corners */}
            <div className="absolute top-8 left-8 size-10 border-t-2 border-l-2 border-white/15 rounded-tl-2xl" />
            <div className="absolute top-8 right-8 size-10 border-t-2 border-r-2 border-white/15 rounded-tr-2xl" />
            <div className="absolute bottom-8 left-8 size-10 border-b-2 border-l-2 border-white/15 rounded-bl-2xl" />
            <div className="absolute bottom-8 right-8 size-10 border-b-2 border-r-2 border-white/15 rounded-br-2xl" />
            
            {/* HUD Elements */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">System Active</span>
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Model</span>
                <span className="text-xs font-bold text-white/60">YOLOv8-Nano-Edge</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">FPS</span>
                  <span className="text-xs font-bold text-white/60 tabular-nums">60.0</span>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Latency</span>
                  <span className="text-xs font-bold text-emerald-400/80 tabular-nums">12ms</span>
                </div>
              </div>
            </div>

            {/* Scanned Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.04] to-transparent h-24 animate-scanline pointer-events-none" />
            
            {/* Corner reticles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[200px] border border-white/[0.04] rounded-lg">
              <div className="absolute top-0 left-0 size-3 border-t border-l border-white/20" />
              <div className="absolute top-0 right-0 size-3 border-t border-r border-white/20" />
              <div className="absolute bottom-0 left-0 size-3 border-b border-l border-white/20" />
              <div className="absolute bottom-0 right-0 size-3 border-b border-r border-white/20" />
            </div>
          </div>

          {/* Floating Stats Panel */}
          <div 
            ref={statsRef}
            className="absolute -right-4 top-16 hidden lg:flex flex-col gap-5 p-7 rounded-[2.5rem] bg-white/[0.04] border border-white/[0.08] backdrop-blur-3xl opacity-0 translate-x-24 shadow-2xl"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl bg-white/10 flex items-center justify-center text-white ring-1 ring-white/10">
                <Zap className="size-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">Latency</span>
                <span className="text-lg font-bold tabular-nums text-white">12ms</span>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-white/80 border border-white/10">
                <Shield className="size-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">Precision</span>
                <span className="text-lg font-bold tabular-nums text-emerald-400">99.8%</span>
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-xl bg-white/5 flex items-center justify-center text-white/80 border border-white/10">
                <Cpu className="size-5" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">Inference</span>
                <span className="text-lg font-bold tabular-nums text-white">On-Device</span>
              </div>
            </div>
          </div>

          {/* Floating badges left */}
          <div className="absolute -left-4 bottom-20 hidden lg:flex flex-col gap-3">
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Eye className="size-3 text-white/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">21 Landmarks</span>
              </div>
            </motion.div>
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <Scan className="size-3 text-white/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Real-time</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mt-20 md:mt-24 flex flex-col items-center text-center max-w-2xl reveal-up">
           <div className="flex items-center gap-2 mb-6 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl">
              <Sparkles className="size-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Architected for Speed</span>
           </div>
           <p className="text-base md:text-lg font-medium text-white/40 leading-relaxed max-w-xl">
             SignifyAI leverages a custom YOLO pipeline and optimized edge inference to provide instantaneous translation, even on mobile devices.
           </p>
        </div>
      </div>
    </section>
  );
}