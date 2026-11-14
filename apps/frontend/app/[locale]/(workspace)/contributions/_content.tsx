"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Video, Play, Search, FileVideo, Clock3, CheckCircle2, XCircle, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PageHeader from "@/components/layout/PageHeader";
import PrivateContributionVideo from "@/components/features/dataset/PrivateContributionVideo";
import { ContributionStatus, ContributionReviewFeedback, DatasetErrorNotice, DatasetLoading } from "@/components/features/dataset/DatasetFeedback";
import DatasetReviewNotice from "@/components/features/dataset/DatasetReviewNotice";
import { datasetApi } from "@/lib/dataset/api";
import { formatDuration, formatFileSize } from "@/lib/dataset/format";
import { CONTRIBUTIONS_PAGE_SIZE } from "@/lib/dataset/types";
import type { Contribution, ContributionCollectionPage, ContributionSummary, ContributionStatusValue, DatasetLabel } from "@/lib/dataset/types";

export default function ContributionsContent() {
  const t = useTranslations("workspace.contributions");
  const locale = useLocale();
  const [page, setPage] = useState<ContributionCollectionPage>({ items: [], next_offset: null, total: 0 });
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [labels, setLabels] = useState<DatasetLabel[]>([]);
  const [criteria, setCriteria] = useState<{ offset: number; q: string; status?: ContributionStatusValue }>({ offset: 0, q: "" });
  const [query, setQuery] = useState("");
  const [submitted] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("submitted") || "");
  const [selected, setSelected] = useState<Contribution | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const [result, catalog, counts] = await Promise.all([
        datasetApi.list(criteria.offset, signal, { q: criteria.q, status: criteria.status }),
        datasetApi.labels(signal).catch(() => ({ items: [] })),
        datasetApi.summary(signal),
      ]);
      if (!signal?.aborted) { setPage(result); setLabels(catalog.items); setSummary(counts); }
    } catch (cause) { if (!signal?.aborted) { setError(cause); setPage({ items: [], next_offset: null, total: 0 }); setSummary(null); } }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [criteria]);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  function name(item: Contribution) {
    return labels.find(label => label.id === (item.final_label_id || item.proposed_label_id))?.display_name ||
      item.proposed_label_text || t("candidate", { id: item.id.slice(0, 8) });
  }
  function open(item: Contribution, button: HTMLButtonElement) { opener.current = button; setSelected(item); }
  const confirmed = !loading && error == null && page.items.some(item => item.id === submitted);
  return <div className="dataset-page dataset-surface mx-auto w-full max-w-6xl p-4 md:p-8">
    <PageHeader title={t("title")} description={t("description")} className="mb-6"
      actions={<Button asChild><Link href="/contributions/new"><Plus className="size-4" />{t("new")}</Link></Button>} />
    {confirmed && <div role="status" className="mb-5 flex items-start gap-3 rounded-sm border border-cohere-green/30 bg-cohere-green/5 p-4">
      <Check className="mt-0.5 size-5 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
      <div><p className="text-sm font-medium">{t("sentTitle")}</p><p className="mt-1 text-xs leading-5 text-cohere-body-muted">{t("sentBody")}</p></div>
    </div>}
    <section aria-label={t("summaryLabel")} className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {[
        { key: "total" as const, title: "totalContributions", note: "totalNote", Icon: FileVideo, color: "text-cohere-slate" },
        { key: "PENDING" as const, title: "status.PENDING", note: "pendingNote", Icon: Clock3, color: "text-amber-700 dark:text-amber-300" },
        { key: "APPROVED" as const, title: "status.APPROVED", note: "approvedNote", Icon: CheckCircle2, color: "text-emerald-800 dark:text-emerald-300" },
        { key: "REJECTED" as const, title: "status.REJECTED", note: "rejectedNote", Icon: XCircle, color: "text-red-700 dark:text-red-300" },
      ].map(({ key, title, note, Icon, color }) => <article key={key} className="flex flex-col items-start gap-2 rounded-sm border border-cohere-hairline bg-cohere-stone/35 p-3 sm:flex-row sm:gap-3 sm:p-4">
        <span className={"rounded-full bg-cohere-canvas p-2 " + color}><Icon className="size-4" aria-hidden="true" /></span>
        <div className="min-w-0"><h2 className="text-xs font-medium">{t(title)}</h2>
          <p className="mt-2 text-2xl font-medium tabular-nums">{loading || !summary ? "—" : new Intl.NumberFormat(locale).format(summary[key])}</p>
          <p className="mt-1 text-[11px] leading-4 text-cohere-body-muted">{t(note)}</p>
        </div>
      </article>)}
    </section>
    <DatasetReviewNotice />
    <form role="search" onSubmit={event => { event.preventDefault(); setCriteria(value => ({ ...value, offset: 0, q: query.trim() })); }}
      className="mb-5 flex flex-col gap-3 sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-cohere-slate" aria-hidden="true" />
        <label htmlFor="collection-search" className="sr-only">{t("searchLabel")}</label>
        <input id="collection-search" type="search" maxLength={160} value={query} onChange={event => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")} className="min-h-10 w-full rounded-sm border border-cohere-hairline bg-cohere-canvas py-2 pl-9 pr-3 text-sm" />
      </div>
      <Button type="submit" variant="outline">{t("searchButton")}</Button>
      <label className="sr-only" htmlFor="collection-status">{t("filterStatus")}</label>
      <select id="collection-status" value={criteria.status || ""}
        onChange={event => setCriteria(value => ({ ...value, offset: 0, status: (event.target.value || undefined) as ContributionStatusValue | undefined }))}
        className="min-h-10 rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2 text-sm sm:w-48">
        <option value="">{t("allStatuses")}</option>
        {(["PENDING", "APPROVED", "REJECTED"] as const).map(status => <option value={status} key={status}>{t("status." + status)}</option>)}
      </select>
    </form>
    <section aria-label={t("recentTitle")} className="overflow-hidden rounded-sm border border-cohere-hairline">
      <div className="border-b border-cohere-hairline px-4 py-4">
        <h2 className="text-sm font-medium">{t("recentTitle")}</h2>
      </div>
      {loading ? <DatasetLoading /> : error != null ? <div className="p-4"><DatasetErrorNotice error={error} retry={() => void load()} /></div> :
        !page.items.length ? <div className="flex min-h-64 flex-col items-center justify-center bg-cohere-stone/30 p-8 text-center">
          <Video className="mb-4 size-8 text-cohere-slate" aria-hidden="true" />
          <h3 className="text-xl">{t(criteria.q || criteria.status ? "noResultsTitle" : "emptyTitle")}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-cohere-body-muted">{t(criteria.q || criteria.status ? "noResultsBody" : "emptyBody")}</p>
        </div> : <div className="dataset-table-container overflow-x-auto">
          <table className="dataset-table w-full min-w-[580px] text-left text-sm">
            <thead className="border-b border-cohere-hairline bg-cohere-stone/50 text-xs text-cohere-body-muted"><tr>
              <th scope="col" className="px-4 py-3 font-medium">{t("wordColumn")}</th><th scope="col" className="px-4 py-3 font-medium">{t("dateColumn")}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t("statusColumn")}</th><th scope="col" className="px-4 py-3 text-right font-medium">{t("actionsColumn")}</th>
            </tr></thead>
            <tbody>{page.items.map(item => <tr key={item.id} className="border-b border-cohere-hairline last:border-0 hover:bg-cohere-stone/40">
              <td data-primary="" data-label={t("wordColumn")} className="max-w-64 px-4 py-4"><div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-cohere-hairline bg-cohere-stone"><Video className="size-4 text-cohere-slate" aria-hidden="true" /></span>
                <button type="button" onClick={event => open(item, event.currentTarget)} className="min-w-0 flex-1 whitespace-normal break-words text-left font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">{name(item)}</button>
              </div></td>
              <td data-label={t("dateColumn")} className="px-4 py-4 text-xs leading-5 text-cohere-body-muted">
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}<br />{new Date(item.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time>
              </td>
              <td data-label={t("statusColumn")} data-wide={item.status === "REJECTED" ? "" : undefined} className="max-w-80 px-4 py-4"><ContributionStatus status={item.status} /><ContributionReviewFeedback contribution={item} compact /></td>
              <td data-actions="" data-label={t("actionsColumn")} className="px-4 py-4 text-right"><Button variant="outline" size="icon-xs" aria-label={t("playContribution", { word: name(item) })}
                onClick={event => open(item, event.currentTarget)}><Play className="size-3.5" /><span data-mobile-action="">{t("playVideo")}</span></Button></td>
            </tr>)}</tbody>
          </table>
        </div>}
      {!loading && error == null && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cohere-hairline px-4 py-3">
        <p className="text-xs text-cohere-body-muted">{t("pageOf", { number: Math.floor(criteria.offset / CONTRIBUTIONS_PAGE_SIZE) + 1, total: Math.max(1, Math.ceil(page.total / CONTRIBUTIONS_PAGE_SIZE)) })}</p>
        {(criteria.offset > 0 || page.next_offset != null) && <nav aria-label={t("pagination")} className="flex items-center gap-3">
          <Button variant="outline" disabled={criteria.offset === 0} onClick={() => setCriteria(value => ({ ...value, offset: Math.max(0, value.offset - CONTRIBUTIONS_PAGE_SIZE) }))}>{t("previous")}</Button>
          <Button variant="outline" disabled={page.next_offset == null} onClick={() => setCriteria(value => ({ ...value, offset: page.next_offset! }))}>{t("next")}</Button>
        </nav>}
      </div>}
    </section>
    <Dialog open={selected != null} onOpenChange={value => { if (!value) setSelected(null); }}>
      {selected && <DialogContent className="dataset-dialog dataset-surface max-h-[90dvh] overflow-y-auto sm:max-w-2xl" onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
        <DialogTitle className="pr-6">{name(selected)}</DialogTitle>
        <DialogDescription>{t("previewDescription")}</DialogDescription>
        <div><ContributionStatus status={selected.status} /></div>
        <PrivateContributionVideo key={selected.id} id={selected.id} autoLoad />
        <ContributionReviewFeedback contribution={selected} />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cohere-hairline pt-3 text-xs text-cohere-body-muted">
          <span>{formatDuration(selected.duration_ms, locale)} · {selected.width} × {selected.height} · {formatFileSize(selected.size_bytes, locale)}</span>
          <Link href={"/contributions/" + selected.id} className="underline underline-offset-4">{t("technicalDetails")}</Link>
        </div>
      </DialogContent>}
    </Dialog>
  </div>;
}
