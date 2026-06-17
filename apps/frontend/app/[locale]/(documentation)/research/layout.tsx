import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { buildPageMetadata } from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return buildPageMetadata({
    locale,
    pathname: "/research",
    title: t("pages.research.title"),
    description: t("pages.research.description"),
    keywords: t.raw("keywords") as string[],
    imageAlt: t("imageAlt"),
  });
}

export default function ResearchMetadataLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
