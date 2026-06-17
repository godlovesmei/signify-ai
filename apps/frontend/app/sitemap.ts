import type { MetadataRoute } from "next";
import {
  SITE_URL,
  getAlternateLanguages,
  localizePathname,
  type Locale,
  locales,
} from "@/i18n/config";
import { PUBLIC_ROUTES } from "@/i18n/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.flatMap((pathname) =>
    locales.map((locale: Locale) => ({
      url: `${SITE_URL}${localizePathname(pathname, locale)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: pathname === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(getAlternateLanguages(pathname)).map(([lang, path]) => [
            lang,
            `${SITE_URL}${path}`,
          ]),
        ),
      },
    })),
  );
}
