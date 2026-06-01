import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const linkGroups = [
  {
    heading: "Product",
    links: [
      { label: "Translate", href: "/translate" },
      { label: "Practice", href: "/practice" },
      { label: "Reference", href: "/reference" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "Research", href: "/research" },
      { label: "Terms", href: "/terms-condition" },
    ],
  },
  {
    heading: "Access",
    links: [
      { label: "Profile", href: "/profile" },
      { label: "History", href: "/history" },
      { label: "Contact", href: "mailto:hello@signify.ai" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-cohere-primary text-white">
      <div className="cohere-container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo size="lg" className="text-white [&_span:last-child]:text-white" />
            <p className="mt-6 max-w-md text-[14px] leading-[1.6] text-white/60">
              SignifyAI translates BISINDO gestures into text and speech through a restrained,
              browser-based AI workspace.
            </p>
            <form className="mt-10 max-w-md border-b border-white/30 pb-3">
              <label htmlFor="footer-email" className="text-[12px] uppercase text-cohere-coral">
                AI moves fast
              </label>
              <div className="mt-4 flex items-center gap-3">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Email address"
                  className="min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-white/40 outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex size-9 items-center justify-center rounded-sm border border-white/20 text-white transition-colors hover:bg-white hover:text-cohere-primary"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {linkGroups.map((group) => (
              <div key={group.heading}>
                <h2 className="text-[12px] uppercase tracking-normal text-white">
                  {group.heading}
                </h2>
                <ul className="mt-5 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[14px] text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/15 pt-8 text-[12px] text-white/45 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 SignifyAI. All rights reserved.</p>
          <p>WCAG-conscious interface · Local-first camera processing</p>
        </div>
      </div>
    </footer>
  );
}
