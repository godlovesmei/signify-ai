"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, UserPlus, UserRoundX } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { datasetApi, DatasetApiError } from "@/lib/dataset/api";
import type { CuratorAccount } from "@/lib/dataset/types";
import { DatasetErrorNotice, DatasetLoading } from "./DatasetFeedback";

export default function DatasetCuratorAccess() {
  const t = useTranslations("workspace.contributions");
  const [items, setItems] = useState<CuratorAccount[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [selected, setSelected] = useState<CuratorAccount | null>(null);
  const lock = useRef(false);
  const operation = useRef<AbortController | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const result = await datasetApi.curators(signal);
      if (!signal?.aborted) { setItems(result.items); setUncertain(false); setSelected(null); }
    } catch (cause) { if (!signal?.aborted) setError(cause); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => () => operation.current?.abort(), []);
  async function changeAccess(revoke?: CuratorAccount) {
    if (lock.current || uncertain) return;
    lock.current = true; setBusy(true); setError(null); setSuccess(false);
    const controller = new AbortController(); operation.current = controller;
    try {
      if (revoke) await datasetApi.revokeCurator(revoke.user_id, revoke.granted_at, controller.signal);
      else await datasetApi.grantCurator(email.trim(), note.trim(), controller.signal);
      if (!controller.signal.aborted) {
        setSuccess(true); if (!revoke) { setEmail(""); setNote(""); }
        await load(controller.signal);
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause); setSelected(null);
        setUncertain(!(cause instanceof DatasetApiError) || [0, 409, 503].includes(cause.status));
      }
    } finally { lock.current = false; if (!controller.signal.aborted) setBusy(false); }
  }
  return <div className="dataset-page dataset-surface mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <div className="flex items-center gap-2 text-xs text-cohere-body-muted"><ShieldCheck className="size-4" aria-hidden="true" />{t("adminRole")}</div>
    <PageHeader title={t("curatorAccess")} description={t("curatorAccessDescription")}
      actions={<Button variant="outline" disabled={loading || busy} onClick={() => void load()}>{t("refreshAccess")}</Button>} />
    {success && <p role="status" className="rounded-sm border border-cohere-green/30 bg-cohere-green/5 p-4 text-sm">{t("accessSaved")}</p>}
    {error != null && <DatasetErrorNotice error={error} />}
    {uncertain && <p role="alert" className="text-sm leading-6">{t("accessUncertain")}</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <form className="space-y-4 rounded-sm border border-cohere-hairline p-5" onSubmit={event => { event.preventDefault(); if (email.trim() && note.trim()) void changeAccess(); }}>
        <h2 className="flex items-center gap-2 font-medium"><UserPlus className="size-4" />{t("grantCurator")}</h2>
        <p className="text-xs leading-5 text-cohere-body-muted">{t("curatorAccountHint")}</p>
        <fieldset disabled={busy || loading || uncertain} className="space-y-4 disabled:opacity-60">
          <label className="block text-sm">{t("curatorEmail")}
            <input type="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)}
              className="mt-2 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas p-3" />
          </label>
          <label className="block text-sm">{t("qualificationNote")}
            <textarea required rows={4} maxLength={2000} value={note} onChange={event => setNote(event.target.value)}
              placeholder={t("qualificationPlaceholder")} className="mt-2 block w-full rounded-sm border border-cohere-hairline bg-cohere-canvas p-3" />
          </label>
          <Button type="submit" disabled={!email.trim() || !note.trim() || busy || loading || uncertain} isLoading={busy}>{t("grantCurator")}</Button>
        </fieldset>
      </form>
      <section className="min-w-0 overflow-hidden rounded-sm border border-cohere-hairline" aria-label={t("curatorAccounts")}>
        <h2 className="border-b border-cohere-hairline p-5 font-medium">{t("curatorAccounts")}</h2>
        {loading ? <DatasetLoading /> : error != null ? null : !items.length ? <p className="p-6 text-sm leading-6 text-cohere-body-muted">{t("noCurators")}</p> : <ul className="divide-y divide-cohere-hairline">
          {items.map(item => <li key={item.user_id} className="space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="break-words text-sm font-medium">{item.display_name || item.email}</p>
                <p className="mt-1 break-all text-xs text-cohere-body-muted">{item.email}</p></div>
              <span className={"rounded-full border border-cohere-hairline px-2.5 py-1 text-xs " + (item.revoked_at ? "text-cohere-slate" : "text-cohere-green dark:text-emerald-300")}>{t(item.revoked_at ? "accessRevoked" : "accessActive")}</span>
            </div>
            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-cohere-body-muted">{item.qualification_note}</p>
            {!item.revoked_at && <Button variant="outline" disabled={busy || uncertain} onClick={() => setSelected(item)}><UserRoundX className="size-4" />{t("revokeAccess")}</Button>}
          </li>)}
        </ul>}
      </section>
    </div>
    <Dialog open={selected !== null} onOpenChange={value => { if (!value && !busy) setSelected(null); }}>
      {selected && <DialogContent className="dataset-dialog dataset-surface" showCloseButton={!busy} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onInteractOutside={event => event.preventDefault()}>
        <DialogTitle>{t("revokeAccess")}</DialogTitle>
        <DialogDescription>{t("revokeConfirm", { email: selected.email })}</DialogDescription>
        <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>{t("cancelAction")}</Button>
          <Button variant="destructive" isLoading={busy} onClick={() => void changeAccess(selected)}>{t("revokeAccess")}</Button></DialogFooter>
      </DialogContent>}
    </Dialog>
  </div>;
}
