import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DocumentationHeroProps = {
  eyebrow: string;
  title: string;
  lead?: string;
  meta?: ReactNode;
  tone?: "accent" | "muted";
};

export default function DocumentationHero({
  eyebrow,
  title,
  lead,
  meta,
  tone = "muted",
}: DocumentationHeroProps) {
  return (
    <section className="border-b border-[var(--color-border)] py-14 md:py-16">
      <div className="cohere-container" data-animate>
        <p
          className={cn(
            "text-mono-label text-[12px]",
            tone === "accent"
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-text-secondary)]",
          )}
        >
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-5xl font-display text-[48px] leading-none tracking-[-0.02em] sm:text-[60px] lg:text-[72px]">
          {title}
        </h1>
        {lead ? (
          <p className="mt-5 max-w-2xl text-[18px] leading-[1.4] text-[var(--color-text-secondary)]">
            {lead}
          </p>
        ) : null}
        {meta ? (
          <div className="mt-6 grid gap-4 border-t border-[var(--color-border)] pt-4 text-[14px] text-[var(--color-text-secondary)] sm:grid-cols-3">
            {meta}
          </div>
        ) : null}
      </div>
    </section>
  );
}
