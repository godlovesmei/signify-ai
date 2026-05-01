import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowUpRight, Github, Twitter } from "lucide-react";

export default function Footer() {
  const linkGroups = [
    {
      heading: "Product",
      links: [
        { label: "How It Works", href: "/how-it-works" },
        { label: "Who It's For", href: "#who-its-for" },
        { label: "Learn Sign Language", href: "/learn" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
      ],
    },
    {
      heading: "Legal & Access",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms-condition" },
        { label: "Accessibility", href: "/accessibility" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-background to-muted/20 overflow-hidden">
      {/* Decorative orb */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none"
      />

      <div className="relative w-full px-6 py-20 md:px-12 lg:px-20">
        <div className="grid gap-12 md:grid-cols-5 max-w-6xl mx-auto">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-5" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground/70 mb-6">
              Breaking communication barriers with AI-powered sign language
              translation. Built with and for the Deaf and Hard of Hearing
              community.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/signifyai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all duration-200 text-muted-foreground hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/signifyai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition-all duration-200 text-muted-foreground hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {linkGroups.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-muted-foreground/50 md:flex-row max-w-6xl mx-auto">
          <p>&copy; 2026 SignifyAI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link
              href="/accessibility"
              className="hover:text-foreground transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
            >
              Accessibility Statement
            </Link>
            <span className="flex items-center gap-1.5 rounded-full glass px-3 py-1 text-xs text-muted-foreground/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              WCAG 2.1 AA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}