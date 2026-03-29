'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { LoginModal } from '@/components/auth/LoginModal';

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      role="banner"
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        scrolled
          ? 'border-border/40 bg-background/80 backdrop-blur-md shadow-sm'
          : 'border-transparent bg-transparent',
      ].join(' ')}
    >
      <div
        className={[
          'w-full flex items-center justify-between px-6 md:px-10 transition-all duration-300',
          scrolled ? 'h-14' : 'h-16',
        ].join(' ')}
      >
        <Logo size="lg" />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {[
            { label: 'How It Works', href: '/how-it-works' },
            { label: "Who It's For", href: '#who-its-for' },
            { label: 'Research', href: '/research' },
            { label: 'About', href: '/about' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-1 py-1 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-foreground after:transition-all after:duration-300 hover:after:w-full"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="default"
            className="hidden text-sm text-muted-foreground md:inline-flex"
            onClick={() => setLoginOpen(true)}
          >
            Sign In
          </Button>

          <Button
            variant="default"
            size="default"
            className="rounded-xl px-5 text-sm font-semibold"
            onClick={() => setLoginOpen(true)}
          >
            Try Free
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}