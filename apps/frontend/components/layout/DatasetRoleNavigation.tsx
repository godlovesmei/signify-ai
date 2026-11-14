"use client";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { DatasetAccess } from "@/lib/dataset/types";

export default function DatasetRoleNavigation({ access, pathname }: { access?: DatasetAccess | null; pathname: string }) {
  const t = useTranslations("workspace.contributions");
  if (!access?.is_curator) return null;
  const items = [
    ...(access.is_curator ? [{ href: "/curator", label: "curatorPanel", Icon: ShieldCheck }] : []),
  ];
  return <nav aria-label={t("roleNavigation")} className="space-y-1 border-t border-cohere-hairline pt-3">
    <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-cohere-slate">{t("curatorRole")}</p>
    {items.map(({ href, label, Icon }) => {
      const active = pathname === href || pathname.startsWith(href + "/") || (href === "/curator" && pathname === "/contributions/review");
      return <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={cn("flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors", active ? "border border-cohere-hairline bg-cohere-stone text-cohere-ink" : "text-cohere-body-muted hover:bg-cohere-stone")}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />{t(label)}
      </Link>;
    })}
  </nav>;
}
