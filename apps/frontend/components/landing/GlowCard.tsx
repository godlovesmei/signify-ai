"use client";

import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowCard({ children, className }: GlowCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-cohere-hairline bg-cohere-canvas p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
