"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LanguageSwitcherVariant = "inline" | "footer" | "settings";

export function LanguageSwitcher({
  variant = "inline",
  className,
}: {
  variant?: LanguageSwitcherVariant;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("common");

  const nextLocale = locale === "id" ? "en" : "id";
  const search = searchParams.toString();
  const href = search ? `${pathname}?${search}` : pathname;

  function switchLocale() {
    startTransition(() => {
      router.replace(href, { locale: nextLocale });
    });
  }

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={switchLocale}
        disabled={isPending}
        className={cn("inline-flex items-center gap-1 transition-colors hover:text-white", className)}
        aria-label={`${t("language")}: ${nextLocale === "id" ? t("indonesian") : t("english")}`}
      >
        {nextLocale === "id" ? "ID" : "ENG"}
      </button>
    );
  }

  if (variant === "settings") {
    return (
      <div className={cn("flex gap-1 rounded-md border border-cohere-hairline bg-cohere-stone p-1", className)}>
        {locales.map((item) => {
          const active = item === locale;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                startTransition(() => router.replace(href, { locale: item }));
              }}
              disabled={isPending || active}
              className={cn(
                "min-w-14 rounded-sm px-3 py-1.5 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-cohere-ink text-cohere-canvas"
                  : "text-cohere-muted hover:text-cohere-ink"
              )}
              aria-current={active ? "true" : undefined}
            >
              {item === "id" ? "ID" : "ENG"}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-cohere-hairline px-3 py-1.5 text-xs font-semibold text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink",
        className
      )}
      aria-label={`${t("language")}: ${nextLocale === "id" ? t("indonesian") : t("english")}`}
    >
      <Languages className="size-3.5" aria-hidden="true" />
      {nextLocale === "id" ? "ID" : "ENG"}
    </button>
  );
}
