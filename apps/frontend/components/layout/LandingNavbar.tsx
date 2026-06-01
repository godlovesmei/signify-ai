"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { LoginModal } from "@/components/auth/LoginModal";
import { ArrowRight, Menu, X } from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Research", href: "/research" },
    { label: "About", href: "/about" },
  ];

  return (
    <header
      role="banner"
      className={[
        "fixed top-0 left-0 w-full z-50 transition-all duration-500",
        scrolled || mobileMenuOpen
          ? "glass-strong border-b border-white/10 dark:border-white/5 shadow-lg shadow-black/5"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-6 md:px-8 lg:px-12 py-4 w-full">
        {/* Logo */}
        <Logo size="lg" />

        {/* Desktop Nav */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-2 lg:flex"
        >
          {navLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-5 py-2 text-[13px] font-bold tracking-tight text-muted-foreground/80 transition-all duration-300 hover:text-foreground rounded-full hover:bg-white/5"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full"
            onClick={() => setLoginOpen(true)}
          >
            Sign In
          </Button>

          <Button
            variant="default"
            size="sm"
            className="rounded-full px-8 h-10 text-[13px] font-black btn-luxe-primary hover:scale-[1.05] transition-transform active:scale-[0.95]"
            onClick={() => setLoginOpen(true)}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground/80 hover:text-foreground transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Content */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="pt-6 flex flex-col gap-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-lg font-bold"
                  onClick={() => {
                    setLoginOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full h-14 rounded-2xl text-lg font-black btn-luxe-primary"
                  onClick={() => {
                    setLoginOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}