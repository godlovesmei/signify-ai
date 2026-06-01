// components/landing/GlowCard.tsx
"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowCard({ children, className, glowColor = "var(--primary)" }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem]",
        "border border-border/40 bg-card/60 backdrop-blur-xl",
        "transition-all duration-500 ease-out",
        "hover:border-border/60 hover:shadow-2xl hover:shadow-foreground/5",
        className
      )}
      style={{ willChange: "transform" }}
    >
      {/* Spotlight gradient */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}15, transparent 40%)`,
        }}
      />
      {/* Inner border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 1px 1px ${glowColor}20`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}