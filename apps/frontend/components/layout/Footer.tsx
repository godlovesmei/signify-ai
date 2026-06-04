import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Linkedin,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const footerGroups = [
  {
    heading: "Products",
    withArrow: true,
    links: [
      { label: "Translate", href: "/translate" },
      { label: "Practice", href: "/practice" },
      { label: "Reference", href: "/reference" },
      { label: "Gesture Library", href: "/reference" },
      { label: "Learning Path", href: "/practice" },
      { label: "History", href: "/history" },
      { label: "Profile", href: "/profile" },
    ],
  },
  {
    heading: "Solutions",
    withArrow: true,
    links: [
      { label: "Education", href: "/how-it-works" },
      { label: "Accessibility", href: "/how-it-works" },
      { label: "Public Services", href: "/research" },
      { label: "Community Learning", href: "/practice" },
      { label: "Research Teams", href: "/research" },
      { label: "Browser Deployment", href: "/how-it-works" },
      { label: "Local-first AI", href: "/research" },
      { label: "Sign Language Dataset", href: "/research" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "/research" },
      { label: "Research", href: "/research" },
      { label: "Documentation", href: "/how-it-works" },
      { label: "Release Notes", href: "/research" },
      { label: "Model Overview", href: "/how-it-works" },
      { label: "BISINDO Guide", href: "/reference" },
      { label: "Accessibility Notes", href: "/terms-condition" },
      { label: "Developer Preview", href: "/research" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/how-it-works" },
      { label: "Research", href: "/research" },
      { label: "Security", href: "/terms-condition" },
      { label: "Trust Center", href: "/terms-condition" },
      { label: "Legal Center", href: "/terms-condition" },
      { label: "Contact", href: "mailto:hello@signify.ai" },
    ],
  },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: Linkedin },
  { label: "Community", href: "/research", icon: MessageCircle },
  { label: "X", href: "https://x.com", icon: X },
  { label: "Email", href: "mailto:hello@signify.ai", icon: Mail },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#111116] text-white">
      <div className="cohere-container flex min-h-[680px] flex-col justify-between py-14 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_2.45fr] lg:gap-24">
          <section className="max-w-[430px]">
            <Logo size="lg" className="text-white" />

            <div className="mt-10">
              <p className="text-[18px] font-medium tracking-[-0.02em] text-[#ff8b82]">
                AI moves fast
              </p>

              <h2 className="mt-2 max-w-sm text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-white md:text-[28px]">
                We’ll keep you up to date with SignifyAI.
              </h2>

              <p className="mt-5 max-w-[380px] text-[14px] leading-[1.55] text-white/45">
                Enter your email below to receive updates about BISINDO recognition,
                accessibility research, and product improvements. You can unsubscribe
                at any time.
              </p>

              <form className="mt-12 max-w-[430px]" action="#">
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>

                <div className="group flex items-center border-b border-white/65 pb-4 transition-colors duration-300 focus-within:border-white hover:border-white">
                  <input
                    id="footer-email"
                    type="email"
                    placeholder="Enter your email"
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-white outline-none placeholder:text-white/45"
                  />

                  <button
                    type="submit"
                    aria-label="Subscribe to updates"
                    className="ml-4 flex size-9 items-center justify-center text-white/45 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                  >
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            </div>
          </section>

          <nav
            aria-label="Footer navigation"
            className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4"
          >
            {footerGroups.map((group) => (
              <section key={group.heading}>
                <h3 className="flex items-center gap-1 text-[20px] font-semibold leading-none tracking-[-0.035em] text-white">
                  {group.heading}
                  {group.withArrow ? (
                    <ArrowRight className="mt-0.5 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  ) : null}
                </h3>

                <ul className="mt-9 space-y-[18px]">
                  {group.links.map((link) => (
                    <li key={`${group.heading}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center text-[16px] font-medium leading-none tracking-[-0.025em] text-white/82 transition-colors duration-300 hover:text-white"
                      >
                        <span className="relative">
                          {link.label}
                          <span className="absolute -bottom-1 left-0 h-px w-0 bg-white/70 transition-all duration-300 group-hover:w-full" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <div className="mt-24 flex flex-col gap-8 md:mt-28 lg:mt-36">
          <div className="flex items-center justify-end gap-5">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex size-6 items-center justify-center text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:text-white"
                >
                  <Icon className="size-[18px]" />
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-5 text-[13px] font-medium text-white/70 md:flex-row md:items-center md:justify-end md:gap-8">
            <p>SignifyAI © 2026</p>

            <Link href="/terms-condition" className="transition-colors hover:text-white">
              Privacy
            </Link>

            <Link href="/terms-condition" className="transition-colors hover:text-white">
              Terms of Use
            </Link>

            <button type="button" className="text-left transition-colors hover:text-white">
              Manage Cookies
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              English
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
