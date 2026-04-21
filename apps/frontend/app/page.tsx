'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Footer from '@/components/layout/Footer';
import {
  ArrowRight,
  Globe,
  Shield,
  Play,
  Camera,
  Hand,
  MessageSquare,
  ChevronRight,
  Eye,
  Server,
  FileWarning,
  BookOpen,
  GraduationCap,
  FlaskConical,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   ANIMATION HOOK — respects prefers-reduced-motion
   ───────────────────────────────────────────────────────────────────────────── */
function useIntersectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => {
      el.dataset.visible = 'true';
    };

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SECTION REVEAL WRAPPER
   ───────────────────────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useIntersectionReveal();
  return (
    <div
      ref={ref}
      data-visible="false"
      className={[
        'transition-all duration-700 opacity-0 translate-y-5 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0',
        className,
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener('change', onStoreChange);

  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, getReducedMotionSnapshot, () => false);
}

/* ─────────────────────────────────────────────────────────────────────────────
   TYPEWRITER — demo transcript animation
   Phrases are in Bahasa Indonesia to reflect the app's target language.
   ───────────────────────────────────────────────────────────────────────────── */
const DEMO_PHRASES = [
  'Halo, nama saya Rina.',
  'Saya butuh bantuan.',
  'Terima kasih sudah mengerti.',
  'Di mana pintu keluarnya?',
];

function TypewriterTranscript() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    if (paused) {
      const t = setTimeout(() => {
        setDisplayed(''); setCharIndex(0);
        setPhraseIndex((i) => (i + 1) % DEMO_PHRASES.length);
        setPaused(false);
      }, 2000);
      return () => clearTimeout(t);
    }

    const current = DEMO_PHRASES[phraseIndex];
    if (charIndex < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, 42);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPaused(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [charIndex, paused, phraseIndex, prefersReduced]);

  const visibleText = prefersReduced ? DEMO_PHRASES[phraseIndex] : displayed;

  return (
    <span className="font-medium text-foreground">
      {visibleText}
      {/* Blinking cursor — purely decorative, hidden from screen readers */}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-5 w-0.5 animate-[blink_1s_step-end_infinite] bg-primary align-middle"
      />
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="main-content"
      aria-labelledby="hero-heading"
      className="relative min-h-screen overflow-hidden"
    >
      <Image
        src="/hero.png"
        alt="Seseorang menggunakan bahasa isyarat BISINDO dalam percakapan sehari-hari"
        fill
        className="object-cover object-center"
        priority
        quality={90}
      />
      {/* Gradient: left fully readable, right reveals photo */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/15" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />

      <div className="relative w-full flex min-h-screen flex-col justify-center px-6 pb-24 pt-36 md:px-10">
        <div className="max-w-[580px]">

          {/* Eyebrow — grounds the app in the BISINDO community */}
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-primary animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:100ms]">
            Bahasa Isyarat Indonesia · Untuk komunitas Tuli dan semua orang
          </p>

          {/* H1 — empathy-led, describes the real problem */}
          <h1
            id="hero-heading"
            className="mb-6 text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-[68px] animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:200ms]"
          >
            Isyarat Tanganmu
            <br />
            Menjadi Kata
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Seketika.
            </span>
          </h1>

          {/* Body — plain language, zero jargon */}
          <p className="mb-10 max-w-[460px] text-lg leading-relaxed text-muted-foreground animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:300ms]">
            Kenali alfabet dan kata BISINDO secara real-time langsung dari kamera perangkatmu —
            tanpa unduhan, tanpa akun, langsung di browser.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:400ms]">
            <Button
              variant="default"
              size="lg"
              className="rounded-2xl px-8"
              asChild
            >
              <Link href="/translate">Mulai Deteksi</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-2xl border-border/60 px-8 backdrop-blur-sm"
              asChild
            >
              <Link href="/how-it-works">
                <Play className="mr-2 h-4 w-4 fill-current" aria-hidden="true" />
                Lihat Demo 60 Detik
              </Link>
            </Button>
          </div>

          {/* Objection-removal trust line */}
          <p className="mt-7 text-sm text-muted-foreground/80 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:500ms]">
            Tanpa akun &nbsp;·&nbsp; Bekerja di browser &nbsp;·&nbsp; Gratis selamanya
          </p>
        </div>

        {/* Live transcript preview — floating bottom-left card */}
        <div
          className="absolute bottom-12 left-6 max-w-xs rounded-2xl border border-border/50 bg-background/80 p-4 shadow-xl shadow-black/10 backdrop-blur-md md:left-10 animate-[fadeUp_0.6s_ease_forwards] opacity-0 [animation-delay:700ms]"
          aria-label="Pratinjau hasil deteksi langsung"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_2px_rgba(34,197,102,0.4)] animate-pulse"
            />
            <span className="text-xs font-medium text-muted-foreground">Hasil deteksi langsung</span>
          </div>
          <p className="text-sm leading-relaxed" aria-live="polite" aria-atomic="true">
            <TypewriterTranscript />
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOW IT WORKS
   ───────────────────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS_STEPS = [
  {
    icon: Camera,
    title: 'Buka Kameramu',
    desc: 'Langsung di browser. Tidak perlu mengunduh apapun. Bekerja di ponsel, tablet, maupun laptop.',
  },
  {
    icon: Hand,
    title: 'Tunjukkan Isyarat BISINDO',
    desc: 'AI membaca bentuk tangan dan posisi jari secara real-time, lalu mengenali huruf atau kata alfabet BISINDO.',
  },
  {
    icon: MessageSquare,
    title: 'Lihat Hasilnya Seketika',
    desc: 'Teks hasil terjemahan muncul langsung. Aktifkan Text-to-Speech untuk menyuarakannya dalam Bahasa Indonesia.',
  },
];

function HowItWorksSection() {
  return (
    <section aria-labelledby="how-heading" className="py-28 bg-background">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <h2
            id="how-heading"
            className="mb-16 text-4xl font-bold text-foreground md:text-5xl"
          >
            Cara Kerjanya
          </h2>
        </Reveal>

        <div className="relative grid gap-8 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute top-7 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] hidden h-px border-t-2 border-dashed border-border/60 md:block"
          />

          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="relative flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 hover:bg-primary/20 hover:ring-primary/40">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span
                      aria-hidden="true"
                      className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {i + 1}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LIVE DEMO PREVIEW
   ───────────────────────────────────────────────────────────────────────────── */
function DemoPreviewSection() {
  return (
    <section aria-labelledby="demo-heading" className="py-24 bg-muted/20 border-y border-border/40">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2
              id="demo-heading"
              className="text-4xl font-bold text-foreground md:text-5xl mb-4"
            >
              Coba Tanpa Membuat Akun
            </h2>
            <p className="text-lg text-muted-foreground">
              Rasakan deteksi real-time sebelum masuk. Tidak diperlukan informasi pribadi apapun.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10">
            <div aria-hidden="true" className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <div className="mx-auto rounded-md border border-border/40 bg-background/60 px-4 py-1 text-xs text-muted-foreground">
                bisindo.app/translate
              </div>
            </div>

            <div className="grid md:grid-cols-2 min-h-[280px]">
              <div className="relative flex flex-col items-center justify-center gap-4 border-r border-border/40 bg-muted/30 p-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <Camera className="h-9 w-9 text-primary" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Tampilan kamera muncul di sini
                </p>
                <div
                  aria-hidden="true"
                  className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm border border-border/40"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </div>
              </div>

              <div className="flex flex-col justify-between p-8">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hasil Deteksi
                  </p>
                  <div className="min-h-[80px] rounded-xl bg-muted/40 border border-border/30 p-4">
                    <p className="text-sm leading-relaxed" aria-live="polite">
                      <TypewriterTranscript />
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  className="mt-6 w-full rounded-xl font-semibold"
                  asChild
                >
                  <Link href="/translate">
                    Buka Penerjemah — gratis
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-5 text-center text-sm text-muted-foreground/70">
            Ini adalah pratinjau terbatas. Deteksi penuh tersedia setelah login dengan Google. Butuh 10 detik untuk mulai.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   WHO IT'S FOR
   ───────────────────────────────────────────────────────────────────────────── */
const AUDIENCES = [
  {
    badge: 'Komunitas Tuli & Difabel Rungu',
    title: 'Berkomunikasi Mandiri di Mana Saja',
    desc: 'Saat konsultasi dokter, wawancara kerja, atau sekadar di warung kopi — ungkapkan dirimu tanpa perlu menunggu juru bahasa isyarat.',
    cta: { label: 'Pelajari lebih lanjut', href: '/how-it-works' },
    accent: 'text-primary',
    accentBg: 'bg-primary/8',
    accentBorder: 'border-primary/20',
    icon: Hand,
  },
  {
    badge: 'Guru & Siswa SLB',
    title: 'Latihan Terstruktur dengan Umpan Balik Langsung',
    desc: 'Mode Latihan menampilkan target isyarat dan langsung mengonfirmasi apakah bentuk tangan sudah benar — alat bantu ajar yang merespons siswamu secara real-time.',
    cta: { label: 'Lihat mode latihan', href: '/translate' },
    accent: 'text-accent',
    accentBg: 'bg-accent/8',
    accentBorder: 'border-accent/20',
    icon: GraduationCap,
  },
  {
    badge: 'Peneliti & Pengembang AI',
    title: 'Data Inferensi Terbuka untuk Riset',
    desc: 'Akses koordinat landmark tangan, confidence score per kelas, FPS, dan waktu inferensi langsung dari panel developer yang bisa dikolaps.',
    cta: { label: 'Buka panel developer', href: '/translate' },
    accent: 'text-info',
    accentBg: 'bg-info/8',
    accentBorder: 'border-info/20',
    icon: FlaskConical,
  },
  {
    badge: 'Masyarakat Umum',
    title: 'Pelajari BISINDO dari Nol',
    desc: 'Galeri Referensi menampilkan semua huruf alfabet BISINDO dengan foto dan panduan. Kamu bisa langsung mencobanya di depan kamera dan lihat hasilnya.',
    cta: { label: 'Lihat galeri referensi', href: '/translate' },
    accent: 'text-warning',
    accentBg: 'bg-warning/8',
    accentBorder: 'border-warning/20',
    icon: BookOpen,
  },
];

function WhoItsForSection() {
  return (
    <section id="untuk-siapa" aria-labelledby="audience-heading" className="py-28 bg-background">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <div className="mb-14">
            <Badge className="mb-4 bg-accent/12 text-accent hover:bg-accent/18 border-0 text-xs font-semibold uppercase tracking-wider">
              Dirancang untuk Kebutuhan Nyata
            </Badge>
            <h2
              id="audience-heading"
              className="text-4xl font-bold text-foreground md:text-5xl"
            >
              Siapa yang Menggunakannya
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map(({ badge, title, desc, cta, accent, accentBg, accentBorder, icon: Icon }, i) => (
            <Reveal key={badge} delay={i * 80}>
              <div
                className={[
                  'group relative flex h-full flex-col justify-between rounded-2xl border p-7 transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-1',
                  accentBorder,
                  accentBg,
                ].join(' ')}
              >
                <div>
                  <div className={['mb-4 flex h-10 w-10 items-center justify-center rounded-xl', accentBg.replace('/8', '/15')].join(' ')}>
                    <Icon className={['h-5 w-5', accent].join(' ')} aria-hidden="true" />
                  </div>
                  <span className={['mb-3 block text-xs font-bold uppercase tracking-widest', accent].join(' ')}>
                    {badge}
                  </span>
                  <h3 className="mb-3 text-lg font-bold text-foreground leading-snug">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
                <Link
                  href={cta.href}
                  className={['mt-8 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 group-hover:gap-2.5', accent].join(' ')}
                >
                  {cta.label}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FEATURE DEEP DIVE
   ───────────────────────────────────────────────────────────────────────────── */
const FEATURE_ROWS = [
  {
    icon: Camera,
    eyebrow: 'Deteksi Real-Time',
    title: 'Dari Gerakan Tangan ke Teks dalam < 150ms',
    body: 'YOLO11 mendeteksi dan mengenali gestur tangan secara real-time. Cukup arahkan kamera — model menangani deteksi dan klasifikasi dalam satu langkah.',
    visual: 'bg-gradient-to-br from-primary/10 to-primary/5',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: Globe,
    eyebrow: 'BISINDO & Multibahasa',
    title: 'Alfabet BISINDO, Diperluas Bersama Komunitas',
    body: 'Sistem ini dibangun bersama pengguna BISINDO natif — bukan hanya dari dataset mentah. Dukungan untuk isyarat kata dan frasa sedang dikembangkan secara aktif.',
    visual: 'bg-gradient-to-br from-info/10 to-info/5',
    iconColor: 'text-info',
    iconBg: 'bg-info/10',
  },
  {
    icon: Shield,
    eyebrow: 'Privasi by Design',
    title: 'Video Kameramu Tidak Pernah Meninggalkan Perangkat',
    body: 'Bahasa isyarat adalah komunikasi yang personal. Semua pemrosesan terjadi lokal di browser. Kami tidak menyimpan video, tidak merekam sesi, dan tidak memiliki akses ke kamera — ini bukan kebijakan, ini cara sistemnya dibangun.',
    visual: 'bg-gradient-to-br from-success/10 to-success/5',
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
    highlight: true,
  },
];

function FeatureDeepDiveSection() {
  return (
    <section aria-labelledby="features-heading" className="py-28 bg-muted/10 border-y border-border/30">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <div className="mb-16">
            <Badge className="mb-4 bg-primary/12 text-primary hover:bg-primary/18 border-0 text-xs font-semibold uppercase tracking-wider">
              Kemampuan Sistem
            </Badge>
            <h2
              id="features-heading"
              className="max-w-lg text-4xl font-bold text-foreground md:text-5xl"
            >
              Apa yang Membuat Ini Berbeda
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col gap-14">
          {FEATURE_ROWS.map(({ icon: Icon, eyebrow, title, body, visual, iconColor, iconBg, highlight }, i) => (
            <Reveal key={title} delay={60}>
              <div
                className={[
                  'group grid items-center gap-10 rounded-3xl border border-border/40 p-8 md:p-12 transition-all duration-300 hover:border-border/70 hover:shadow-xl hover:shadow-black/5 bg-card',
                  i % 2 === 0 ? 'md:grid-cols-[1fr_400px]' : 'md:grid-cols-[400px_1fr]',
                  highlight ? 'ring-1 ring-success/20' : '',
                ].join(' ')}
              >
                <div className={i % 2 !== 0 ? 'md:order-2' : ''}>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {eyebrow}
                  </span>
                  <h3 className="mb-4 text-2xl font-bold text-foreground leading-snug md:text-3xl">{title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{body}</p>
                </div>
                <div
                  className={[
                    'flex h-44 items-center justify-center rounded-2xl',
                    visual,
                    i % 2 !== 0 ? 'md:order-1' : '',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'flex h-20 w-20 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110',
                      iconBg,
                    ].join(' ')}
                  >
                    <Icon className={['h-9 w-9', iconColor].join(' ')} aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TRUST & TRANSPARENCY
   ───────────────────────────────────────────────────────────────────────────── */
const TRUST_PILLARS = [
  {
    icon: Eye,
    title: 'Tidak Ada Pemrosesan Cloud',
    desc: 'Kamera diproses lokal di browsermu. Tidak pernah menyentuh server kami — atau server manapun.',
  },
  {
    icon: Server,
    title: 'Tidak Ada Penyimpanan Video',
    desc: 'Tidak ada yang disimpan. Sama sekali. Kami tidak memiliki log sesi, rekaman isyarat, atau rekaman percakapan.',
  },
  {
    icon: FileWarning,
    title: 'Jujur Tentang Keterbatasan',
    desc: 'Model bekerja terbaik di ruangan terang dengan visibilitas tangan yang jelas. Kami mendokumentasikan batasannya — karena kamu berhak tahu sebelum mengandalkannya.',
  },
];

function TrustSection() {
  return (
    <section aria-labelledby="trust-heading" className="py-28 bg-background">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <div className="mb-14 max-w-lg">
            <h2
              id="trust-heading"
              className="text-4xl font-bold text-foreground md:text-5xl mb-4"
            >
              Cara Kami Menjaga Privasimu
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Kamu memberi kami akses ke kamera. Itu hal yang signifikan. Berikut yang terjadi — dan yang tidak terjadi.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {TRUST_PILLARS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 100}>
              <div className="rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-md hover:shadow-black/5">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
                  <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                </div>
                <h3 className="mb-2.5 text-base font-bold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMMUNITY VOICES
   ───────────────────────────────────────────────────────────────────────────── */
function CommunityVoicesSection() {
  return (
    <section aria-labelledby="voices-heading" className="py-28 bg-muted/20 border-y border-border/30">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <h2
            id="voices-heading"
            className="mb-16 text-4xl font-bold text-foreground md:text-5xl"
          >
            Dari Orang-Orang yang Menggunakannya
          </h2>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-12">
          <Reveal className="md:col-span-8" delay={0}>
            <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-10 md:p-12">
              <p className="text-xl leading-relaxed text-foreground md:text-2xl md:leading-relaxed font-medium">
                &ldquo;Saya pakai ini saat wawancara kerja. Untuk pertama kalinya saya tidak perlu
                bertanya apakah mereka punya juru bahasa isyarat. Saya buka laptopnya, langsung
                berfungsi.&rdquo;
              </p>
              <footer className="mt-8">
                <cite className="not-italic">
                  <p className="text-sm font-semibold text-foreground">Rina P.</p>
                  <p className="text-sm text-muted-foreground">Pengguna Tuli, Surabaya</p>
                </cite>
              </footer>
            </blockquote>
          </Reveal>

          <div className="flex flex-col gap-6 md:col-span-4">
            <Reveal delay={80}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;Saya pakai ini di kelas untuk memberi umpan balik ke murid secara langsung
                  apakah isyarat mereka sudah benar. Tidak ada alat lain yang bisa melakukan ini.&rdquo;
                </p>
                <footer className="mt-6">
                  <cite className="not-italic">
                    <p className="text-sm font-semibold text-foreground">Pak Hendra W.</p>
                    <p className="text-xs text-muted-foreground">Guru SLB, Bandung</p>
                  </cite>
                </footer>
              </blockquote>
            </Reveal>
            <Reveal delay={160}>
              <blockquote className="flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-card p-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;Panel developer-nya memberikan akses ke data landmark dan confidence score
                  yang saya butuhkan untuk penelitian. Jarang ada aplikasi yang setransparan ini.&rdquo;
                </p>
                <footer className="mt-6">
                  <cite className="not-italic">
                    <p className="text-sm font-semibold text-foreground">Dimas A.</p>
                    <p className="text-xs text-muted-foreground">Peneliti AI, Universitas Indonesia</p>
                  </cite>
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CTA
   ───────────────────────────────────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="py-28 bg-background">
      <div className="w-full px-6 md:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-10 py-20 text-center md:px-24">
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-accent/10 blur-2xl translate-x-1/4 translate-y-1/4" />

            <div className="relative">
              <h2
                id="cta-heading"
                className="text-4xl font-bold text-primary-foreground md:text-5xl"
              >
                Mulai Berbicara.
                <br />
                Lewat Tanganmu.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg text-primary-foreground/70 leading-relaxed">
                Coba BISINDO gratis di browsermu sekarang. Tanpa unduhan. Tanpa kartu kredit. Tanpa menunggu.
              </p>
              <Button
                variant="surface"
                size="lg"
                className="mt-10 rounded-2xl px-12 text-base font-bold shadow-2xl shadow-black/20"
                asChild
              >
                <Link href="/translate">
                  Mulai Sekarang — Gratis
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
              <p className="mt-4 text-sm text-primary-foreground/50">
                Butuh 10 detik untuk mulai
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ROOT PAGE
   ───────────────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNavbar />
      <main id="main-content">
        <HeroSection />
        <HowItWorksSection />
        <DemoPreviewSection />
        <WhoItsForSection />
        <FeatureDeepDiveSection />
        <TrustSection />
        <CommunityVoicesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}