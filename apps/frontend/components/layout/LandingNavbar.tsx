"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Research", href: "/research" },
  { label: "Terms", href: "/terms-condition" },
];

export default function LandingNavbar() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(true);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-cohere-canvas text-cohere-ink">
      {announcementOpen && (
        <div className="relative flex h-9 items-center justify-center bg-cohere-black px-10 text-center text-[12px] leading-none text-white">
          <span>
            SignifyAI workspace is optimized for BISINDO practice.
            <Link href="/research" className="ml-2 underline underline-offset-4">
              Learn more
            </Link>
          </span>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnouncementOpen(false)}
            className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-white/70 transition-colors hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="border-b border-cohere-hairline">
        <div className="cohere-container grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center">
            <Logo size="md" />
          </div>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[14px] leading-none text-cohere-ink transition-colors hover:text-cohere-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-5 lg:flex">
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="text-[14px] text-cohere-ink underline-offset-4 transition-colors hover:text-cohere-blue hover:underline"
            >
              Sign in
            </button>
            <Button size="sm" onClick={() => setLoginOpen(true)}>
              Request access
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <div className="flex justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex size-10 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-b border-cohere-hairline bg-cohere-canvas lg:hidden">
          <nav className="cohere-container flex flex-col gap-1 py-4" aria-label="Mobile navigation">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-sm px-2 py-3 text-[18px] text-cohere-ink hover:bg-cohere-stone"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-cohere-hairline pt-4">
              <button
                type="button"
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
                className="text-left text-[16px] text-cohere-ink underline underline-offset-4"
              >
                Sign in
              </button>
              <Button
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
              >
                Request access
              </Button>
            </div>
          </nav>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
