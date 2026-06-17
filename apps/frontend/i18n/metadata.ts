import type { Metadata } from "next";
import type { Locale } from "./config";
import {
  SITE_URL,
  getAlternateLanguages,
  getLocaleConfig,
  localizePathname,
} from "./config";

export const PUBLIC_ROUTES = [
  "/",
  "/how-it-works",
  "/research",
  "/terms-condition",
] as const;

export const WORKSPACE_ROUTES = [
  "/translate",
  "/practice",
  "/history",
  "/reference",
  "/profile",
] as const;

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  keywords,
  imageAlt,
  index = true,
}: {
  locale: Locale;
  pathname: string;
  title: string;
  description: string;
  keywords?: string[];
  imageAlt?: string;
  index?: boolean;
}): Metadata {
  const config = getLocaleConfig(locale);
  const canonical = localizePathname(pathname, locale);

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: getAlternateLanguages(pathname),
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        },
    openGraph: {
      type: "website",
      locale: config.ogLocale,
      alternateLocale: locale === "id" ? ["en_US"] : ["id_ID"],
      url: canonical,
      siteName: "SignifyAI",
      title,
      description,
      images: [
        {
          url: "/hero.png",
          width: 928,
          height: 1232,
          alt: imageAlt ?? title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hero.png"],
    },
  };
}
