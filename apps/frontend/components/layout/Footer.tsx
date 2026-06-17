import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Linkedin,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: Linkedin },
  { label: "Community", href: "/research", icon: MessageCircle },
  { label: "X", href: "https://x.com", icon: X },
  { label: "Email", href: "mailto:hello@signify.ai", icon: Mail },
];

export default function Footer() {
  const navT = useTranslations("navigation");

  const footerGroups = [
    {
      heading: navT("footer.groups.products"),
      withArrow: true,
      links: [
        { label: navT("workspace.translate"), href: "/translate" },
        { label: navT("workspace.practice"), href: "/practice" },
        { label: navT("workspace.reference"), href: "/reference" },
        { label: "Gesture Library", href: "/reference" },
        { label: "Learning Path", href: "/practice" },
        { label: navT("workspace.history"), href: "/history" },
        { label: navT("workspace.profile"), href: "/profile" },
      ],
    },
    {
      heading: navT("footer.groups.solutions"),
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
      heading: navT("footer.groups.resources"),
      links: [
        { label: "Blog", href: "/research" },
        { label: navT("public.research"), href: "/research" },
        { label: "Documentation", href: "/how-it-works" },
        { label: "Release Notes", href: "/research" },
        { label: "Model Overview", href: "/how-it-works" },
        { label: "BISINDO Guide", href: "/reference" },
        { label: "Accessibility Notes", href: "/terms-condition" },
        { label: "Developer Preview", href: "/research" },
      ],
    },
    {
      heading: navT("footer.groups.company"),
      links: [
        { label: "About", href: "/how-it-works" },
        { label: navT("public.research"), href: "/research" },
        { label: "Security", href: "/terms-condition" },
        { label: "Trust Center", href: "/terms-condition" },
        { label: "Legal Center", href: "/terms-condition" },
        { label: "Contact", href: "mailto:hello@signify.ai" },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#111116] text-white">
      <div className="cohere-container flex min-h-[680px] flex-col justify-between py-14 md:py-20">
        <div className="grid gap-14 lg:grid-cols-[0.95fr_2.45fr] lg:gap-24">
          <section className="max-w-[430px]">
            <Logo size="lg" className="text-white" />

            <div className="mt-10">
              <p className="text-[18px] font-medium tracking-[-0.02em] text-[#ff8b82]">
                {navT("footer.tagline")}
              </p>

              <h2 className="mt-2 max-w-sm text-[24px] font-semibold leading-[1.15] tracking-[-0.035em] text-white md:text-[28px]">
                {navT("footer.title")}
              </h2>

              <p className="mt-5 max-w-[380px] text-[14px] leading-[1.55] text-white/45">
                {navT("footer.description")}
              </p>

              <form className="mt-12 max-w-[430px]" action="#">
                <label htmlFor="footer-email" className="sr-only">
                  {navT("footer.emailLabel")}
                </label>

                <div className="group flex items-center border-b border-white/65 pb-4 transition-colors duration-300 focus-within:border-white hover:border-white">
                  <input
                    id="footer-email"
                    type="email"
                    placeholder={navT("footer.emailPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-white outline-none placeholder:text-white/45"
                  />

                  <button
                    type="submit"
                    aria-label={navT("footer.subscribe")}
                    className="ml-4 flex size-9 items-center justify-center text-white/45 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                  >
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </form>
            </div>
          </section>

          <nav
            aria-label={navT("aria.footer")}
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
              {navT("footer.privacy")}
            </Link>

            <Link href="/terms-condition" className="transition-colors hover:text-white">
              {navT("footer.terms")}
            </Link>

            <button type="button" className="text-left transition-colors hover:text-white">
              {navT("footer.cookies")}
            </button>

            <LanguageSwitcher variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  );
}
