"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, CheckCircle2, Clock3, Search, ShieldCheck, Video, X, XCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ContributionStatus, DatasetErrorNotice, DatasetLoading } from "./DatasetFeedback";
import PrivateContributionVideo from "./PrivateContributionVideo";
import { DatasetApiError, datasetApi } from "@/lib/dataset/api";
import { formatDuration, formatFileSize } from "@/lib/dataset/format";
import { CONTRIBUTIONS_PAGE_SIZE } from "@/lib/dataset/types";
import { useDatasetLiveUpdates } from '@/hooks/useDatasetLiveUpdates';
import type { Contribution, ContributionCollectionPage, ContributionSummary, DatasetLabel, ReviewInput } from "@/lib/dataset/types";

function ReviewForm({ row, labels, disabled, submit }: {
  row: Contribution; labels: DatasetLabel[]; disabled: boolean; submit: (input: ReviewInput) => void;
}) {
  const t = useTranslations("workspace.contributions");
  const [reason, setReason] = useState("");
  const [label, setLabel] = useState("");
  const [newWord, setNewWord] = useState(row.proposed_label_text || "");
  const approve = Boolean(label) && (label !== "__new__" || Boolean(newWord.trim()));
  return <form onSubmit={event => event.preventDefault()} className="space-y-4">
    <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
      <label className="block text-sm font-medium">{t("reviewFinalLabel")}
        <select value={label} onChange={event => setLabel(event.target.value)}
          className="mt-2 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas p-3 font-normal">
          <option value="">{t("chooseLabel")}</option>
          {labels.map(item => <option value={item.id} key={item.id}>{item.display_name}</option>)}
          <option value="__new__">{t("newFinalLabel")}</option>
        </select>
      </label>
      {label === "__new__" && <label className="block text-sm">{t("newFinalWord")}
        <input type="text" maxLength={160} value={newWord} onChange={event => setNewWord(event.target.value)}
          className="mt-2 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas p-3" />
      </label>}
      <div className="text-sm">
        <label htmlFor="review-reason" className="block font-medium">{t("curationNotes")}</label>
        <textarea id="review-reason" maxLength={2000} rows={4} value={reason} aria-describedby="review-reason-hint"
          placeholder={t("reviewNotesPlaceholder")} onChange={event => setReason(event.target.value)}
          className="mt-2 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas p-3" />
        <p id="review-reason-hint" className="mt-2 text-xs leading-5 text-cohere-body-muted">{t("reviewReasonHint")}</p>
      </div>
      <div className="dataset-actions grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button type="button" disabled={!approve || disabled} onClick={() => submit({ expected_revision: row.revision, decision: "APPROVED",
          ...(label === "__new__" ? { final_label_text: newWord.trim() } : { final_label_id: label }),
          ...(reason.trim() ? { reason: reason.trim() } : {}) })}><Check className="size-4" />{t("approveAction")}</Button>
        <Button type="button" variant="destructive" disabled={!reason.trim() || disabled}
          onClick={() => submit({ expected_revision: row.revision, decision: "REJECTED", reason: reason.trim() })}>
          <X className="size-4" />{t("rejectAction")}</Button>
      </div>
      <p className="text-xs leading-5 text-cohere-body-muted">{t("curationDecisionNote")}</p>
    </fieldset>
  </form>;
}

export default function DatasetCuration() {
  const locale = useLocale();
  const t = useTranslations("workspace.contributions");
  const [page, setPage] = useState<ContributionCollectionPage>({ items: [], next_offset: null, total: 0 });
  const [summary, setSummary] = useState<ContributionSummary | null>(null);
  const [labels, setLabels] = useState<DatasetLabel[]>([]);
  const [criteria, setCriteria] = useState({ offset: 0, q: "" });
  const [status, setStatus] = useState<Contribution['status'] | 'ALL'>('PENDING');
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Contribution | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const load = useCallback(async (signal?: AbortSignal, background = false) => {
    const sequence = ++requestSequence.current;
    if (!background) { setLoading(true); setError(null); }
    try {
      const [queue, catalog, counts] = await Promise.all([
        datasetApi.reviewQueue(criteria.offset, signal, criteria.q, status), datasetApi.labels(signal), datasetApi.reviewSummary(signal),
      ]);
      if (!signal?.aborted && sequence === requestSequence.current) {
        setPage(queue); setLabels(catalog.items); setSummary(counts);
        if (!background) { setSelected(null); setUncertain(false); }
        setError(null);
        if (!queue.items.length && criteria.offset > 0) setCriteria(value => ({ ...value, offset: Math.max(0, value.offset - CONTRIBUTIONS_PAGE_SIZE) }));
      }
    } catch (cause) {
      if (!signal?.aborted && sequence === requestSequence.current) {
        setError(cause);
        if (!background || (cause instanceof DatasetApiError && [401, 403].includes(cause.status))) {
          setPage({ items: [], next_offset: null, total: 0 }); setSummary(null); setSelected(null);
        }
      }
    }
    finally { if (!signal?.aborted && !background && sequence === requestSequence.current) setLoading(false); }
  }, [criteria, status]);
  useEffect(() => {
    const controller = new AbortController(); void load(controller.signal);
    return () => { controller.abort(); requestSequence.current += 1; };
  }, [load]);
  useEffect(() => () => operation.current?.abort(), []);
  useDatasetLiveUpdates(useCallback(() => {
    if (!loading && !lock.current && !uncertain) void load(undefined, true);
  }, [load, loading, uncertain]));
  // Keep the inspected revision and form intact when new arrivals shift a page.
  const row = selected;
  const name = (item: Contribution) => item.proposed_label_text ||
    labels.find(label => label.id === item.proposed_label_id)?.display_name || t("candidate", { id: item.id.slice(0, 8) });
  async function submit(input: ReviewInput) {
    if (!row || lock.current || uncertain) return;
    lock.current = true; setSaving(true); setError(null); setSuccess(false);
    const controller = new AbortController(); operation.current = controller;
    try {
      await datasetApi.review(row.id, input, controller.signal);
      if (!controller.signal.aborted) { setSuccess(true); await load(controller.signal); }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause);
        setUncertain(!(cause instanceof DatasetApiError) || [0, 409, 503].includes(cause.status));
      }
    } finally { lock.current = false; if (!controller.signal.aborted) setSaving(false); }
  }
  return <div className="dataset-page dataset-surface mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <div className="flex items-center gap-2 text-xs text-cohere-body-muted"><ShieldCheck className="size-4" aria-hidden="true" />{t("curatorRole")}<span aria-hidden="true">/</span>{t("curationTitle")}</div>
    <PageHeader title={t("curatorPanel")} description={t("curationDescription")}
      actions={<Button variant="outline" disabled={loading || saving} onClick={() => void load()}>{t("refreshQueue")}</Button>} />
    <p className="text-xs text-cohere-body-muted" role="status">{t('curationAutoUpdates')}</p>
    <p className="flex items-start gap-3 rounded-sm border border-cohere-hairline bg-cohere-stone/40 p-4 text-sm leading-6 text-cohere-body-muted">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-cohere-green dark:text-emerald-300" aria-hidden="true" />{t("curationTechnicalNote")}
    </p>
    <section aria-label={t("curationSummary")} className="grid gap-4 sm:grid-cols-3">
      {([
        { status: "PENDING", note: "curationPendingNote", Icon: Clock3, color: "text-amber-600 dark:text-amber-300" },
        { status: "APPROVED", note: "curationApprovedNote", Icon: CheckCircle2, color: "text-cohere-green dark:text-emerald-300" },
        { status: "REJECTED", note: "curationRejectedNote", Icon: XCircle, color: "text-red-700 dark:text-red-300" },
      ] as const).map(({ status, note, Icon, color }) => <article key={status} className="flex justify-between gap-3 rounded-sm border border-cohere-hairline bg-cohere-stone/25 p-5">
        <div><h2 className="text-xs text-cohere-body-muted">{t("status." + status)}</h2>
          <p className="mt-3 text-3xl font-medium tabular-nums">{loading || !summary ? "—" : new Intl.NumberFormat(locale).format(summary[status])}</p>
          <p className="mt-3 text-xs leading-5 text-cohere-body-muted">{t(note)}</p></div>
        <span className={"h-fit rounded-sm bg-cohere-canvas p-2 " + color}><Icon className="size-5" aria-hidden="true" /></span>
      </article>)}
    </section>
    {success && <p role="status" className="rounded-sm border border-cohere-green/30 bg-cohere-green/5 p-4 text-sm">{t("reviewSaved")}</p>}
    {error != null && !row && <DatasetErrorNotice error={error} retry={() => void load()} />}
    <section className="overflow-hidden rounded-sm border border-cohere-hairline" aria-label={t("reviewQueue")}>
      <div className="flex flex-col justify-between gap-4 border-b border-cohere-hairline p-5 sm:flex-row sm:items-center">
        <div><h2 className="font-medium">{t("reviewQueue")}</h2><p className="mt-1 text-xs leading-5 text-cohere-body-muted">{t("curationQueueHint")}</p></div>
        <label className="text-xs">{t('filterStatus')}
          <select value={status} disabled={saving || uncertain}
            onChange={event => { setStatus(event.target.value as Contribution['status'] | 'ALL'); setCriteria(value => ({ ...value, offset: 0 })); }}
            className="mt-1 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2 text-sm">
            <option value="ALL">{t('allStatuses')}</option>
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(value => <option key={value} value={value}>{t('status.' + value)}</option>)}
          </select>
        </label>
        <form role="search" onSubmit={event => { event.preventDefault(); if (!saving && !uncertain) setCriteria({ offset: 0, q: query.trim() }); }} className="flex min-w-0 gap-2 sm:max-w-xs">
          <label htmlFor="curation-search" className="sr-only">{t("curationSearch")}</label>
          <input id="curation-search" type="search" maxLength={160} disabled={saving || uncertain} value={query}
            onChange={event => setQuery(event.target.value)} placeholder={t("curationSearch")}
            className="min-w-0 flex-1 rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2 text-sm" />
          <Button type="submit" variant="outline" size="icon" disabled={saving || uncertain} aria-label={t("searchButton")}><Search className="size-4" /></Button>
        </form>
      </div>
      {loading ? <DatasetLoading /> : page.items.length ? <div className="dataset-table-container overflow-x-auto"><table className="dataset-table w-full min-w-[880px] text-left text-sm">
        <thead className="border-b border-cohere-hairline bg-cohere-stone/40 text-xs text-cohere-body-muted"><tr>
          {["contributionId", "proposedWord", "contributor", "durationColumn", "sizeColumn", "statusColumn", "actionsColumn"].map(key => <th key={key} scope="col" className="px-5 py-3 font-medium">{t(key)}</th>)}
        </tr></thead>
        <tbody>{page.items.map(item => <tr key={item.id} className="border-b border-cohere-hairline last:border-0 hover:bg-cohere-stone/30">
          <td data-label={t("contributionId")} className="px-5 py-4 font-mono text-xs" title={item.id}>KON-{item.id.slice(0, 8).toUpperCase()}</td>
          <td data-primary="" data-label={t("proposedWord")} className="max-w-64 break-words px-5 py-4 font-medium">{name(item)}</td>
          <td data-label={t("contributor")} className="px-5 py-4 text-xs text-cohere-body-muted">{t("contributorCode", { id: item.user_id.slice(0, 8) })}</td>
          <td data-label={t("durationColumn")} className="px-5 py-4 text-xs">{formatDuration(item.duration_ms, locale)}</td>
          <td data-label={t("sizeColumn")} className="px-5 py-4 text-xs">{formatFileSize(item.size_bytes, locale)}</td>
          <td data-wide="" data-label={t("statusColumn")} className="px-5 py-4"><ContributionStatus status={item.status} /></td>
          <td data-actions="" data-label={t("actionsColumn")} className="px-5 py-4"><Button variant="outline" disabled={saving || uncertain}
            aria-label={t("inspectContribution", { word: name(item) })} onClick={event => { opener.current = event.currentTarget; setSelected(item); setSuccess(false); }}>
            <Video className="size-4" />{t("inspectAction")}</Button></td>
        </tr>)}</tbody>
      </table></div> : error == null && <p className="p-10 text-center text-sm text-cohere-body-muted">{t(criteria.q ? "noResultsTitle" : "reviewQueueEmpty")}</p>}
      {!loading && error == null && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cohere-hairline px-5 py-3">
        <p className="text-xs text-cohere-body-muted">{t("pageOf", { number: Math.floor(criteria.offset / CONTRIBUTIONS_PAGE_SIZE) + 1, total: Math.max(1, Math.ceil(page.total / CONTRIBUTIONS_PAGE_SIZE)) })}</p>
        {(criteria.offset > 0 || page.next_offset !== null) && <nav aria-label={t("pagination")} className="flex gap-2">
          <Button variant="outline" disabled={!criteria.offset || saving || uncertain} onClick={() => setCriteria(value => ({ ...value, offset: Math.max(0, value.offset - CONTRIBUTIONS_PAGE_SIZE) }))}>{t("previous")}</Button>
          <Button variant="outline" disabled={page.next_offset === null || saving || uncertain} onClick={() => setCriteria(value => ({ ...value, offset: page.next_offset! }))}>{t("next")}</Button>
        </nav>}
      </div>}
    </section>
    <Dialog open={Boolean(row)} onOpenChange={value => { if (!value && !saving) setSelected(null); }}>
      {row && <DialogContent className="dataset-dialog dataset-surface max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-5xl" showCloseButton={!saving}
        onEscapeKeyDown={event => { if (saving) event.preventDefault(); }} onInteractOutside={event => event.preventDefault()}
        onCloseAutoFocus={event => { event.preventDefault(); opener.current?.focus(); }}>
        <DialogTitle>{t("reviewCandidate")} · KON-{row.id.slice(0, 8).toUpperCase()}</DialogTitle>
        <DialogDescription>{t("curationDialogHint")}</DialogDescription>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0"><PrivateContributionVideo key={row.id} id={row.id} autoLoad /></div>
          <div className="min-w-0 space-y-5">
            <dl className="divide-y divide-cohere-hairline text-sm">{[
              [t("proposedWord"), name(row)], [t("technicalValidation"), t("technicalPassed")],
              [t("sizeColumn"), formatFileSize(row.size_bytes, locale)],
              [t("resolutionColumn"), row.width + " × " + row.height], [t("durationColumn"), formatDuration(row.duration_ms, locale)],
            ].map(([term, value]) => <div key={term} className="flex justify-between gap-4 py-2.5"><dt className="text-cohere-body-muted">{term}</dt><dd className="break-words text-right font-medium">{value}</dd></div>)}</dl>
            {error != null && <DatasetErrorNotice error={error} />}
            {uncertain && <div role="alert" className="space-y-3 text-sm leading-6"><p>{t("reviewUncertain")}</p><Button variant="outline" disabled={loading || saving} onClick={() => void load()}>{t("refreshQueue")}</Button></div>}
            {row.status === 'PENDING' ? <ReviewForm key={row.id + ":" + row.revision} row={row} labels={labels} disabled={saving || uncertain} submit={input => void submit(input)} /> :
              <div className="space-y-3"><ContributionStatus status={row.status} />
                {row.rejection_reason && <p className="whitespace-pre-line text-sm">{row.rejection_reason}</p>}
                {row.final_label_id && <p className="text-sm">{t('reviewFinalLabel')}: {labels.find(label => label.id === row.final_label_id)?.display_name || row.final_label_id}</p>}
              </div>}
          </div>
        </div>
      </DialogContent>}
    </Dialog>
  </div>;
}
