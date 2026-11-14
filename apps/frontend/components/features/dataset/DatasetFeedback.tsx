"use client";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { DatasetApiError, datasetErrorKey } from "@/lib/dataset/api";
import { formatFileSize } from "@/lib/dataset/format";
import type { Contribution } from "@/lib/dataset/types";

export { formatFileSize } from "@/lib/dataset/format";
export function VideoSizeError({ empty, sizeBytes, maxSizeBytes }: { empty: boolean; sizeBytes?: number; maxSizeBytes?: number }) {
  const t = useTranslations("workspace.contributions");
  const locale = useLocale();
  return <div role="alert" className="rounded-sm border border-red-700/30 bg-red-700/5 dark:border-red-300/30 dark:bg-red-300/5 p-4 text-sm leading-6">
    <p className="font-medium">{t(empty ? "sizeEmptyTitle" : "sizeLargeTitle")}</p>
    <p className="mt-1">{t(empty ? "sizeEmptyBody" : "sizeLargeBody")}</p>
    {sizeBytes !== undefined && <p>{t("fileSizeActual", { size: formatFileSize(sizeBytes, locale) })}</p>}
    {maxSizeBytes !== undefined && <p>{t("sizeLimit", { value: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(maxSizeBytes / 1048576) })}</p>}
  </div>;
}
export function ContributionReviewFeedback({ contribution, compact = false }: { contribution: Contribution; compact?: boolean }) {
  const t = useTranslations("workspace.contributions");
  if (contribution.status !== "REJECTED") return null;
  return <div className="mt-3 space-y-2 rounded-sm border border-red-700/25 bg-red-700/5 dark:border-red-300/30 dark:bg-red-300/5 p-3 text-sm leading-6">
    <p className="font-medium text-red-700 dark:text-red-300">{t("rejection")}</p>
    <p className="whitespace-pre-wrap break-words">{contribution.rejection_reason?.trim() || t("reasonUnavailable")}</p>
    {!compact && <><p className="text-xs">{t("rejectionNextStep")}</p>
      <Link href={"/contributions/new" + (contribution.proposed_label_text ? "?word=" + encodeURIComponent(contribution.proposed_label_text) : "")}
        className="inline-flex min-h-10 items-center underline underline-offset-4">{t("recordCorrection")}</Link></>}
  </div>;
}

export function DatasetLoading() {
  const t = useTranslations("workspace.contributions");
  return <div role="status" className="flex min-h-48 items-center justify-center gap-3">
    <Loader2 className="size-5 animate-spin" aria-hidden="true" />{t("loading")}
  </div>;
}
export function DatasetErrorNotice({ error, retry, maxSizeBytes }: { error: unknown; retry?: () => void; maxSizeBytes?: number }) {
  const t = useTranslations("workspace.contributions");
  const key = datasetErrorKey(error);
  if (key === "tooLarge" || key === "emptyVideo") return <VideoSizeError empty={key === "emptyVideo"}
    sizeBytes={error instanceof DatasetApiError ? error.details?.size_bytes : undefined}
    maxSizeBytes={(error instanceof DatasetApiError ? error.details?.max_size_bytes : undefined) ?? maxSizeBytes} />;
  return <div role="alert" className="rounded-xl border border-cohere-hairline bg-cohere-stone p-5">
    <p className="text-sm leading-6">{t("errors." + datasetErrorKey(error))}</p>
    {retry && <Button variant="outline" className="mt-3" onClick={retry}>{t("retry")}</Button>}
  </div>;
}
export function ContributionStatus({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const t = useTranslations("workspace.contributions");
  const color = status === "APPROVED" ? "text-emerald-800 dark:text-emerald-300" : status === "REJECTED" ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-300";
  const Icon = status === "APPROVED" ? CheckCircle2 : status === "REJECTED" ? XCircle : Clock3;
  return <span className={"inline-flex max-w-full items-center gap-1.5 whitespace-normal rounded-full border border-cohere-hairline bg-cohere-stone/50 px-2.5 py-1 text-xs " + color}>
    <Icon aria-hidden="true" className="size-3.5 shrink-0" /><span>{t("status." + status)}</span>
  </span>;
}
export function BackToContributions() {
  const t = useTranslations("workspace.contributions");
  return <Link href="/contributions" className="mb-5 inline-flex min-h-10 items-center text-sm underline underline-offset-4">{t("back")}</Link>;
}
