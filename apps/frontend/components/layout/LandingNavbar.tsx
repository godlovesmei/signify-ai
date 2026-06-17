"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Camera,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mic2,
  ShieldCheck,
  X,
} from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  DEFAULT_AUTH_DESTINATION,
  sanitizeRelativePath,
} from "@/lib/authRedirect";
import { createClient } from "@/utils/supabase/client";

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

function NavUnderline({ active = false }: { active?: boolean }) {
  return (
    <span
      data-button-underline
      aria-hidden="true"
      className={[
        "pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left rounded-full bg-[linear-gradient(90deg,#ff7a67_0%,#c98cff_52%,#5468ff_100%)] transition-[transform,opacity] duration-500 ease-[var(--ease-cohere)]",
        active
          ? "scale-x-100 opacity-100"
          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100 group-focus-visible:scale-x-100 group-focus-visible:opacity-100",
      ].join(" ")}
    />
  );
}

type LandingNavbarProps = {
  onLoginRequest?: (nextPath: string | null) => void;
};

function SignInTrigger({
  onClick,
  label,
  mobile = false,
}: {
  onClick: () => void;
  label: string;
  mobile?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size={mobile ? "lg" : "sm"}
      onClick={onClick}
      className={
        mobile
          ? "w-full justify-start"
          : "[&_[data-button-underline]]:bg-[linear-gradient(90deg,#ff7a67_0%,#c98cff_52%,#5468ff_100%)] [&_[data-button-underline]]:duration-500"
      }
    >
      {label}
    </Button>
  );
}

function RequestAccessTrigger({
  onClick,
  label,
  mobile = false,
}: {
  onClick: () => void;
  label: string;
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
      <span className="relative">{label}</span>
    </Button>
  );
}

export default function LandingNavbar({ onLoginRequest }: LandingNavbarProps = {}) {
  const router = useRouter();
  const navT = useTranslations("navigation");
  const commonT = useTranslations("common");
  const [loginOpen, setLoginOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  const megaMenus: MegaMenu[] = [
    {
      key: "product",
      label: navT("landing.product.label"),
      eyebrow: navT("landing.product.eyebrow"),
      title: navT("landing.product.title"),
      description: navT("landing.product.description"),
      links: [
        {
          label: navT("workspace.translate"),
          href: "/translate",
          description: navT("landing.links.translateDescription"),
          icon: Camera,
        },
        {
          label: navT("workspace.practice"),
          href: "/practice",
          description: navT("landing.links.practiceDescription"),
          icon: GraduationCap,
        },
        {
          label: navT("workspace.reference"),
          href: "/reference",
          description: navT("landing.links.referenceDescription"),
          icon: BookOpen,
        },
        {
          label: navT("workspace.history"),
          href: "/history",
          description: navT("landing.links.historyDescription"),
          icon: LayoutDashboard,
        },
      ],
      featured: {
        label: navT("landing.product.featuredLabel"),
        title: navT("landing.product.featuredTitle"),
        description: navT("landing.product.featuredDescription"),
        href: "/how-it-works",
      },
    },
    {
      key: "resources",
      label: navT("landing.resources.label"),
      eyebrow: navT("landing.resources.eyebrow"),
      title: navT("landing.resources.title"),
      description: navT("landing.resources.description"),
      links: [
        {
          label: navT("public.howItWorks"),
          href: "/how-it-works",
          description: navT("landing.links.howItWorksDescription"),
          icon: Mic2,
        },
        {
          label: navT("public.research"),
          href: "/research",
          description: navT("landing.links.researchDescription"),
          icon: FileText,
        },
        {
          label: navT("public.terms"),
          href: "/terms-condition",
          description: navT("landing.links.termsDescription"),
          icon: ShieldCheck,
        },
        {
          label: navT("workspace.profile"),
          href: "/profile",
          description: navT("landing.links.profileDescription"),
          icon: LayoutDashboard,
        },
      ],
      featured: {
        label: navT("landing.resources.featuredLabel"),
        title: navT("landing.resources.featuredTitle"),
        description: navT("landing.resources.featuredDescription"),
        href: "/terms-condition",
      },
    },
  ];

  const utilityLinks = [
    { label: navT("public.howItWorks"), href: "/how-it-works" },
    { label: navT("public.research"), href: "/research" },
  ];

  const requestLogin = useCallback(
    async (path: string | null = DEFAULT_AUTH_DESTINATION) => {
      const safeNextPath = sanitizeRelativePath(path);
      setNextPath(safeNextPath);
      setActiveMenu(null);

      if (onLoginRequest) {
        onLoginRequest(safeNextPath);
        return;
      }

      const {
        data: { session },
      } = await createClient().auth.getSession();

      if (session?.user) {
        router.push(safeNextPath);
        return;
      }

      setLoginOpen(true);
    },
    [onLoginRequest, router],
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next");

      if (url.searchParams.get("login") === "1") {
        void requestLogin(next);
        url.searchParams.delete("login");
        url.searchParams.delete("next");

        const cleanSearch = url.searchParams.toString();
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${url.hash}`,
        );
        return;
      }

      setNextPath(next);
    }, 0);

    return () => window.clearTimeout(id);
  }, [requestLogin]);

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
      <div
        className={[
          "backdrop-blur-xl transition-colors duration-300",
          scrolled ? "bg-cohere-canvas" : "bg-cohere-canvas/95",
        ].join(" ")}
      >
        <div className="cohere-container grid h-[68px] grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link
            href="/"
            className="flex items-center"
            aria-label={navT("aria.home")}
          >
            <Logo href={false} size="md" />
          </Link>

          <nav
            aria-label={navT("aria.main")}
            className="hidden items-center gap-1 lg:flex"
          >
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
                      ? "text-cohere-blue"
                      : "text-cohere-ink hover:text-cohere-blue focus-visible:text-cohere-blue",
                  ].join(" ")}
                  aria-expanded={isActive}
                >
                  <span className="relative inline-flex">
                    {menu.label}
                    <NavUnderline active={isActive} />
                  </span>
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
                className="group inline-flex items-center rounded-full px-4 py-2 text-[14px] leading-none text-cohere-ink transition-colors hover:text-cohere-blue focus-visible:text-cohere-blue"
              >
                <span className="relative inline-flex">
                  {item.label}
                  <NavUnderline />
                </span>
              </Link>
            ))}
          </nav>

          <div
            className="hidden items-center justify-end gap-4 lg:flex"
            onMouseEnter={() => setActiveMenu(null)}
          >
            <LanguageSwitcher />
            <SignInTrigger
              label={commonT("signIn")}
              onClick={() => void requestLogin()}
            />
            <RequestAccessTrigger
              label={commonT("requestAccess")}
              onClick={() => void requestLogin()}
            />
          </div>

          <div className="col-start-3 flex justify-end justify-self-end lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="group flex size-11 items-center justify-center rounded-full text-cohere-ink transition-colors hover:bg-cohere-stone"
              aria-label={navT("aria.toggleMobile")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="size-6" />
              ) : (
                <span className="flex flex-col items-end gap-[5px]" aria-hidden="true">
                  <span className="block h-[2px] w-8 rounded-full bg-current" />
                  <span className="block h-[2px] w-8 rounded-full bg-current" />
                  <span className="block h-[2px] w-8 rounded-full bg-current" />
                </span>
              )}
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
                  {commonT("learnMore")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-b border-cohere-hairline bg-cohere-canvas/98 shadow-[0_28px_80px_rgba(23,23,28,0.08)] backdrop-blur-xl lg:hidden">
          <nav
            className="cohere-container max-h-[calc(100dvh-68px)] overflow-y-auto py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            aria-label={navT("aria.mobile")}
          >
            <div className="rounded-[28px] border border-cohere-hairline bg-cohere-canvas p-3">
              <div className="px-1 pb-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cohere-blue">
                  {megaMenus[0].label}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {megaMenus[0].links.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="group flex min-h-[76px] flex-col justify-between rounded-[18px] bg-cohere-stone/70 p-3 text-cohere-ink transition-colors hover:bg-cohere-stone"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex size-9 items-center justify-center rounded-full bg-cohere-canvas text-cohere-blue">
                          <Icon className="size-4" />
                        </span>
                        <ArrowRight className="size-3.5 text-cohere-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </span>
                      <span className="text-[15px] font-medium leading-none">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="my-4 h-px bg-cohere-hairline" />

              <div className="px-1 pb-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-cohere-blue">
                  {megaMenus[1].label}
                </p>
              </div>

              <div className="grid gap-1">
                {megaMenus[1].links.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center justify-between gap-3 rounded-[16px] px-3 py-3 text-cohere-ink transition-colors hover:bg-cohere-stone/80"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-cohere-stone text-cohere-blue">
                          <Icon className="size-4" />
                        </span>
                        <span className="text-[15px] font-medium leading-none">
                          {item.label}
                        </span>
                      </span>
                      <ArrowRight className="size-3.5 text-cohere-muted transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 items-center gap-3 rounded-[24px] border border-cohere-hairline bg-cohere-stone/70 p-3 sm:grid-cols-[1fr_auto]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  void requestLogin();
                  setMobileOpen(false);
                }}
                className="justify-start"
              >
                {commonT("signIn")}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  void requestLogin();
                  setMobileOpen(false);
                }}
              >
                {commonT("requestAccess")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <LanguageSwitcher className="mt-3 justify-center py-2" />
          </nav>
        </div>
      )}

      {!onLoginRequest && (
        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          nextPath={nextPath}
        />
      )}
    </header>
  );
}
