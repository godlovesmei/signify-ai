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

      <div className="relative w-full px-6 py-24 md:px-8 lg:px-12">
        <div className="grid gap-16 md:grid-cols-6 w-full">
          {/* Brand */}
          <div className="md:col-span-3">
            <Logo size="lg" className="mb-6" />
            <p className="max-w-md text-base leading-relaxed text-muted-foreground/80 mb-8 font-medium">
              Breaking communication barriers with AI-powered sign language
              translation. Built with and for the Deaf and Hard of Hearing
              community.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/signifyai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl glass-panel hover:bg-white/10 transition-all duration-300 text-muted-foreground hover:text-primary hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/signifyai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl glass-panel hover:bg-white/10 transition-all duration-300 text-muted-foreground hover:text-primary hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {linkGroups.map(({ heading, links }) => (
            <div key={heading} className="md:col-span-1">
              <h4 className="mb-6 text-[12px] font-black uppercase tracking-[0.2em] text-foreground/80">
                {heading}
              </h4>
              <ul className="space-y-4">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group inline-flex items-center gap-1 text-[15px] font-medium text-muted-foreground transition-all duration-200 hover:text-primary hover:translate-x-1"
                    >
                      {label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-24 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-10 text-sm text-muted-foreground/70 md:flex-row w-full font-medium">
          <p className="order-2 md:order-1">&copy; 2026 SignifyAI. All rights reserved.</p>
          <div className="flex items-center gap-8 order-1 md:order-2">
            <Link href="/accessibility" className="hover:text-foreground transition-colors">Accessibility Statement</Link>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-[11px] font-bold text-primary border border-primary/20">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              WCAG 2.1 AA
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}