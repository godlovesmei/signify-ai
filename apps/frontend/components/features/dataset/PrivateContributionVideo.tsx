"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockKeyhole, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DatasetErrorNotice } from "./DatasetFeedback";
import { datasetApi } from "@/lib/dataset/api";

export default function PrivateContributionVideo({ id, autoLoad = false }: { id: string; autoLoad?: boolean }) {
  const t = useTranslations("workspace.contributions");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playOnLoad, setPlayOnLoad] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const video = useRef<HTMLVideoElement>(null);
  const controller = useRef<AbortController | null>(null);
  const objectUrl = useRef<string | null>(null);
  const release = useCallback(() => {
    controller.current?.abort();
    const media = video.current;
    if (media) { media.pause(); media.removeAttribute("src"); media.load(); }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, []);
  useEffect(() => () => release(), [id, release]);

  const load = useCallback(async () => {
    release();
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError(null); setUrl(null); setFailed(false);
    try {
      const blob = await datasetApi.playback(id, request.signal);
      if (request.signal.aborted) return;
      objectUrl.current = URL.createObjectURL(blob);
      setUrl(objectUrl.current);
    } catch (cause) { if (!request.signal.aborted) setError(cause); }
    finally { if (!request.signal.aborted) setBusy(false); }
  }, [id, release]);
  useEffect(() => { if (autoLoad) void load(); }, [autoLoad, load]);
  function replay() {
    if (url && video.current) {
      video.current.currentTime = 0;
      void video.current.play().catch(() => undefined);
    } else {
      setPlayOnLoad(true);
      void load();
    }
  }
  return <section className="min-w-0 space-y-4" aria-label={t("privatePlayback")}>
    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] border border-cohere-hairline bg-cohere-stone">
      {url ? <video key={url} ref={video} src={url} autoPlay={autoLoad || playOnLoad} controls playsInline preload="metadata"
        aria-label={t("privatePlayback")} className="h-full w-full object-contain" onError={() => {
          release(); setUrl(null); setFailed(true);
        }} /> : <div className="flex flex-col items-center gap-3 p-6 text-center text-cohere-body-muted">
          <LockKeyhole className="size-8" aria-hidden="true" />
          <p className="text-sm">{t(failed ? "videoPlaybackFailed" : "videoPrivate")}</p>
        </div>}
    </div>
    {error != null && <DatasetErrorNotice error={error} />}
    <Button variant="outline" className="min-h-11 w-full sm:w-auto" isLoading={busy} onClick={replay}>
      <RefreshCw className="size-4" />{t(url || failed ? "replayVideo" : "loadVideo")}
    </Button>
    <p className="text-xs leading-5 text-cohere-body-muted">{t("signedNote")}</p>
  </section>;
}
