"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Camera,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Mic2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

type MegaLink = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

type MegaMenu = {
  key: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  links: MegaLink[];
  featured: {
    label: string;
    title: string;
    description: string;
    href: string;
  };
};

const megaMenus: MegaMenu[] = [
  {
    key: "product",
    label: "Product",
    eyebrow: "SignifyAI platform",
    title: "A focused AI workspace for BISINDO translation and practice.",
    description:
      "Capture gestures, translate movement, review outputs, and keep learning history in one browser-based interface.",
    links: [
      {
        label: "Translate",
        href: "/translate",
        description: "Turn live camera input into text and speech-ready output.",
        icon: Camera,
      },
      {
        label: "Practice",
        href: "/practice",
        description: "Train recognition accuracy with guided repetition and feedback.",
        icon: GraduationCap,
      },
      {
        label: "Reference",
        href: "/reference",
        description: "Browse curated BISINDO gestures and learning references.",
        icon: BookOpen,
      },
      {
        label: "History",
        href: "/history",
        description: "Review past sessions, transcripts, and translation activity.",
        icon: LayoutDashboard,
      },
    ],
    featured: {
      label: "New workflow",
      title: "Gesture to text in seconds",
      description: "Designed for fast classroom demos, research testing, and independent learning.",
      href: "/how-it-works",
    },
  },
  {
    key: "solutions",
    label: "Solutions",
    eyebrow: "Use cases",
    title: "Built for learning, accessibility, and applied research.",
    description:
      "Use SignifyAI as a student learning tool, a prototype for inclusive communication, or a research-facing AI demo.",
    links: [
      {
        label: "For learners",
        href: "/practice",
        description: "Practice signs repeatedly with structured visual feedback.",
        icon: Sparkles,
      },
      {
        label: "For classrooms",
        href: "/how-it-works",
        description: "Show how computer vision can support sign-language learning.",
        icon: LayoutDashboard,
      },
      {
        label: "For research",
        href: "/research",
        description: "Understand the model scope, dataset limits, and evaluation process.",
        icon: FileText,
      },
      {
        label: "For accessibility",
        href: "/reference",
        description: "Create a bridge between visual gestures and text-based communication.",
        icon: ShieldCheck,
      },
    ],
    featured: {
      label: "Research-ready",
      title: "Explainable by design",
      description: "Clear UI states make it easier to demonstrate model behavior during evaluation.",
      href: "/research",
    },
  },
  {
    key: "resources",
    label: "Resources",
    eyebrow: "Learn and validate",
    title: "Everything needed to understand the product and its boundaries.",
    description:
      "Explore methodology, usage flow, privacy notes, and product references before using the workspace.",
    links: [
      {
        label: "How it works",
        href: "/how-it-works",
        description: "Follow the full camera-to-translation pipeline.",
        icon: Mic2,
      },
      {
        label: "Research notes",
        href: "/research",
        description: "Read the technical rationale and evaluation assumptions.",
        icon: FileText,
      },
      {
        label: "Terms",
        href: "/terms-condition",
        description: "Review usage, privacy, and responsible AI boundaries.",
        icon: ShieldCheck,
      },
      {
        label: "Profile",
        href: "/profile",
        description: "Manage account settings and personal learning records.",
        icon: LayoutDashboard,
      },
    ],
    featured: {
      label: "Responsible AI",
      title: "Clear limits, safer demos",
      description: "The interface is written to avoid overclaiming model capability or real-world coverage.",
      href: "/terms-condition",
    },
  },
];

const utilityLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Research", href: "/research" },
];

function SignInTrigger({
  onClick,
  mobile = false,
}: {
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={mobile ? "lg" : "sm"}
      onClick={onClick}
      className={mobile ? "w-full justify-start" : undefined}
    >
      Sign in
    </Button>
  );
}

function RequestAccessTrigger({
  onClick,
  mobile = false,
}: {
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="primary"
      size={mobile ? "lg" : "md"}
      onClick={onClick}
      className={[
        mobile ? "w-full" : "",
        "overflow-visible transition-[transform,translate,scale,opacity,background-color,border-color,color] data-[disabled=false]:hover:-translate-y-0.5 data-[disabled=false]:hover:opacity-100 data-[disabled=false]:active:scale-[0.97]",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-3 -left-3 -z-10 h-8 w-[82%] rounded-full bg-[linear-gradient(90deg,rgba(255,106,88,0.82)_0%,rgba(214,117,232,0.66)_54%,rgba(96,112,255,0.5)_100%)] opacity-0 blur-xl transition-[width,opacity,transform] duration-500 ease-[var(--ease-cohere)] group-hover/button:w-[96%] group-hover/button:opacity-80 group-focus-visible/button:w-[96%] group-focus-visible/button:opacity-70 group-active/button:opacity-40"
      />
      <span className="relative">Request access</span>
    </Button>
  );
}

function ExploreProductsLink() {
  return (
    <Button
      asChild
      variant="secondary"
      size="sm"
      className="[&_[data-button-underline]]:bg-[linear-gradient(90deg,#ff7a67_0%,#c98cff_52%,#5468ff_100%)] [&_[data-button-underline]]:duration-500"
    >
      <Link href="/translate">Sign in</Link>
    </Button>
  );
}

export default function LandingNavbar() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const searchParams = new URLSearchParams(window.location.search);
      setNextPath(searchParams.get("next"));
      if (searchParams.get("login") === "1") setLoginOpen(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const directionThreshold = 8;
    const hideAfter = 120;

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY.current;

      setScrolled(currentScrollY > 8);

      if (mobileOpen || loginOpen || currentScrollY <= hideAfter) {
        setNavbarVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(delta) < directionThreshold) return;

      if (delta > 0) {
        setNavbarVisible(false);
        setActiveMenu(null);
      } else {
        setNavbarVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loginOpen, mobileOpen]);

  const currentMenu = megaMenus.find((menu) => menu.key === activeMenu);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 text-cohere-ink will-change-transform",
        "transition-transform duration-500 ease-[var(--ease-cohere)] motion-reduce:duration-0",
        navbarVisible ? "translate-y-0" : "-translate-y-full",
      ].join(" ")}
      onMouseLeave={() => setActiveMenu(null)}
      onFocusCapture={() => setNavbarVisible(true)}
    >
      {announcementOpen && (
        <div className="relative flex h-9 items-center justify-center overflow-hidden bg-cohere-black px-10 text-center text-[12px] leading-none text-white">
          <span className="relative z-10 inline-flex items-center gap-2">
            <span className="hidden size-1.5 rounded-full bg-cohere-coral sm:inline-block" />
            SignifyAI workspace is optimized for BISINDO practice.
            <Link href="/research" className="inline-flex items-center gap-1 underline underline-offset-4">
              Learn more <ArrowRight className="size-3" />
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

      <div
        className={[
          "border-b border-cohere-hairline backdrop-blur-xl transition-colors duration-300",
          scrolled ? "bg-cohere-canvas" : "bg-cohere-canvas/95",
        ].join(" ")}
      >
        <div className="cohere-container grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href="/" className="flex items-center" aria-label="Go to SignifyAI homepage">
            <Logo href={false} size="md" />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {megaMenus.map((menu) => {
              const isActive = activeMenu === menu.key;
              return (
                <button
                  key={menu.key}
                  type="button"
                  onMouseEnter={() => setActiveMenu(menu.key)}
                  onFocus={() => setActiveMenu(menu.key)}
                  className={[
                    "group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] leading-none transition-colors",
                    isActive
                      ? "bg-cohere-stone text-cohere-blue"
                      : "text-cohere-ink hover:bg-cohere-stone hover:text-cohere-blue",
                  ].join(" ")}
                  aria-expanded={isActive}
                >
                  {menu.label}
                  <ChevronDown
                    className={[
                      "size-3.5 transition-transform duration-200",
                      isActive ? "rotate-180" : "group-hover:rotate-180",
                    ].join(" ")}
                  />
                </button>
              );
            })}
            {utilityLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setActiveMenu(null)}
                className="rounded-full px-4 py-2 text-[14px] leading-none text-cohere-ink transition-colors hover:bg-cohere-stone hover:text-cohere-blue"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div
            className="hidden items-center justify-end gap-4 lg:flex"
            onMouseEnter={() => setActiveMenu(null)}
          >
            <ExploreProductsLink />
            <RequestAccessTrigger onClick={() => setLoginOpen(true)} />
          </div>

          <div className="flex justify-end lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex size-10 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-canvas text-cohere-ink transition-colors hover:bg-cohere-stone"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {currentMenu && !mobileOpen && (
        <div className="hidden border-b border-cohere-hairline bg-cohere-canvas/98 backdrop-blur-xl lg:block">
          <div className="cohere-container grid gap-8 py-7 lg:grid-cols-[1.05fr_2fr_0.95fr]">
            <div className="border-r border-cohere-hairline pr-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-cohere-blue">
                {currentMenu.eyebrow}
              </p>
              <h2 className="mt-4 max-w-sm text-[24px] font-medium leading-[1.05] tracking-[-0.04em] text-cohere-ink">
                {currentMenu.title}
              </h2>
              <p className="mt-4 max-w-sm text-[14px] leading-[1.6] text-cohere-muted">
                {currentMenu.description}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {currentMenu.links.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveMenu(null)}
                    className="group rounded-sm border border-transparent p-4 transition-colors duration-200 hover:border-cohere-hairline hover:bg-cohere-stone/80"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cohere-stone text-cohere-blue transition-transform duration-200 group-hover:-translate-y-0.5">
                        <Icon className="size-4" />
                      </span>
                      <span>
                        <span className="flex items-center gap-1.5 text-[15px] font-medium text-cohere-ink">
                          {item.label}
                          <ArrowRight className="size-3.5 translate-x-0 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
                        </span>
                        <span className="mt-1.5 block text-[13px] leading-[1.45] text-cohere-muted">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              href={currentMenu.featured.href}
              onClick={() => setActiveMenu(null)}
              className="group relative overflow-hidden rounded-[24px] bg-cohere-primary p-5 text-white"
            >
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl transition-transform duration-300 group-hover:scale-125" />
              <div className="relative z-10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cohere-coral">
                  {currentMenu.featured.label}
                </p>
                <h3 className="mt-16 text-[22px] font-medium leading-[1.05] tracking-[-0.03em]">
                  {currentMenu.featured.title}
                </h3>
                <p className="mt-3 text-[13px] leading-[1.55] text-white/65">
                  {currentMenu.featured.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[13px] text-white">
                  Explore
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-b border-cohere-hairline bg-cohere-canvas lg:hidden">
          <nav className="cohere-container flex flex-col gap-6 py-6" aria-label="Mobile navigation">
            {megaMenus.map((group) => (
              <div key={group.key} className="rounded-lg border border-cohere-hairline bg-cohere-stone p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cohere-blue">{group.label}</p>
                <div className="mt-3 grid gap-1">
                  {group.links.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-sm px-2 py-3 text-cohere-ink transition-colors hover:bg-cohere-canvas"
                      >
                        <Icon className="size-4 text-cohere-blue" />
                        <span>
                          <span className="block text-[16px] leading-none">{item.label}</span>
                          <span className="mt-1 block text-[12px] text-cohere-muted">{item.description}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-5 border-t border-cohere-hairline pt-6">
              <SignInTrigger
                mobile
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
              />

              <RequestAccessTrigger
                mobile
                onClick={() => {
                  setLoginOpen(true);
                  setMobileOpen(false);
                }}
              />
            </div>
          </nav>
        </div>
      )}

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        nextPath={nextPath}
      />
    </header>
  );
}
