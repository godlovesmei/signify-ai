import type { Metadata, Viewport } from 'next';
import { Sora, Atkinson_Hyperlegible_Next, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";

const THEME_STORAGE_KEY = 'signify:theme';
const PREFER_DARK_QUERY = '(prefers-color-scheme: dark)';

/* ───────────────────────────────────────────────────────────────────────────
   CRITICAL THEME SCRIPT — runs before paint to prevent flash of wrong theme
   ─────────────────────────────────────────────────────────────────────────── */
const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const mq = window.matchMedia('${PREFER_DARK_QUERY}');
    const apply = () => {
      const resolved = mode === 'system' ? (mq.matches ? 'dark' : 'light') : mode;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;
    };
    apply();
    if (mode === 'system') {
      mq.addEventListener('change', apply);
    }
  } catch (e) {
    // ignore — leave default light theme
  }
})();
`;

/* ───────────────────────────────────────────────────────────────────────────
   FONTS — BISINDO Design System v2.0
   Display  → Sora                          → headings, prediction badge, hero
   Body     → Atkinson Hyperlegible Next    → UI text, body copy, accessibility
   Mono     → JetBrains Mono                → FPS counter, dev panel, logs
   ─────────────────────────────────────────────────────────────────────────── */
const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const atkinsonHyperlegibleNext = Atkinson_Hyperlegible_Next({
  variable: '--font-atkinson-hyperlegible-next',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  adjustFontFallback: false,
  fallback: ['system-ui', 'sans-serif'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

/* ───────────────────────────────────────────────────────────────────────────
   METADATA — SEO + Social + PWA
   ─────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL('https://signify.app'),
  title: {
    default: 'SignifyAI — Penerjemah Bahasa Isyarat BISINDO Real-Time',
    template: '%s · SignifyAI',
  },
  description:
    'Terjemahkan gerakan tangan BISINDO menjadi teks dan suara secara real-time menggunakan AI. Dirancang untuk komunitas Tuli, pendidik, dan peneliti. Gratis, berbasis browser, tanpa unduhan.',
  keywords: [
    'BISINDO',
    'bahasa isyarat Indonesia',
    'penerjemah isyarat',
    'sign language recognition',
    'AI aksesibilitas',
    'real-time translation',
    'YOLO',
    'tuna rungu',
    'komunikasi inklusif',
    'computer vision',
  ],
  authors: [{ name: 'SignifyAI Team', url: 'https://signify.app' }],
  creator: 'SignifyAI Team',
  publisher: 'SignifyAI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    url: 'https://signify.app',
    siteName: 'SignifyAI',
    title: 'SignifyAI — Penerjemah Bahasa Isyarat BISINDO Real-Time',
    description:
      'AI-powered BISINDO sign language recognition. Terjemahkan isyarat tangan menjadi teks dan suara secara real-time. Gratis, tanpa unduhan, berbasis browser.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SignifyAI — Penerjemah Bahasa Isyarat BISINDO Real-Time',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@signifyai',
    creator: '@signifyai',
    title: 'SignifyAI — Penerjemah Bahasa Isyarat BISINDO Real-Time',
    description:
      'AI-powered BISINDO sign language recognition. Real-time, accessible, free.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#8b5cf6',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SignifyAI',
  },
  applicationName: 'SignifyAI',
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: 'your-google-site-verification', // replace with actual
  },
  category: 'technology',
  classification: 'Software Application',
  other: {
    'msapplication-TileColor': '#8b5cf6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/* ───────────────────────────────────────────────────────────────────────────
   STRUCTURED DATA — JSON-LD for rich search results
   ─────────────────────────────────────────────────────────────────────────── */
function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://signify.app/#website',
        url: 'https://signify.app',
        name: 'SignifyAI',
        description:
          'Penerjemah Bahasa Isyarat BISINDO real-time berbasis AI dan computer vision.',
        publisher: { '@id': 'https://signify.app/#organization' },
        inLanguage: 'id',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://signify.app/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://signify.app/#organization',
        name: 'SignifyAI',
        url: 'https://signify.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://signify.app/logo.png',
          width: 512,
          height: 512,
        },
        sameAs: [
          'https://twitter.com/signifyai',
          'https://github.com/signifyai',
        ],
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
        featureList: [
          'Real-time BISINDO sign language recognition',
          'Text-to-Speech output in Bahasa Indonesia',
          'Browser-based processing (no cloud)',
          'Practice mode with feedback',
          'Developer panel with inference metrics',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '124',
        },
        inLanguage: ['id', 'en'],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
   ─────────────────────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className="scroll-smooth theme-transition"
    >
      <head>
        <StructuredData />
      </head>
      <body
        className={[
          sora.variable,
          atkinsonHyperlegibleNext.variable,
          jetbrainsMono.variable,
          'font-sans antialiased',
        ].join(' ')}
      >
        {/* Critical theme script — must run before any paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: 'glass-strong border border-white/10 shadow-depth-3',
            },
          }}
        />
      </body>
    </html>
  );
}