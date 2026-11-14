"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { datasetApi } from "@/lib/dataset/api";
import type { ReviewInfo } from "@/lib/dataset/types";

function DatasetReviewDetails() {
  const t = useTranslations("workspace.contributions");
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    datasetApi.reviewInfo(controller.signal).then(value => { if (!controller.signal.aborted) setInfo(value); })
      .catch(() => { if (!controller.signal.aborted) setInfo(null); });
    return () => controller.abort();
  }, []);
  return <>
    <p>{t("reviewStages")}</p>
    <p>{info?.available && info.target_business_days ? t("reviewTarget", { days: info.target_business_days }) :
      t(info ? "reviewNotReady" : "reviewTimingUnknown")}</p>
    <p>{t("reviewWhere")}</p>
    {info?.can_review && <Link href="/curator" className="inline-flex min-h-10 items-center underline underline-offset-4">{t("curationTitle")}</Link>}
  </>;
}

export default function DatasetReviewNotice() {
  const t = useTranslations("workspace.contributions");
  return <aside aria-label={t("reviewTimingTitle")} className="my-4 space-y-2 rounded-sm border border-cohere-hairline bg-cohere-stone p-4 text-xs leading-5">
    <h2 className="font-medium">{t("reviewTimingTitle")}</h2>
    <DatasetReviewDetails />
  </aside>;
}

export function DatasetReviewDialog({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("workspace.contributions");
  return <Dialog open>
    <DialogContent showCloseButton={false} className="dataset-dialog dataset-surface max-h-[calc(100dvh-2rem)] overflow-y-auto"
      onEscapeKeyDown={event => event.preventDefault()} onInteractOutside={event => event.preventDefault()}>
      <DialogHeader>
        <DialogTitle>{t("reviewTimingTitle")}</DialogTitle>
      </DialogHeader>
      <DialogDescription asChild>
        <div className="space-y-3 text-sm leading-6 text-cohere-body-muted"><DatasetReviewDetails /></div>
      </DialogDescription>
      <DialogFooter><Button onClick={onConfirm}>{t("reviewConfirm")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
