"use client";

import { Link } from "@/i18n/navigation";
import type { ComponentType, ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  Camera,
  Check,
  Download,
  ExternalLink,
  Heart,
  Monitor,
  Moon,
  Radio,
  RefreshCw,
  Settings,
  Sun,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/Button";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

type ButtonVariant = NonNullable<ButtonProps["variant"]>;
type ButtonSize = NonNullable<ButtonProps["size"]>;

type VariantSample = {
  name: ButtonVariant;
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
};

const brandVariants: VariantSample[] = [
  { name: "primary", labelKey: "primary", icon: ArrowRight },
  { name: "secondary", labelKey: "secondary", icon: Settings },
  { name: "outline", labelKey: "outline", icon: Download },
];

const semanticVariants: VariantSample[] = [
  { name: "success", labelKey: "success", icon: Check },
  { name: "warning", labelKey: "warning", icon: Bell },
  { name: "destructive", labelKey: "destructive", icon: Trash2 },
  { name: "signal", labelKey: "signal", icon: Radio },
  { name: "highlight", labelKey: "highlight", icon: WandSparkles },
  { name: "surface", labelKey: "surface", icon: Heart },
  { name: "ghost", labelKey: "ghost", icon: RefreshCw },
  { name: "link", labelKey: "link", icon: ExternalLink },
];

const darkSurfaceVariants: VariantSample[] = [
  { name: "onDark", labelKey: "onDark", icon: Camera },
  { name: "outlineOnDark", labelKey: "outlineOnDark", icon: Download },
  { name: "ghostOnDark", labelKey: "ghostOnDark", icon: RefreshCw },
];

const textSizes: Array<{ name: ButtonSize; labelKey: string }> = [
  { name: "xs", labelKey: "xs" },
  { name: "sm", labelKey: "sm" },
  { name: "md", labelKey: "md" },
  { name: "lg", labelKey: "lg" },
];

const iconSizes: Array<{ name: ButtonSize; labelKey: string }> = [
  { name: "icon-xs", labelKey: "iconXs" },
  { name: "icon-sm", labelKey: "iconSm" },
  { name: "icon", labelKey: "icon" },
  { name: "icon-lg", labelKey: "iconLg" },
];

const themeOptions: Array<{
  name: ThemeMode;
  labelKey: "light" | "system" | "dark";
  icon: ComponentType<{ className?: string }>;
}> = [
  { name: "light", labelKey: "light", icon: Sun },
  { name: "system", labelKey: "system", icon: Monitor },
  { name: "dark", labelKey: "dark", icon: Moon },
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
  const t = useTranslations("dev.button");

  return (
    <section className="border-t border-cohere-hairline py-10 md:py-12">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-mono-label text-[11px] text-cohere-slate">{t("preview")}</p>
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
  disabledLabel,
  loadingLabel,
  iconLabel,
  surface = "default",
}: {
  variant: ButtonVariant;
  label: string;
  icon: ComponentType<{ className?: string }>;
  disabledLabel: string;
  loadingLabel: string;
  iconLabel: string;
  surface?: "default" | "dark";
}) {
  const isDarkSurface = surface === "dark";

  return (
    <article
      className={cn(
        "grid gap-4 border-t py-5 lg:grid-cols-[160px_1fr] lg:items-center",
        isDarkSurface ? "border-white/10" : "border-cohere-hairline"
      )}
    >
      <div>
        <h3 className={cn("text-[16px] leading-6", isDarkSurface ? "text-white" : "text-cohere-ink")}>
          {label}
        </h3>
        <p className={cn("mt-1 font-mono text-[11px]", isDarkSurface ? "text-white/55" : "text-cohere-slate")}>
          variant=&quot;{variant}&quot;
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant={variant}>
          {label}
          <Icon />
        </Button>
        <Button variant={variant} disabled>
          {disabledLabel}
        </Button>
        <Button variant={variant} isLoading loadingLabel={loadingLabel} />
        <Button variant={variant} size="icon" aria-label={iconLabel}>
          <Icon />
        </Button>
      </div>
    </article>
  );
}

export default function ButtonPreviewPage() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("dev.button");
  const themeT = useTranslations("settings.themeOptions");

  return (
    <main className="min-h-screen bg-cohere-canvas text-cohere-ink">
      <div className="cohere-container py-12 md:py-16">
        <header className="grid gap-8 pb-12 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="text-mono-label text-[12px] text-cohere-slate">
              {t("inventory")}
            </p>
            <h1 className="mt-4 font-display text-[52px] leading-none md:text-[76px]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-7 text-cohere-body-muted">
              {t("description")}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-sm border border-cohere-hairline bg-cohere-stone p-3">
              <p className="mb-2 font-mono text-[11px] text-cohere-slate">
                {t("themeResolved", { theme: resolvedTheme })}
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("themePreview")}>
                {themeOptions.map(({ name, labelKey, icon: Icon }) => (
                  <Button
                    key={name}
                    variant={theme === name ? "primary" : "outline"}
                    size="sm"
                    role="radio"
                    aria-checked={theme === name}
                    onClick={() => setTheme(name)}
                  >
                    <Icon />
                    {themeT(labelKey)}
                  </Button>
                ))}
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                {t("home")}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </header>

        <Section
          title={t("sections.brandTitle")}
          description={t("sections.brandDescription")}
        >
          <div className="border-b border-cohere-hairline">
            {brandVariants.map((variant) => (
              <SampleRow
                key={variant.name}
                variant={variant.name}
                label={t(`variants.${variant.labelKey}`)}
                icon={variant.icon}
                disabledLabel={t("disabled")}
                loadingLabel={t("loading")}
                iconLabel={t("iconLabel", { label: t(`variants.${variant.labelKey}`) })}
              />
            ))}
          </div>
        </Section>

        <Section
          title={t("sections.semanticTitle")}
          description={t("sections.semanticDescription")}
        >
          <div className="border-b border-cohere-hairline">
            {semanticVariants.map((variant) => (
              <SampleRow
                key={variant.name}
                variant={variant.name}
                label={t(`variants.${variant.labelKey}`)}
                icon={variant.icon}
                disabledLabel={t("disabled")}
                loadingLabel={t("loading")}
                iconLabel={t("iconLabel", { label: t(`variants.${variant.labelKey}`) })}
              />
            ))}
          </div>
        </Section>

        <Section
          title={t("sections.darkTitle")}
          description={t("sections.darkDescription")}
        >
          <div className="rounded-md border border-white/10 bg-cohere-primary px-5 text-white">
            {darkSurfaceVariants.map((variant) => (
              <SampleRow
                key={variant.name}
                variant={variant.name}
                label={t(`variants.${variant.labelKey}`)}
                icon={variant.icon}
                disabledLabel={t("disabled")}
                loadingLabel={t("loading")}
                iconLabel={t("iconLabel", { label: t(`variants.${variant.labelKey}`) })}
                surface="dark"
              />
            ))}
          </div>
        </Section>

        <Section
          title={t("sections.textSizesTitle")}
          description={t("sections.textSizesDescription")}
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
                    {t(`sizes.${size.labelKey}`)}
                    <ArrowRight />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section
          title={t("sections.iconSizesTitle")}
          description={t("sections.iconSizesDescription")}
        >
          <div className="flex flex-wrap items-end gap-4 rounded-sm border border-cohere-hairline bg-cohere-stone p-5">
            {iconSizes.map((size) => (
              <div key={size.name} className="flex flex-col gap-3">
                <Button size={size.name} aria-label={t(`sizes.${size.labelKey}`)}>
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
          title={t("sections.compositionTitle")}
          description={t("sections.compositionDescription")}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                {t("samples.leadingIcon")}
              </p>
              <Button variant="secondary">
                <Download />
                {t("samples.exportData")}
              </Button>
            </div>

            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                {t("samples.busyLabel")}
              </p>
              <Button variant="signal" isLoading loadingLabel={t("samples.syncing")}>
                {t("samples.syncData")}
              </Button>
            </div>

            <div className="rounded-sm border border-cohere-hairline p-5">
              <p className="mb-5 text-mono-label text-[11px] text-cohere-slate">
                {t("samples.asChild")}
              </p>
              <Button asChild variant="outline">
                <Link href="/how-it-works">
                  {t("samples.howItWorks")}
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
