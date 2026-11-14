"use client";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { FileVideo } from "lucide-react";
import ContributionRecorder from "@/components/features/dataset/ContributionRecorder";
export default function NewContributionContent() {
  const t = useTranslations("workspace.contributions");
  return <div className="dataset-page dataset-surface mx-auto w-full max-w-6xl p-4 md:p-8">
    <PageHeader title={t("newTitle")} description={t("newDescription")} className="mb-6"
      actions={<Button variant="outline" asChild><Link href="/contributions"><FileVideo className="size-4" />{t("title")}</Link></Button>} />
    <ContributionRecorder />
  </div>;
}
