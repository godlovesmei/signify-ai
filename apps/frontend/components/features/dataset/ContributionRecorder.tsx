"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, Square, RotateCcw, Send, ShieldCheck, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { DatasetErrorNotice, DatasetLoading, VideoSizeError } from "./DatasetFeedback";
import { DatasetReviewDialog } from "./DatasetReviewNotice";
import ContributionGuide from "./ContributionGuide";
import { DatasetApiError, datasetApi, uploadContribution } from "@/lib/dataset/api";
import { formatDuration } from "@/lib/dataset/format";
import { getDatasetConsent } from "@/lib/dataset/config";
import { useDatasetRecorder } from "@/hooks/useDatasetRecorder";
import type { DatasetLabel, UploadMetadata, VideoPolicy } from "@/lib/dataset/types";

const normalizeWord = (value: string) => value.trim().replace(/\s+/g, " ").normalize("NFC").toLocaleLowerCase("id");

export default function ContributionRecorder() {
  const t = useTranslations("workspace.contributions");
  const router = useRouter();
  const locale = useLocale();
  const [policy, setPolicy] = useState<VideoPolicy | null>(null);
  const [labels, setLabels] = useState<DatasetLabel[]>([]);
  const [word, setWord] = useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("word");
    return value && value.length <= 160 ? value : "";
  });
  const [loading, setLoading] = useState(true);
  const [policyMissing, setPolicyMissing] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<unknown>(null);
  const operation = useRef<{ key: string; blob: Blob; proposal: string; version: string } | null>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const approvedConsent = getDatasetConsent();
  const capture = useDatasetRecorder(policy);
  const cleanWord = word.trim();
  const validWord = cleanWord.length > 0 && cleanWord.length <= 160 && !/[\u0000-\u001f\u007f]/.test(cleanWord);
  const catalogLabel = labels.find(item => normalizeWord(item.display_name) === normalizeWord(cleanWord));
  const proposal = catalogLabel ? { proposed_label_id: catalogLabel.id } : { proposed_label_text: cleanWord };
  const proposalKey = JSON.stringify(proposal);
  const activeCamera = ["opening", "ready", "countdown", "recording"].includes(capture.phase);
  const frozen = busy || uncertain || submittedId !== null;
  const currentStep = frozen ? 3 : capture.recording ? 2 : activeCamera ? 1 : 0;
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError(null); setPolicyMissing(false);
    const [policyResult, labelResult] = await Promise.allSettled([datasetApi.policy(signal), datasetApi.labels(signal)]);
    if (signal?.aborted) return;
    if (policyResult.status === "fulfilled") setPolicy(policyResult.value);
    else {
      setPolicy(null);
      const error = policyResult.reason;
      if (error instanceof DatasetApiError && error.code === "video_policy_unavailable") setPolicyMissing(true);
      else setLoadError(error);
    }
    if (labelResult.status === "fulfilled") setLabels(labelResult.value.items);
    else { setLabels([]); setLoadError(labelResult.reason); }
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => { controller.abort(); uploadAbort.current?.abort(); };
  }, [load]);
  useEffect(() => {
    if (!busy && !uncertain) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy, uncertain]);

  async function send() {
    const recording = capture.recording;
    if (locked.current || submittedId !== null || !recording || !policy || !validWord || !consent || !approvedConsent || loadError != null) return;
    locked.current = true;
    setBusy(true); setUploadError(null); setProgress(0);
    if (!operation.current || operation.current.blob !== recording.blob ||
        operation.current.proposal !== proposalKey || operation.current.version !== approvedConsent.version) {
      operation.current = { key: crypto.randomUUID(), blob: recording.blob, proposal: proposalKey, version: approvedConsent.version };
    }
    const controller = new AbortController();
    uploadAbort.current = controller;
    try {
      const metadata: UploadMetadata = { ...proposal, consent: true, consent_version: approvedConsent.version };
      const result = await uploadContribution(recording.blob, metadata, operation.current.key, setProgress, controller.signal);
      setUncertain(false);
      setSubmittedId(result.contribution.id);
    } catch (error) {
      if (!controller.signal.aborted) {
        setUploadError(error);
        // An uncertain write freezes bytes, proposal, consent and key for safe reconciliation.
        setUncertain(!(error instanceof DatasetApiError) || ([0, 503].includes(error.status) || error.code === "upload_in_progress"));
      }
    } finally { if (!controller.signal.aborted) setBusy(false); locked.current = false; }
  }
  function openCamera() {
    operation.current = null; setUploadError(null); setConsent(false); void capture.openCamera();
  }
  function replay() {
    if (preview.current) { preview.current.currentTime = 0; void preview.current.play().catch(() => undefined); }
  }
  if (loading) return <DatasetLoading />;
  return <div className="dataset-surface min-w-0 space-y-5">
    {loadError != null && <DatasetErrorNotice error={loadError} retry={() => void load()} />}
    {policyMissing && <div role="status" className="rounded-sm border border-cohere-hairline bg-cohere-stone p-5">
      <h2 className="font-medium">{t("policyMissingTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-cohere-body-muted">{t("policyMissingBody")}</p>
      <Button variant="outline" className="mt-3" onClick={() => void load()}>{t("retry")}</Button>
    </div>}
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 space-y-4">
        <ol aria-label={t("stepsLabel")} className="grid grid-cols-4 gap-2 pb-1">
          {["stepWord", "stepRecord", "stepReview", "stepSend"].map((key, index) => <li key={key}
            aria-current={index === currentStep ? "step" : undefined} className="flex min-w-0 flex-col items-center gap-1.5 text-center text-xs sm:flex-row sm:gap-2 sm:text-left">
            <span className={"flex size-7 shrink-0 items-center justify-center rounded-full border " +
              (index === currentStep ? "border-cohere-primary bg-cohere-primary text-white dark:border-cohere-ink dark:bg-cohere-ink dark:text-cohere-canvas" : "border-cohere-hairline bg-cohere-stone text-cohere-body-muted")}>
              {index + 1}
            </span>
            <span className={index === currentStep ? "font-medium" : "text-cohere-body-muted"}>{t(key)}</span>
          </li>)}
        </ol>
        <section className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-4">
          <label htmlFor="contribution-word" className="block text-sm font-medium">{t("wordLabel")}</label>
          <input id="contribution-word" type="text" value={word} list="contribution-catalog" maxLength={160}
            autoComplete="off" disabled={activeCamera || Boolean(capture.recording) || frozen}
            aria-describedby="contribution-word-hint" placeholder={t("wordPlaceholder")}
            onChange={event => { setWord(event.target.value); setConsent(false); }}
            className="mt-2 w-full rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cohere-focus" />
          <datalist id="contribution-catalog">{labels.map(item => <option key={item.id} value={item.display_name} />)}</datalist>
          <p id="contribution-word-hint" className="mt-2 text-xs leading-5 text-cohere-body-muted">{t("wordHint")}</p>
          {validWord && <p role="status" className="mt-3 rounded-sm bg-cohere-stone px-3 py-2 text-xs leading-5">
            {t(catalogLabel ? "wordExisting" : "wordProposed")}
          </p>}
          {!labels.length && <p className="mt-2 text-xs leading-5 text-cohere-body-muted">{t("labelsEmpty")}</p>}
        </section>
        <section aria-label={t("cameraTitle")} className="min-w-0">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-cohere-primary p-1.5 text-white">
            <div className="flex items-center justify-between px-2 py-2 text-[11px] text-white/60">
              <span className="flex items-center gap-2"><span aria-hidden="true" className={"size-1.5 rounded-full " + (activeCamera ? "bg-cohere-green" : "bg-white/30")} />{t("cameraTitle")}</span>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-black/25">
              <video ref={capture.videoRef} autoPlay muted playsInline aria-label={t("cameraTitle")}
                style={{ transform: capture.mirrored ? "scaleX(-1)" : "none" }}
                className={"h-full w-full object-contain " + (capture.recording ? "hidden" : "")} />
              {capture.recording && <video ref={preview} controls playsInline preload="metadata" src={capture.recording.url}
                aria-label={t("preview")} className="absolute inset-0 h-full w-full object-contain" />}
              {!activeCamera && !capture.recording && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <Camera className="size-10 text-white/35" aria-hidden="true" />
                <p className="max-w-sm text-sm leading-6 text-white/60">{t(policy && validWord ? "cameraIdle" : "cameraBlocked")}</p>
              </div>}
              {activeCamera && <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute left-3 top-3 size-4 border-l border-t border-white/40" />
                <div className="absolute bottom-3 right-3 size-4 border-b border-r border-white/40" />
                <div data-recording-guide className="absolute inset-x-[10%] inset-y-[12%] rounded-sm border border-emerald-300 bg-emerald-300/10 shadow-[0_0_0_1px_rgba(255,255,255,0.25)] sm:inset-y-[8%]" />
              </div>}
              {capture.phase === "countdown" && <div role="status" className="absolute inset-0 flex items-center justify-center bg-black/30 font-mono text-8xl text-white">{capture.countdown}</div>}
              {capture.phase === "recording" && <div role="status" className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 font-mono text-xs text-white">
                <span aria-hidden="true" className="size-2 rounded-full bg-red-400" />{t("recording")} {formatDuration(capture.elapsed, locale)}
              </div>}
            </div>
            <div className="space-y-2 px-3 py-3 text-xs">
              <p>{t("recordingDurationGuide")}</p>
              <progress aria-label={t("recordingDurationProgress")} max={7}
                value={Math.min(7, (capture.recording?.durationMs ?? capture.elapsed) / 1000)}
                className="h-2 w-full accent-emerald-300" />
              <div className="flex justify-between text-white/70"><span>0s</span><span>{t("recordingMin")}</span><span>{t("recordingMax")}</span></div>
              <p aria-live="polite" className="text-emerald-200">{t(capture.phase === "recording" && !capture.canStop ? "recordingWaitMin" : "recordingRecommended")}</p>
            </div>
            <fieldset disabled={frozen || !["idle", "ready"].includes(capture.phase)}
              aria-describedby="contribution-mirror-hint" className="space-y-2 px-2 py-3 text-xs disabled:opacity-60">
              <legend className="pt-3 font-medium">{t("videoOrientation")}</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="contribution-mirror" checked={!capture.mirrored}
                    onChange={() => capture.setMirrored(false)} className="size-4 accent-emerald-300" />{t("noMirror")}
                </label>
                <label className="flex min-h-11 items-center gap-2">
                  <input type="radio" name="contribution-mirror" checked={capture.mirrored}
                    onChange={() => capture.setMirrored(true)} className="size-4 accent-emerald-300" />{t("mirror")}
                </label>
              </div>
              <p id="contribution-mirror-hint" className="leading-5 text-white/60">{t("mirrorHint")}</p>
            </fieldset>
            {!capture.recording && <div className="flex flex-wrap gap-2 p-2">
              {capture.phase === "idle" && <Button variant="onDark" className="flex-1" onClick={openCamera}
                disabled={!policy || !validWord || frozen || loadError != null}><Camera className="size-4" />{t("openCamera")}</Button>}
              {capture.phase === "ready" && <Button variant="onDark" className="flex-1" onClick={capture.start}><Circle className="size-4" />{t("start")}</Button>}
              {capture.phase === "recording" && <Button variant="destructive" className="flex-1" disabled={!capture.canStop} onClick={capture.stop}><Square className="size-4" />{t("stop")}</Button>}
              {activeCamera && capture.phase !== "recording" && <Button variant="outlineOnDark" onClick={capture.close}>{t("closeCamera")}</Button>}
            </div>}
          </div>
          {capture.error && <div className="mt-3">{capture.error === "tooLarge" || capture.error === "emptyVideo" ?
            <VideoSizeError empty={capture.error === "emptyVideo"} sizeBytes={capture.errorSizeBytes ?? undefined} maxSizeBytes={policy?.max_size_bytes} /> :
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{t("captureErrors." + capture.error)}</p>}</div>}
        </section>
        <section aria-label={t("consentTitle")} className="space-y-3">
          {approvedConsent ? <>
            <label className="flex items-start gap-2.5 text-xs leading-5">
              <input type="checkbox" checked={consent} disabled={frozen} className="mt-0.5 size-4 shrink-0 accent-cohere-primary"
                onChange={event => setConsent(event.target.checked)} />{t("consent", { version: approvedConsent.version })}
            </label>
            <details className="rounded-sm border border-cohere-hairline px-3 py-2 text-xs">
              <summary className="cursor-pointer font-medium">{t("consentTitle")}</summary>
              <p className="mt-3 whitespace-pre-line leading-5 text-cohere-body-muted">{approvedConsent.text}</p>
            </details>
          </> : <p role="status" className="text-sm leading-6 text-cohere-body-muted">{t("consentUnavailable")}</p>}
          {uploadError != null && <DatasetErrorNotice error={uploadError} maxSizeBytes={policy?.max_size_bytes} />}
          {uncertain && <p className="text-sm leading-6">{t("uncertain")}</p>}
          {busy && <div role="status" className="space-y-2">
            <p className="text-sm">{t(progress < 100 ? "uploading" : "validating", { progress })}</p>
            <progress aria-label={t("uploadProgress")} max={100} value={progress} className="h-2 w-full accent-cohere-primary" />
          </div>}
          <div className="dataset-actions grid gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={openCamera} disabled={!capture.recording || frozen || !policy || loadError != null}><RotateCcw className="size-4" />{t("retake")}</Button>
            <Button variant="outline" onClick={replay} disabled={!capture.recording || frozen}><Play className="size-4" />{t("replay")}</Button>
            <Button onClick={() => void send()} isLoading={busy} disabled={submittedId !== null || !capture.recording || !policy || !validWord || !consent || !approvedConsent || loadError != null}>
              <Send className="size-4" />{t(uploadError ? "retryUpload" : "upload")}
            </Button>
          </div>
          <p className="flex items-start gap-2 rounded-sm border border-cohere-hairline bg-cohere-stone p-3 text-xs leading-5 text-cohere-body-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t("submissionNote")}
          </p>
        </section>
        <details className="rounded-sm border border-cohere-hairline p-3 text-xs">
          <summary className="cursor-pointer text-cohere-body-muted">{t("recordingSettings")}</summary>
          <div className="mt-3 space-y-1 leading-5 text-cohere-body-muted">
            {policy && <><p>{t("policy", { version: policy.version })}</p>
              <p>{t("durationRange", { min: policy.min_duration_ms / 1000, max: policy.max_duration_ms / 1000 })}</p>
              <p>{t("resolutionRange", { min: policy.min_short_side_px, max: policy.max_long_side_px })}</p>
              <p>{t("sizeLimit", { value: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(policy.max_size_bytes / 1048576) })}</p></>}
            <p>{t("sourceNote")}</p>
            <p>{t("noMinimumFileSize")}</p>
          </div>
        </details>
      </div>
      <ContributionGuide />
    </div>
    {submittedId !== null && <DatasetReviewDialog onConfirm={() => router.push("/contributions?submitted=" + encodeURIComponent(submittedId))} />}
  </div>;
}
