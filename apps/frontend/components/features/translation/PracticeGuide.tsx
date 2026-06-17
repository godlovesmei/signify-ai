"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid,
  X,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@/i18n/navigation";

type SignCard = {
  id: string;
  label: string;
  name: string;
  description: string;
  fingers: string;
  tip?: string;
  variant?: string;
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LETTER_IMAGES: Record<string, string> = Object.fromEntries(
  ALPHABET.map((letter) => [letter, `/alfabet/${letter}.jpg`]),
);

export default function PracticeGuide() {
  const t = useTranslations("workspace.practiceGuide");
  const [index, setIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const items: SignCard[] = ALPHABET.map((letter) => {
    const tip = t(`letters.${letter}.tip`);
    const variant = t(`letters.${letter}.variant`);

    return {
      id: letter,
      label: letter,
      name: t(`letters.${letter}.name`),
      description: t(`letters.${letter}.description`),
      fingers: t(`letters.${letter}.fingers`),
      tip: tip || undefined,
      variant: variant || undefined,
    };
  });
  const active = items[index] ?? items[0];

  const setActive = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setIndex(clamped);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex w-full items-center gap-4 rounded-sm border border-cohere-hairline bg-cohere-canvas px-4 py-3.5 transition-colors hover:bg-cohere-stone"
      >
        <div className="flex size-9 items-center justify-center text-cohere-ink">
          <Sparkles className="size-5 stroke-[1.5]" />
        </div>
        <div className="flex flex-col items-start text-left leading-none">
          <span className="mb-1.5 font-cohere-mono text-[10px] uppercase tracking-normal text-cohere-muted">
            {t("triggerLabel")}
          </span>
          <span className="font-unica77 text-[15px] font-medium tracking-normal text-cohere-ink">
            {t("triggerTitle")}
          </span>
        </div>
        <Maximize2 className="ml-auto size-4 text-cohere-hairline transition-colors group-hover:text-cohere-muted" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.2, 1, 0.2, 1] }}
            className="fixed inset-4 z-[100] flex w-auto flex-col overflow-hidden rounded-lg border border-cohere-hairline bg-cohere-canvas shadow-none md:bottom-24 md:right-8 md:top-24 md:inset-x-auto md:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-cohere-hairline bg-cohere-stone/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="size-1.5 rounded-full bg-cohere-ink" />
                <span className="font-cohere-mono text-[11px] font-medium uppercase tracking-normal text-cohere-ink">
                  {t("title")}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setChartOpen(true)}
                  className="flex size-9 items-center justify-center rounded-md text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
                  title={t("openGrid")}
                  aria-label={t("openGrid")}
                >
                  <Grid className="size-4.5 stroke-[1.5]" />
                </button>
                <Link
                  href="/reference"
                  className="flex items-center gap-2 px-3 font-cohere-mono text-[10px] uppercase tracking-normal text-cohere-slate transition-colors hover:text-cohere-ink"
                >
                  {t("referenceLink")} <ExternalLink className="size-3.5 stroke-[1.5]" />
                </Link>
                <div className="mx-1 h-4 w-px bg-cohere-hairline" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex size-9 items-center justify-center rounded-md text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
                  aria-label={t("close")}
                >
                  <X className="size-4.5 stroke-[1.5]" />
                </button>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
              <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-md border border-cohere-hairline bg-cohere-stone/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/alfabet/${active.id}.jpg`}
                  alt={active.name}
                  className="size-full object-cover grayscale-[0.2] contrast-[1.05]"
                />
                <div className="absolute left-6 top-6">
                  <span className="font-unica77 text-[64px] font-normal leading-none tracking-normal text-cohere-ink">
                    {active.label}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 font-unica77 text-[32px] font-normal leading-tight tracking-normal text-cohere-ink">
                    {active.name}
                  </h3>
                  <p className="font-unica77 text-[16px] leading-[1.6] text-cohere-slate">
                    {active.description}
                  </p>
                </div>

                <div className="space-y-6 border-t border-cohere-hairline pt-6">
                  <div>
                    <span className="mb-3 block font-cohere-mono text-[11px] uppercase tracking-normal text-cohere-muted">
                      {t("handPosition")}
                    </span>
                    <p className="rounded-md border border-cohere-hairline/50 bg-cohere-stone/50 p-4 font-unica77 text-[14px] leading-[1.6] text-cohere-ink">
                      {active.fingers}
                    </p>
                  </div>

                  {active.tip && (
                    <div>
                      <span className="mb-3 block font-cohere-mono text-[11px] uppercase tracking-normal text-cohere-muted">
                        {t("tips")}
                      </span>
                      <p className="border-l-2 border-cohere-hairline pl-4 font-unica77 text-[14px] italic leading-[1.6] text-cohere-ink/80">
                        {active.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-px border-t border-cohere-hairline bg-cohere-hairline">
              <button
                onClick={() => setActive(index - 1)}
                disabled={index === 0}
                className="flex h-16 items-center justify-center gap-3 bg-cohere-canvas font-cohere-mono text-[11px] uppercase tracking-normal text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink disabled:opacity-30 disabled:hover:bg-cohere-canvas"
              >
                <ChevronLeft className="size-4 stroke-[1.5]" /> {t("previous")}
              </button>
              <button
                onClick={() => setActive(index + 1)}
                disabled={index === items.length - 1}
                className="flex h-16 items-center justify-center gap-3 bg-cohere-canvas font-cohere-mono text-[11px] uppercase tracking-normal text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink disabled:opacity-30 disabled:hover:bg-cohere-canvas"
              >
                {t("next")} <ChevronRight className="size-4 stroke-[1.5]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ChartModal open={chartOpen} onClose={() => setChartOpen(false)} />
    </>
  );
}

function ChartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("workspace.practiceGuide");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("indexTitle")}
      className="fixed inset-0 z-50 flex items-end justify-end bg-cohere-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative h-[85vh] rounded-t-lg border-l border-cohere-hairline bg-cohere-canvas shadow-none transition-all duration-300 sm:h-full sm:rounded-none",
          expanded ? "w-full" : "w-full sm:w-[420px] lg:w-[480px]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-cohere-hairline bg-cohere-stone/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="font-cohere-mono text-[11px] font-medium uppercase tracking-normal text-cohere-ink">
                {t("indexTitle")}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="flex size-9 items-center justify-center rounded-md text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
                aria-label={t("expand")}
              >
                <Maximize2 className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-md text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
                aria-label={t("closeChart")}
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ALPHABET.map((letter) => (
                <LetterCard key={letter} letter={letter} src={LETTER_IMAGES[letter]} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-cohere-hairline bg-cohere-stone/20 px-6 py-4">
            <button
              type="button"
              className="font-cohere-mono text-[11px] uppercase tracking-normal text-cohere-slate transition-colors hover:text-cohere-ink"
              onClick={onClose}
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LetterCard({ letter, src }: { letter: string; src: string }) {
  const t = useTranslations("workspace.practiceGuide");
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-cohere-hairline/60 bg-cohere-stone/30 p-3 text-center transition-colors hover:border-cohere-hairline">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cohere-stone">
        {!hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={t("letterAlt", { letter })}
            className="h-full w-full object-cover grayscale-[0.3] contrast-[1.05]"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-unica77 text-[24px] text-cohere-muted">
            {letter}
          </div>
        )}
      </div>
      <p className="font-unica77 text-[14px] font-medium text-cohere-ink">{letter}</p>
    </div>
  );
}
