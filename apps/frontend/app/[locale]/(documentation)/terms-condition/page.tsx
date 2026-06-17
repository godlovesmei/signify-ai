import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/card";
import DocumentationHero from "../_components/DocumentationHero";
import { buildPageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return buildPageMetadata({
    locale,
    pathname: "/terms-condition",
    title: t("pages.terms.title"),
    description: t("pages.terms.description"),
    keywords: t.raw("keywords") as string[],
    imageAlt: t("imageAlt"),
  });
}

type TermsSection = {
  id: string;
  title: string;
  content: string;
};

export default function TermsConditionPage() {
  const t = useTranslations("docs.terms");
  const sections = t.raw("sections") as TermsSection[];

  return (
    <main id="main-content" className="pt-32">
      <DocumentationHero
        eyebrow={t("meta.eyebrow")}
        title={t("title")}
        meta={
          <>
            <span>
              {t("meta.lastUpdated")}{" "}
              <time dateTime="2026-02-18" className="text-[var(--color-text-primary)]">
                {t("meta.lastUpdatedDate")}
              </time>
            </span>
            <span>{t("meta.sections", { count: sections.length })}</span>
            <span>{t("meta.readTime")}</span>
          </>
        }
      />

      <section
        aria-label={t("contents")}
        className="border-b border-[var(--color-border)] lg:hidden"
      >
        <div className="cohere-container overflow-x-auto py-4">
          <nav className="flex w-max gap-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-action)] hover:text-[var(--color-action)]"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="cohere-container grid gap-12 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
            <aside className="hidden lg:block">
              <div className="sticky top-32">
                <div className="mb-5 flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <FileText className="size-4" />
                  <p className="text-mono-label text-[12px]">{t("meta.onThisPage")}</p>
                </div>
                <nav aria-label={t("contents")} className="border-t border-[var(--color-border)]">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block border-b border-[var(--color-border)] py-3 text-[14px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-action)]"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="min-w-0 max-w-4xl">
              <Card
                variant="product"
                data-animate
                className="mb-12 gap-0"
              >
                <p className="text-mono-label text-[12px] text-[var(--color-accent)]">
                  {t("plainSummary")}
                </p>
                <p className="mt-4 max-w-3xl text-[16px] leading-[1.5] text-[var(--color-text-secondary)]">
                  {t("summaryBody")}
                </p>
              </Card>

              <div className="border-t border-[var(--color-border)]">
                {sections.map((section) => (
                  <article
                    id={section.id}
                    key={section.id}
                    data-animate
                    className="scroll-mt-32 border-b border-[var(--color-border)] py-8"
                  >
                    <h2 className="text-[24px] leading-[1.3] text-[var(--color-text-primary)]">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-[16px] leading-[1.6] text-[var(--color-text-secondary)]">
                      {section.content}
                    </p>
                    {section.id === "privacy" && (
                      <div className="mt-5 border-l border-[var(--color-bg-product)] pl-4 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
                        {t("callouts.privacy")}{" "}
                        <Link
                          href="/research"
                          className="text-[var(--color-action)] underline underline-offset-4"
                        >
                          {t("callouts.researchLink")}
                        </Link>
                      </div>
                    )}
                    {section.id === "disclaimer" && (
                      <div className="mt-5 border-l border-[var(--color-accent)] pl-4 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
                        {t("callouts.disclaimer")}{" "}
                        <Link
                          href="/how-it-works"
                          className="text-[var(--color-action)] underline underline-offset-4"
                        >
                          {t("callouts.limitationsLink")}
                        </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <Card
                variant="hero"
                data-animate
                className="mt-12 flex-col gap-6 p-8 md:flex-row md:items-center"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-[var(--color-bg-subtle)]">
                  <Mail className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[24px] leading-[1.3]">{t("contact.title")}</h3>
                  <p className="mt-2 text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
                    {t("contact.body")}
                  </p>
                </div>
                <Button asChild variant="primary">
                  <Link href="mailto:legal@signify.ai">
                    {t("contact.button")}
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
      </section>
    </main>
  );
}
