import type { Metadata, Viewport } from 'next';
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
      { url: '/signify-icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/signify-icon-v2.svg', type: 'image/svg+xml' },
    ],
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
  verification: {
    google: 'your-google-site-verification', // replace with actual
  },
  category: 'technology',
  classification: 'Software Application',
  other: {
    'msapplication-TileColor': '#17171c',
    'msapplication-config': '/browserconfig.xml',
  },
};

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
        className="font-sans antialiased"
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
              toast: 'rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink shadow-none',
            },
          }}
        />
      </body>
    </html>
  );
}
