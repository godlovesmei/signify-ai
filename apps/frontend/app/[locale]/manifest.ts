import type { MetadataRoute } from "next";
import { getLocaleConfig, type Locale } from "@/i18n/config";

const descriptions: Record<Locale, string> = {
  id: "Penerjemah dan ruang latihan alfabet BISINDO berbasis AI.",
  en: "AI-powered BISINDO translator and alphabet practice workspace.",
};

export default async function manifest({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<MetadataRoute.Manifest> {
  const { locale } = await params;
  const config = getLocaleConfig(locale);

  return {
    name: "SignifyAI",
    short_name: "SignifyAI",
    description: descriptions[locale],
    lang: config.htmlLang,
    start_url: config.routePrefix || "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#17171c",
    icons: [
      {
        src: "/signify-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
