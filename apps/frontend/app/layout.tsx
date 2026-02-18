import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Signify.ai — Real-Time Sign Language Translator',
  description:
    'AI-powered real-time sign language translation using advanced computer vision. Break communication barriers instantly.',
  keywords: ['sign language', 'AI', 'translation', 'ASL', 'BISINDO', 'accessibility'],
  authors: [{ name: 'Signify AI Team' }],
  openGraph: {
    title: 'Signify.ai — Real-Time Sign Language Translator',
    description: 'Break communication barriers with AI-powered sign language translation',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}