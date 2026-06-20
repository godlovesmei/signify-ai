import type { Metadata, Viewport } from 'next';
import { hasLocale } from 'next-intl';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import '../../styles/globals.css';
import { Toaster } from "@/components/ui/sonner";
import { PreferencesProvider } from "@/components/providers/PreferencesProvider";
import { defaultLocale, getLocaleConfig, SITE_URL, type Locale } from '@/i18n/config';
import { buildPageMetadata } from '@/i18n/metadata';
import { routing } from '@/i18n/routing';

const THEME_STORAGE_KEY = 'signify:theme';
const PREFER_DARK_QUERY = '(prefers-color-scheme: dark)';

/* ───────────────────────────────────────────────────────────────────────────
   CRITICAL THEME SCRIPT — runs before paint to prevent flash of wrong theme
   ─────────────────────────────────────────────────────────────────────────── */
const themeInitScript = `
(() => {
  try {
    const mq = window.matchMedia('${PREFER_DARK_QUERY}');
    const readMode = () => {
      const stored = localStorage.getItem('${THEME_STORAGE_KEY}');
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    };
    const apply = () => {
      const mode = readMode();
      const resolved = mode === 'system' ? (mq.matches ? 'dark' : 'light') : mode;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    mq.addEventListener('change', apply);
    window.addEventListener('storage', (event) => {
      if (event.key === '${THEME_STORAGE_KEY}') apply();
    });
  } catch (e) {
    // ignore — leave default light theme
  }
})();
`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale)
    ? rawLocale
    : defaultLocale;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    ...buildPageMetadata({
      locale,
      pathname: '/',
      title: t('defaultTitle'),
      description: t('description'),
      keywords: t.raw('keywords') as string[],
      imageAlt: t('imageAlt'),
    }),
    title: {
      default: t('defaultTitle'),
      template: t('titleTemplate'),
    },
    authors: [{ name: 'SignifyAI Team', url: SITE_URL }],
    creator: 'SignifyAI Team',
    publisher: 'SignifyAI',
    manifest: locale === defaultLocale ? '/manifest.webmanifest' : `/${locale}/manifest.webmanifest`,
    icons: {
      icon: [{ url: '/signify-icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/signify-icon-v2.svg', type: 'image/svg+xml' }],
      other: [
        {
          rel: 'mask-icon',
          url: '/signify-icon.svg',
          color: '#17171c',
        },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'SignifyAI',
    },
    applicationName: 'SignifyAI',
    formatDetection: {
      telephone: false,
    },
    category: 'technology',
    classification: 'Software Application',
    other: {
      'msapplication-TileColor': '#17171c',
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

/* ───────────────────────────────────────────────────────────────────────────
   STRUCTURED DATA — JSON-LD for rich search results
   ─────────────────────────────────────────────────────────────────────────── */
function StructuredData({
  locale,
  description,
  features,
}: {
  locale: Locale;
  description: string;
  features: string[];
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://signify.app/#website',
        url: 'https://signify.app',
        name: 'SignifyAI',
        description,
        publisher: { '@id': 'https://signify.app/#organization' },
        inLanguage: locale,
      },
      {
        '@type': 'Organization',
        '@id': 'https://signify.app/#organization',
        name: 'SignifyAI',
        url: 'https://signify.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://signify.app/signify-icon.svg',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://signify.app/#application',
        name: 'SignifyAI',
        applicationCategory: 'AccessibilityApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'IDR',
        },
        featureList: features,
        inLanguage: ['id', 'en'],
      },
    ],
  };

  return (
    <Script
      id="signify-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
   ─────────────────────────────────────────────────────────────────────────── */
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'seo' });
  const localeConfig = getLocaleConfig(locale);

  return (
    <html
      lang={localeConfig.htmlLang}
      suppressHydrationWarning
      className="scroll-smooth theme-transition"
      data-scroll-behavior="smooth"
    >
      <head>
        <StructuredData
          locale={locale}
          description={t('jsonLdDescription')}
          features={t.raw('features') as string[]}
        />
        {/* Critical theme script — must run before any paint */}
        <Script
          id="signify-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <PreferencesProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                classNames: {
                  toast: 'rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink shadow-none',
                },
              }}
            />
          </PreferencesProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
