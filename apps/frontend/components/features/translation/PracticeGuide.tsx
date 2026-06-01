"use client";

import { useEffect, useState } from "react";
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
import Link from "next/link";

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
  const [isOpen, setIsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const items = SIGN_LIBRARY;
  const active = items[index] ?? items[0];

  const setActive = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setIndex(clamped);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex w-full items-center gap-4 rounded-lg border border-cohere-hairline bg-cohere-canvas px-4 py-3.5 transition-all hover:bg-cohere-stone active:scale-[0.98]"
      >
        <div className="flex size-9 items-center justify-center text-cohere-ink transition-transform group-hover:scale-110">
          <Sparkles className="size-5 stroke-[1.5]" />
        </div>
        <div className="flex flex-col items-start leading-none text-left">
           <span className="font-cohere-mono text-[10px] uppercase tracking-[0.2em] text-cohere-muted mb-1.5">Visual Guide</span>
           <span className="font-unica77 text-[15px] font-medium tracking-tight text-cohere-ink">BISINDO Alphabet</span>
        </div>
        <Maximize2 className="ml-auto size-4 text-cohere-hairline group-hover:text-cohere-muted transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.2, 1, 0.2, 1] }}
            className="fixed inset-4 md:inset-x-auto md:right-8 md:top-24 md:bottom-24 z-[100] flex w-auto md:w-[420px] flex-col overflow-hidden rounded-lg border border-cohere-hairline bg-cohere-canvas shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-cohere-hairline bg-cohere-stone/30 px-6 py-4">
               <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-cohere-ink" />
                  <span className="font-cohere-mono text-[11px] uppercase tracking-[0.2em] text-cohere-ink font-medium">Reference Guide</span>
               </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setChartOpen(true)}
                    className="size-9 rounded-md flex items-center justify-center text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-colors"
                    title="Lihat Grid A-Z"
                  >
                     <Grid className="size-4.5 stroke-[1.5]" />
                  </button>
                  <Link href="/reference" className="font-cohere-mono text-[10px] uppercase tracking-[0.15em] text-cohere-slate hover:text-cohere-ink transition-colors flex items-center gap-2 px-3">
                     Full Index <ExternalLink className="size-3.5 stroke-[1.5]" />
                  </Link>
                  <div className="w-px h-4 bg-cohere-hairline mx-1" />
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="size-9 rounded-md flex items-center justify-center text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-colors"
                  >
                     <X className="size-4.5 stroke-[1.5]" />
                  </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
               <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-md border border-cohere-hairline bg-cohere-stone/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/alfabet/${active.id}.jpg`}
                    alt={active.name}
                    className="size-full object-cover grayscale-[0.2] contrast-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-cohere-canvas/20 to-transparent pointer-events-none" />
                  <div className="absolute top-6 left-6">
                     <span className="font-unica77 text-[64px] font-normal text-cohere-ink leading-none tracking-[-0.04em] drop-shadow-sm">{active.label}</span>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <h3 className="font-unica77 text-[32px] font-normal leading-tight tracking-[-0.01em] text-cohere-ink mb-3">{active.name}</h3>
                    <p className="font-unica77 text-[16px] leading-[1.6] text-cohere-slate">{active.description}</p>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-cohere-hairline">
                    <div>
                       <span className="font-cohere-mono text-[11px] uppercase tracking-[0.2em] text-cohere-muted mb-3 block">Technical Instruction</span>
                       <p className="font-unica77 text-[14px] leading-[1.6] text-cohere-ink p-4 rounded-md bg-cohere-stone/50 border border-cohere-hairline/50">{active.fingers}</p>
                    </div>

                    {active.tip && (
                      <div>
                         <span className="font-cohere-mono text-[11px] uppercase tracking-[0.2em] text-cohere-muted mb-3 block">Operational Tip</span>
                         <p className="font-unica77 text-[14px] leading-[1.6] text-cohere-ink/80 italic pl-4 border-l-2 border-cohere-hairline">{active.tip}</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-cohere-hairline bg-cohere-hairline mt-auto">
               <button
                 onClick={() => setActive(index - 1)}
                 disabled={index === 0}
                 className="flex h-16 items-center justify-center gap-3 font-cohere-mono text-[11px] uppercase tracking-[0.15em] bg-cohere-canvas text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-all disabled:opacity-30 disabled:hover:bg-cohere-canvas"
               >
                 <ChevronLeft className="size-4 stroke-[1.5]" /> Previous
               </button>
               <button
                 onClick={() => setActive(index + 1)}
                 disabled={index === items.length - 1}
                 className="flex h-16 items-center justify-center gap-3 font-cohere-mono text-[11px] uppercase tracking-[0.15em] bg-cohere-canvas text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-all disabled:opacity-30 disabled:hover:bg-cohere-canvas"
               >
                 Next <ChevronRight className="size-4 stroke-[1.5]" />
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-cohere-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative h-[85vh] sm:h-full bg-cohere-canvas shadow-2xl transition-all duration-300 rounded-t-lg sm:rounded-none border-l border-cohere-hairline",
          expanded ? "w-full" : "w-full sm:w-[420px] lg:w-[480px]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-cohere-hairline bg-cohere-stone/30 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="font-cohere-mono text-[11px] uppercase tracking-[0.2em] text-cohere-ink font-medium">Index A–Z</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="size-9 rounded-md flex items-center justify-center text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-colors"
                aria-label="Perbesar"
              >
                <Maximize2 className="h-4 w-4 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="size-9 rounded-md flex items-center justify-center text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink transition-colors"
                aria-label="Tutup chart"
              >
                <X className="h-4 w-4 stroke-[1.5]" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ALPHABET.map((letter) => (
                <LetterCard key={letter} letter={letter} src={LETTER_IMAGES[letter]} />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-cohere-hairline bg-cohere-stone/20 px-6 py-4">
            <button
              type="button"
              className="font-cohere-mono text-[11px] uppercase tracking-[0.2em] text-cohere-slate hover:text-cohere-ink transition-colors"
              onClick={onClose}
            >
              Close Reference
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
    <div className="flex flex-col gap-3 rounded-md bg-cohere-stone/30 p-3 text-center border border-cohere-hairline/60 hover:border-cohere-hairline transition-colors">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-cohere-stone">
        {!hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Huruf ${letter}`}
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
