import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Download,
  ExternalLink,
  Heart,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type ButtonVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "outline"
  | "ghost"
  | "secondary"
  | "highlight"
  | "surface"
  | "signal"
  | "link";

type ButtonSize =
  | "xs"
  | "sm"
  | "default"
  | "lg"
  | "icon-xs"
  | "icon-sm"
  | "icon"
  | "icon-lg";

const variants: Array<{
  name: ButtonVariant;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { name: "default", label: "Default", icon: ArrowRight },
  { name: "success", label: "Success", icon: Check },
  { name: "warning", label: "Warning", icon: Bell },
  { name: "destructive", label: "Destructive", icon: Trash2 },
  { name: "outline", label: "Outline", icon: Download },
  { name: "ghost", label: "Ghost", icon: RefreshCw },
  { name: "secondary", label: "Secondary", icon: Settings },
  { name: "highlight", label: "Highlight", icon: WandSparkles },
  { name: "surface", label: "Surface", icon: Heart },
  { name: "signal", label: "Signal", icon: Plus },
  { name: "link", label: "Link", icon: ExternalLink },
];

const textSizes: Array<{ name: ButtonSize; label: string }> = [
  { name: "xs", label: "Extra small" },
  { name: "sm", label: "Small" },
  { name: "default", label: "Default" },
  { name: "lg", label: "Large" },
];

const iconSizes: Array<{ name: ButtonSize; label: string }> = [
  { name: "icon-xs", label: "Icon XS" },
  { name: "icon-sm", label: "Icon SM" },
  { name: "icon", label: "Icon" },
  { name: "icon-lg", label: "Icon LG" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-cohere-hairline py-10 md:py-12">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-mono-label text-[11px] text-cohere-slate">Preview</p>
          <h2 className="mt-2 font-display text-[30px] leading-none text-cohere-ink md:text-[40px]">
            {title}
          </h2>
        </div>
        {description && (
          <p className="max-w-xl text-sm leading-6 text-cohere-body-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SampleRow({
  variant,
  label,
  icon: Icon,
}: {
  variant: ButtonVariant;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <article className="grid gap-4 border-t border-cohere-hairline py-5 lg:grid-cols-[160px_1fr] lg:items-center">
      <div>
        <h3 className="text-[16px] leading-6 text-cohere-ink">{label}</h3>
        <p className="mt-1 font-mono text-[11px] text-cohere-slate">
          variant=&quot;{variant}&quot;
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant={variant}>
          {label}
          <Icon />
        </Button>
        <Button variant={variant} disabled>
          Disabled
        </Button>
        <Button variant={variant} isLoading loadingText="Loading" />
        <Button variant={variant} size="icon" aria-label={`${label} icon`}>
          <Icon />
        </Button>
      </div>
    </article>
  );
}

export default function ButtonPreviewPage() {
  return (
    <main className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <div className="cohere-container py-12 md:py-16">
        <header className="grid gap-8 pb-12 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-mono-label text-[12px] text-cohere-slate">
              Component inventory
            </p>
            <h1 className="mt-4 font-display text-[52px] leading-none md:text-[76px]">
              Button gallery
            </h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-7 text-cohere-body-muted">
              Semua variant, ukuran, dan state dari komponen Button dalam satu halaman
              supaya gampang dicek sebelum dipakai di flow lain.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/">
                Home
                <ArrowRight />
              </Link>
            </Button>
            <Button>
              Primary action
              <WandSparkles />
            </Button>
          </div>
        </header>

        <Section
          title="Variants"
          description="Setiap baris memperlihatkan tombol normal, disabled, loading, dan icon-only untuk variant yang sama."
        >
          <div className="border-b border-cohere-hairline">
            {variants.map((variant) => (
              <SampleRow
                key={variant.name}
                variant={variant.name}
                label={variant.label}
                icon={variant.icon}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Text Sizes"
          description="Ukuran teks memakai variant default supaya perbedaan tinggi dan padding terlihat jelas."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {textSizes.map((size) => (
              <article
                key={size.name}
                className="rounded-sm border border-cohere-hairline bg-cohere-stone p-5"
              >
                <p className="font-mono text-[11px] text-cohere-slate">
                  size=&quot;{size.name}&quot;
                </p>
                <div className="mt-5 flex min-h-16 items-center">
                  <Button size={size.name}>
                    {size.label}
                    <ArrowRight />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          title="Icon Sizes"
          description="Tombol icon-only punya radius lebih tegas untuk toolbar dan kontrol ringkas."
        >
          <div className="flex flex-wrap items-end gap-4 rounded-sm border border-cohere-hairline bg-cohere-stone p-5">
            {iconSizes.map((size) => (
              <div key={size.name} className="flex flex-col gap-3">
                <Button size={size.name} aria-label={size.label}>
                  <Settings />
                </Button>
                <span className="font-mono text-[11px] text-cohere-slate">
                  {size.name}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Composition"
          description="Contoh kombinasi icon, loading manual, dan Button sebagai Link melalui asChild."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                With leading icon
              </p>
              <Button variant="secondary">
                <Download />
                Export data
              </Button>
            </div>

            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                Custom busy label
              </p>
              <Button variant="signal" disabled>
                <Loader2 className="animate-spin" />
                Syncing
              </Button>
            </div>

            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                asChild link
              </p>
              <Button asChild variant="outline">
                <Link href="/how-it-works">
                  How it works
                  <ExternalLink />
                </Link>
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
