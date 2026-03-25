import type { Metadata, Viewport } from 'next';
import { Sora, Atkinson_Hyperlegible_Next, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner"

/* ─────────────────────────────────────────────────────────────────────────────
   FONTS — BISINDO Design System v1.1
   Display  → Sora                          → headings, prediction badge
   Body     → Atkinson Hyperlegible Next    → UI text, body copy
   Mono     → JetBrains Mono     → FPS counter, dev panel, prediction log
   ───────────────────────────────────────────────────────────────────────────── */
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
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

/* ─────────────────────────────────────────────────────────────────────────────
   METADATA
   ───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'BISINDO — Penerjemah Bahasa Isyarat Real-Time',
    template: '%s · BISINDO',
  },
  description:
    'Terjemahkan gerakan tangan BISINDO menjadi teks secara real-time menggunakan AI dan computer vision. Dirancang untuk pengguna Tuli, pendidik, dan peneliti.',
  keywords: [
    'BISINDO',
    'bahasa isyarat',
    'Indonesian Sign Language',
    'penerjemah isyarat',
    'AI aksesibilitas',
    'real-time',
    'MediaPipe',
    'tuna rungu',
  ],
  authors: [{ name: 'BISINDO App Team' }],
  robots: { index: true, follow: true },
  openGraph: {
    title: 'BISINDO — Penerjemah Bahasa Isyarat Real-Time',
    description:
      'Terjemahkan gerakan tangan BISINDO menjadi teks secara real-time. Gratis, berbasis browser, tanpa unduhan.',
    type: 'website',
    locale: 'id_ID',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BISINDO — Penerjemah Bahasa Isyarat Real-Time',
    description: 'AI-powered BISINDO sign language recognition. Real-time, accessible, free.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)',  color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT LAYOUT
   ───────────────────────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      lang="id" — primary language is Bahasa Indonesia.
      Screen readers (used by Deaf users relying on visual + braille output)
      will use the correct language rules for the aria-live prediction announcements.
    */
    <html lang="id" suppressHydrationWarning>
      <body
        className={[
          sora.variable,
          atkinsonHyperlegibleNext.variable,
          jetbrainsMono.variable,
          /*
            font-sans resolves to Atkinson Hyperlegible Next via
            --font-atkinson-hyperlegible-next in globals.css.
            Sora is applied selectively via font-display utility
            or the [data-prediction-badge] / h1–h6 base rule in globals.css.
          */
          'font-sans antialiased',
        ].join(' ')}
      >
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}