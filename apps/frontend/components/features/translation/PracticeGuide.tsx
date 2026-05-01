"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid,
  X,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SignCard = {
  id: string;
  label: string;
  name: string;
  description: string;
  fingers: string;
  tip?: string;
  variant?: string;
};

const SIGN_LIBRARY: SignCard[] = [
  {
    id: "A",
    label: "A",
    name: "Huruf A",
    description:
      "Kedua tangan membentuk segitiga dengan ujung jari telunjuk dan ibu jari saling bertemu.",
    fingers:
      "Gunakan kedua tangan. Ujung jari telunjuk dan ibu jari kanan-kiri saling menyentuh hingga membentuk segitiga.",
    tip: "Pastikan bentuk segitiga terlihat jelas dari depan kamera.",
  },
  {
    id: "B",
    label: "B",
    name: "Huruf B",
    description:
      "Tangan kiri membentuk tiga jari terbuka, lalu tangan kanan menunjuk ke jari tangan kiri.",
    fingers:
      "Tangan kiri membuka tiga jari. Telunjuk tangan kanan mengarah atau menyentuh area jari tangan kiri.",
    tip: "Versi singkat: tangan kiri tiga jari terbuka, telunjuk tangan kanan menyentuhnya.",
  },
  {
    id: "C",
    label: "C",
    name: "Huruf C",
    description:
      "Satu tangan membentuk lengkungan seperti huruf C dengan jari dan ibu jari terbuka.",
    fingers:
      "Gunakan satu tangan. Jari-jari dan ibu jari melengkung membentuk huruf C yang jelas.",
    tip: "Jaga lengkungan tetap terbuka agar bentuk huruf C mudah dikenali.",
  },
  {
    id: "D",
    label: "D",
    name: "Huruf D",
    description:
      "Tangan kiri membentuk lengkungan seperti setengah lingkaran, lalu telunjuk tangan kanan tegak menyentuhnya.",
    fingers:
      "Tangan kiri menjadi bentuk lengkung. Telunjuk tangan kanan lurus ke atas dan ditempelkan pada sisi bentuk tangan kiri.",
    tip: "Pastikan telunjuk kanan tegak lurus agar bentuk D terlihat tegas.",
  },
  {
    id: "E",
    label: "E",
    name: "Huruf E",
    description:
      "Satu tangan dengan tiga jari terbuka ke samping, sementara jari lainnya terlipat.",
    fingers:
      "Buka tiga jari utama ke samping. Dua jari lainnya ditekuk agar siluet E lebih jelas.",
    tip: "Versi singkat: tiga jari terbuka ke samping, jari lainnya tetap terlipat.",
  },
  {
    id: "F",
    label: "F",
    name: "Huruf F",
    description:
      "Dua jari tangan atas terbuka ke samping, telunjuk tangan bawah menyentuh bagian bawahnya.",
    fingers:
      "Bentuk dua jari tangan atas terbuka ke samping. Telunjuk tangan bawah menyentuh bagian bawah bentuk tersebut.",
  },
  {
    id: "G",
    label: "G",
    name: "Huruf G",
    description:
      "Kedua tangan mengepal, satu di atas dan satu di bawah saling berhadapan.",
    fingers:
      "Gunakan dua tangan dalam posisi mengepal. Letakkan satu tangan di atas dan satu di bawah secara saling berhadapan.",
  },
  {
    id: "H",
    label: "H",
    name: "Huruf H",
    description:
      "Kedua tangan dengan telunjuk tegak ke atas, jari tengah salah satu tangan melintang di tengah.",
    fingers:
      "Buat dua telunjuk tegak ke atas. Salah satu jari tengah diletakkan melintang di tengah sebagai penghubung.",
    tip: "Pastikan dua telunjuk tegak terlihat jelas.",
    variant:
      "Versi singkat: dua telunjuk tegak ke atas, jari tengah melintang di tengah menghubungkannya.",
  },
  {
    id: "I",
    label: "I",
    name: "Huruf I",
    description:
      "Satu tangan dengan kelingking tegak ke atas, jari lainnya terlipat.",
    fingers:
      "Angkat jari kelingking lurus ke atas. Jari lainnya tetap dilipat ke dalam.",
  },
  {
    id: "J",
    label: "J",
    name: "Huruf J",
    description:
      "Satu tangan mengepal dengan kelingking terbuka, digerakkan membentuk lengkungan seperti huruf J.",
    fingers:
      "Buat tangan mengepal lalu buka jari kelingking. Gerakkan membentuk lengkung menyerupai huruf J.",
    tip: "Pastikan gerak lengkungnya terlihat jelas di depan kamera.",
  },
  {
    id: "K",
    label: "K",
    name: "Huruf K",
    description:
      "Telunjuk satu tangan tegak, telunjuk tangan lain menyentuh bagian tengahnya dengan ibu jari terbuka di samping.",
    fingers:
      "Satu telunjuk tegak lurus. Tangan lain menyentuh bagian tengah telunjuk tersebut, dengan ibu jari tangan penyentuh terbuka di samping.",
  },
  {
    id: "L",
    label: "L",
    name: "Huruf L",
    description: "Telunjuk ke atas dan ibu jari ke samping membentuk sudut L.",
    fingers:
      "Angkat telunjuk ke atas dan buka ibu jari ke samping hingga membentuk sudut seperti huruf L.",
  },
  {
    id: "M",
    label: "M",
    name: "Huruf M",
    description:
      "Satu tangan terbuka, tiga jari tangan lain menempel di bagian tengah telapak tangan.",
    fingers:
      "Buka satu telapak tangan. Tempelkan tiga jari dari tangan lain pada bagian tengah telapak tersebut.",
  },
  {
    id: "N",
    label: "N",
    name: "Huruf N",
    description:
      "Telapak tangan terbuka, jari telunjuk dan tengah tangan lain menempel di bagian tengah telapak.",
    fingers:
      "Buka satu telapak tangan menghadap depan. Tempelkan jari telunjuk dan jari tengah tangan lain di bagian tengah telapak.",
    variant:
      "Versi lain: satu tangan terbuka menghadap depan, dua jari tangan lain menempel di tengah telapak tangan.",
  },
  {
    id: "O",
    label: "O",
    name: "Huruf O",
    description: "Ibu jari dan telunjuk membentuk lingkaran, jari lain terbuka.",
    fingers:
      "Satukan ibu jari dan telunjuk hingga membentuk lingkaran. Jari lainnya tetap terbuka.",
  },
  {
    id: "P",
    label: "P",
    name: "Huruf P",
    description:
      "Telunjuk satu tangan tegak, ibu jari dan telunjuk tangan lain membentuk lengkungan menyentuh bagian atasnya.",
    fingers:
      "Buat satu telunjuk tegak lurus. Tangan lain membentuk lengkungan dengan ibu jari dan telunjuk, lalu menyentuh bagian atas telunjuk.",
    variant:
      "Versi lain: telunjuk satu tangan tegak, ibu jari dan telunjuk tangan lain membentuk lengkungan dan menyentuh ujung telunjuk tersebut.",
  },
  {
    id: "Q",
    label: "Q",
    name: "Huruf Q",
    description:
      "Ibu jari dan telunjuk satu tangan membentuk lingkaran, telunjuk tangan lain menyentuh bagian bawahnya.",
    fingers:
      "Buat lingkaran dengan ibu jari dan telunjuk. Gunakan telunjuk tangan lain untuk menyentuh bagian bawah lingkaran.",
  },
  {
    id: "R",
    label: "R",
    name: "Huruf R",
    description:
      "Satu tangan dengan telunjuk tegak, jari tengah ditekuk dan menempel pada ibu jari.",
    fingers:
      "Tegakkan jari telunjuk. Tekuk jari tengah hingga menyentuh atau menempel pada ibu jari.",
  },
  {
    id: "S",
    label: "S",
    name: "Huruf S",
    description:
      "Kedua tangan membentuk lengkungan dengan ibu jari dan telunjuk, ujung telunjuk saling berhadapan.",
    fingers:
      "Gunakan dua tangan. Masing-masing membentuk lengkung dengan ibu jari dan telunjuk, lalu arahkan ujung telunjuk saling berhadapan.",
  },
  {
    id: "T",
    label: "T",
    name: "Huruf T",
    description:
      "Satu telunjuk tegak ke atas, telunjuk tangan lain mendatar menyentuh bagian atasnya.",
    fingers:
      "Tegakkan satu telunjuk ke atas. Letakkan telunjuk tangan lain secara mendatar menyentuh bagian atas telunjuk pertama.",
  },
  {
    id: "U",
    label: "U",
    name: "Huruf U",
    description: "Telunjuk dan kelingking terbuka ke atas, jari lain terlipat.",
    fingers:
      "Buka telunjuk dan kelingking ke arah atas. Jari lainnya tetap dilipat.",
  },
  {
    id: "V",
    label: "V",
    name: "Huruf V",
    description:
      "Telunjuk dan jari tengah terbuka ke atas membentuk V, jari lain terlipat.",
    fingers:
      "Buka telunjuk dan jari tengah ke atas hingga membentuk huruf V. Jari lainnya dilipat.",
  },
  {
    id: "W",
    label: "W",
    name: "Huruf W",
    description:
      "Dua telunjuk tegak ke atas, ibu jari kedua tangan bertemu di tengah membentuk dua sudut seperti huruf W.",
    fingers:
      "Gunakan dua tangan. Tegakkan kedua telunjuk ke atas dan pertemukan ibu jari di tengah hingga membentuk dua sudut seperti huruf W.",
  },
  {
    id: "X",
    label: "X",
    name: "Huruf X",
    description: "Kedua telunjuk saling menyilang di tengah membentuk silang.",
    fingers:
      "Gunakan dua telunjuk dan silangkan keduanya di tengah hingga membentuk huruf X.",
  },
  {
    id: "Y",
    label: "Y",
    name: "Huruf Y",
    description:
      "Telunjuk dan ibu jari satu tangan terbuka membentuk sudut, telunjuk tangan lain menyentuh bagian tengahnya.",
    fingers:
      "Buka telunjuk dan ibu jari satu tangan hingga membentuk sudut. Gunakan telunjuk tangan lain untuk menyentuh bagian tengah bentuk tersebut.",
  },
  {
    id: "Z",
    label: "Z",
    name: "Huruf Z",
    description:
      "Satu tangan terbuka mendatar ke depan dengan telapak menghadap ke bawah.",
    fingers:
      "Buka satu tangan secara mendatar ke arah depan. Posisi telapak tangan menghadap ke bawah.",
  },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LETTER_IMAGES: Record<string, string> = Object.fromEntries(
  ALPHABET.map((letter) => [letter, `/alfabet/${letter}.jpg`])
);

export default function PracticeGuide() {
  const [index, setIndex] = useState(0);
  const [showChart, setShowChart] = useState(false);

  const items = SIGN_LIBRARY;
  const active = items[index] ?? items[0];

  const setActive = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setIndex(clamped);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Panduan latihan</p>
            <p className="text-xs text-muted-foreground/60">
              Pelajari bentuk tangan sebelum mulai isyarat.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowChart(true)}
          className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-nowrap transition-all hover:bg-muted/75 dark:hover:bg-white/10 hover:text-foreground"
        >
          <Grid className="h-3.5 w-3.5" />
          Chart A–Z
        </button>
      </div>

      <div className="glass rounded-2xl p-4 border border-border/80 dark:border-white/5">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-full bg-muted/70 dark:bg-white/5 px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground/65">
              statis
            </span>
            <span className="rounded-full border border-border/80 dark:border-white/10 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground/65">
              Alfabet
            </span>
          </div>

          <p className="text-lg font-bold leading-tight">
            {active.label} — {active.name}
          </p>
          <p className="text-sm text-muted-foreground/75">{active.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <InfoCard title="Bentuk jari">{active.fingers}</InfoCard>
        {active.tip && <InfoCard title="Tips" tone="tip">{active.tip}</InfoCard>}
        {active.variant && <InfoCard title="Varian">{active.variant}</InfoCard>}
      </div>

      <div className="flex flex-col gap-2 rounded-xl glass px-3 py-2 sm:flex-row sm:items-center sm:justify-between border border-border/80 dark:border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActive(index - 1)}
            disabled={index === 0}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5 transition hover:bg-muted/80 dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
            )}
            aria-label="Huruf sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setActive(index + 1)}
            disabled={index === items.length - 1}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5 transition hover:bg-muted/80 dark:hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
            )}
            aria-label="Huruf berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          {index + 1} / {items.length} · Gunakan ← →
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-full flex-wrap gap-2">
          {items.map((item, idx) => {
            const isActive = idx === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(idx)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-glow-primary/30"
                    : "border-border/80 dark:border-white/10 bg-muted/65 dark:bg-white/5 text-foreground hover:border-primary/40 hover:text-primary"
                )}
                aria-label={`Pilih ${item.name}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <ChartModal open={showChart} onClose={() => setShowChart(false)} />
    </section>
  );
}

function ChartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "absolute right-0 top-0 h-full glass-strong shadow-depth-4 transition-all duration-300",
          expanded ? "w-full" : "w-full sm:w-[420px] lg:w-[480px]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Grid className="h-4 w-4 text-primary" />
              <span>Chart Alfabet</span>
              <span className="rounded-full border border-border/80 dark:border-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/65">
                A–Z
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="rounded-full p-2 text-muted-foreground/65 transition hover:bg-muted/80 dark:hover:bg-white/10 hover:text-foreground"
                aria-label="Perbesar"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground/65 transition hover:bg-muted/80 dark:hover:bg-white/10 hover:text-foreground"
                aria-label="Tutup chart"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {ALPHABET.map((letter) => (
                <LetterCard key={letter} letter={letter} src={LETTER_IMAGES[letter]} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-border/80 dark:border-white/10 px-4 py-3">
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline underline-offset-4"
              onClick={onClose}
            >
              Tutup chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LetterCard({ letter, src }: { letter: string; src: string }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl glass p-2 text-center border border-border/80 dark:border-white/5">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted/60 dark:bg-white/5">
        {!hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Huruf ${letter}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground/40">
            {letter}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-foreground">{letter}</p>
    </div>
  );
}

function InfoCard({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "tip";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "tip"
          ? "border-amber-500/30 bg-amber-100/60 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/5 dark:text-amber-300"
          : "border-border/80 dark:border-white/10 bg-card/90 dark:bg-white/5 text-foreground/80"
      )}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
        {title}
      </p>
      <p className="leading-relaxed text-sm">{children}</p>
    </div>
  );
}
