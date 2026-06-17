export const locales = ["id", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

export const localeConfigs: Record<
  Locale,
  {
    label: string;
    name: string;
    htmlLang: string;
    intlLocale: string;
    ogLocale: string;
    ttsLang: string;
    routePrefix: string;
  }
> = {
  id: {
    label: "ID",
    name: "Indonesia",
    htmlLang: "id",
    intlLocale: "id-ID",
    ogLocale: "id_ID",
    ttsLang: "id-ID",
    routePrefix: "",
  },
  en: {
    label: "ENG",
    name: "English",
    htmlLang: "en",
    intlLocale: "en-US",
    ogLocale: "en_US",
    ttsLang: "en-US",
    routePrefix: "/en",
  },
};

export const SITE_URL = "https://signify.app";

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleConfig(locale: Locale) {
  return localeConfigs[locale];
}

function normalizePathname(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? "/";
  const withoutQuery = withoutHash.split("?")[0] ?? "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

export function stripLocalePrefix(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  const normalized = normalizePathname(pathname);
  const [, firstSegment = "", ...rest] = normalized.split("/");

  if (!isLocale(firstSegment)) {
    return { locale: null, pathname: normalized };
  }

  const stripped = normalizePathname(`/${rest.join("/")}`);
  return {
    locale: firstSegment,
    pathname: stripped,
  };
}

export function localizePathname(pathname: string, locale: Locale): string {
  const { pathname: unprefixedPathname } = stripLocalePrefix(pathname);

  if (locale === defaultLocale) {
    return unprefixedPathname;
  }

  return normalizePathname(`${localeConfigs[locale].routePrefix}${unprefixedPathname}`);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const { locale } = stripLocalePrefix(pathname);
  return locale ?? defaultLocale;
}

export function getAlternateLanguages(pathname: string): Record<string, string> {
  return {
    id: localizePathname(pathname, "id"),
    en: localizePathname(pathname, "en"),
    "x-default": localizePathname(pathname, defaultLocale),
  };
}
