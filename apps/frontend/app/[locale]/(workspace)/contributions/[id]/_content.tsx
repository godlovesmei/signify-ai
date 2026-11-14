"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import PrivateContributionVideo from "@/components/features/dataset/PrivateContributionVideo";
import { BackToContributions, ContributionStatus, ContributionReviewFeedback, DatasetErrorNotice, DatasetLoading } from "@/components/features/dataset/DatasetFeedback";
import DatasetReviewNotice from "@/components/features/dataset/DatasetReviewNotice";
import { datasetApi, DatasetApiError } from "@/lib/dataset/api";
import { formatDuration, formatFileSize } from "@/lib/dataset/format";
import type { Contribution, DatasetLabel } from "@/lib/dataset/types";

export default function ContributionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("workspace.contributions");
  const locale = useLocale();
  const [row, setRow] = useState<Contribution | null>(null);
  const [labels, setLabels] = useState<DatasetLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setRow(null); setError(null);
    try {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new DatasetApiError(404, "contribution_not_found");
      const [result, catalog] = await Promise.all([datasetApi.detail(id, signal),
        datasetApi.labels(signal).catch(() => ({ items: [] }))]);
      if (!signal?.aborted) { setRow(result); setLabels(catalog.items); }
    } catch (cause) { if (!signal?.aborted) setError(cause); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const title = labels.find(label => label.id === (row?.final_label_id || row?.proposed_label_id))?.display_name ||
    row?.proposed_label_text || t("detailTitle");
  return <div className="dataset-page dataset-surface mx-auto w-full max-w-6xl p-4 md:p-8">
    <BackToContributions />
    <PageHeader title={title} description={t("detailDescription")} className="mb-6" />
    {loading ? <DatasetLoading /> : error != null ? <DatasetErrorNotice error={error} retry={() => void load()} /> :
      row && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <PrivateContributionVideo key={row.id} id={row.id} />
        <section className="min-w-0 rounded-[22px] border border-cohere-hairline p-5" aria-label={t("metadata")}>
          <ContributionStatus status={row.status} />
          <ContributionReviewFeedback contribution={row} />
          {row.status === "PENDING" && <DatasetReviewNotice />}
          <h2 className="mt-5 font-medium">{t("metadata")}</h2>
          <dl className="mt-3 space-y-3 text-sm">
            {[
              ["identifier", row.id], ["created", new Date(row.created_at).toLocaleString(locale)],
              ["duration", formatDuration(row.duration_ms, locale, 3)],
              ["resolution", row.width + " x " + row.height + " px"],
              ["fps", row.fps == null ? "—" : new Intl.NumberFormat(locale).format(row.fps)],
              ["size", formatFileSize(row.size_bytes, locale, 3)],
              ["container", row.container || "-"], ["codec", row.codec || "-"],
              ["mime", row.mime_type], ["hash", row.source_sha256 || "-"],
              ["policyVersion", row.video_policy_id], ["consentVersion", row.consent_version],
            ].map(([key, value]) => <div key={key} className="border-t border-cohere-hairline pt-3">
              <dt className="text-xs text-cohere-body-muted">{t("fields." + key)}</dt>
              <dd className="mt-1 break-all">{value}</dd>
            </div>)}
          </dl>
        </section>
      </div>}
  </div>;
}
