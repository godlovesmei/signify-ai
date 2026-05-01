"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { LoginModal } from "@/components/auth/LoginModal";
import { ArrowRight } from "lucide-react";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Who It's For", href: "#who-its-for" },
    { label: "Research", href: "/research" },
    { label: "About", href: "/about" },
  ];

  return (
    <header
      role="banner"
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "glass-strong border-b border-white/10 shadow-depth-2"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div
        className={[
          "w-full flex items-center justify-between px-6 md:px-12 lg:px-20 transition-all duration-300",
          scrolled ? "h-14" : "h-16",
        ].join(" ")}
      >
        {/* Logo */}
        <Logo size="lg" />

        {/* Desktop Nav */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground/80 transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl hover:bg-white/5"
            >
              {label}
              <span className="absolute bottom-1 left-4 right-4 h-px bg-primary scale-x-0 origin-left transition-transform duration-300 hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="default"
            className="hidden text-sm text-muted-foreground/80 hover:text-foreground hover:bg-white/5 md:inline-flex transition-all duration-200"
            onClick={() => setLoginOpen(true)}
          >
            Sign In
          </Button>

          <Button
            variant="default"
            size="default"
            className="rounded-xl px-5 text-sm font-semibold shadow-glow-primary hover:shadow-glow-primary/80 transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => setLoginOpen(true)}
          >
            Try Free
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}