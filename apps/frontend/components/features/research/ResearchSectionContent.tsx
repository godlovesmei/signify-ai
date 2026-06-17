"use client";

import { useTranslations } from "next-intl";

export type ResearchSectionKey =
  | "introduction"
  | "whyItMatters"
  | "howItWorks"
  | "technologyBehindIt"
  | "aiMachineLearning"
  | "modelTraining"
  | "accuracyImprovements"
  | "useCases"
  | "researchDevelopment"
  | "conclusion";

type ResearchBlock = {
  type?: "paragraph" | "heading";
  text: string;
};

export function ResearchSectionContent({
  sectionKey,
}: {
  sectionKey: ResearchSectionKey;
}) {
  const t = useTranslations(`docs.research.sections.${sectionKey}`);
  const blocks = t.raw("blocks") as ResearchBlock[];

  return (
    <section>
      <h2 className="mb-4 text-[32px] leading-[1.2] text-[var(--color-text-primary)]">
        {t("title")}
      </h2>

      <div className="space-y-5 text-[18px] leading-[1.5] text-[var(--color-text-secondary)]">
        {blocks.map((block, index) =>
          block.type === "heading" ? (
            <h3
              key={`${block.text}-${index}`}
              className="mt-6 text-[24px] leading-[1.3] text-[var(--color-text-primary)]"
            >
              {block.text}
            </h3>
          ) : (
            <p key={`${block.text}-${index}`}>{block.text}</p>
          ),
        )}
      </div>
    </section>
  );
}
