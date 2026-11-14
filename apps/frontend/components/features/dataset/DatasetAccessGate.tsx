"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { datasetApi } from "@/lib/dataset/api";
import { DatasetErrorNotice, DatasetLoading } from "./DatasetFeedback";
import type { DatasetAccess } from "@/lib/dataset/types";

export default function DatasetAccessGate({ role, children }: { role: "admin" | "curator"; children: React.ReactNode }) {
  const t = useTranslations("workspace.contributions");
  const [access, setAccess] = useState<DatasetAccess | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    datasetApi.access(controller.signal).then(value => { if (!controller.signal.aborted) setAccess(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause); });
    return () => controller.abort();
  }, [attempt]);
  if (error != null) return <div className="p-6"><DatasetErrorNotice error={error} retry={() => { setError(null); setAttempt(value => value + 1); }} /></div>;
  if (!access) return <DatasetLoading />;
  if (!(role === "admin" ? access.is_admin : access.is_curator)) return <div className="dataset-surface mx-auto max-w-xl space-y-4 p-8">
    <ShieldAlert className="size-8 text-cohere-slate" aria-hidden="true" />
    <h1 className="text-2xl">{t("restrictedTitle")}</h1>
    <p className="text-sm leading-6 text-cohere-body-muted">{t(role === "admin" ? "adminOnly" : "curatorOnly")}</p>
    <Button variant="outline" asChild><Link href="/contributions">{t("back")}</Link></Button>
  </div>;
  return children;
}
