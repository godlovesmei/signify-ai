"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Hand, Lightbulb, Scan, Move, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ALPHABET_LETTERS } from "@/lib/userData";

export default function ContributionGuide() {
  const t = useTranslations("workspace.contributions");
  const [letter, setLetter] = useState("A");
  return <aside className="min-w-0 space-y-4">
    <section className="overflow-hidden rounded-sm border border-cohere-hairline bg-cohere-canvas">
      <div className="border-b border-cohere-hairline p-4">
        <h2 className="flex items-center gap-2 text-sm font-medium"><BookOpen className="size-4" aria-hidden="true" />{t("referenceTitle")}</h2>
        <p className="mt-2 text-xs leading-5 text-cohere-body-muted">{t("referenceScope")}</p>
      </div>
      <div className="p-4">
        <label className="mb-2 block text-xs text-cohere-body-muted" htmlFor="reference-letter">{t("referenceSelect")}</label>
        <select id="reference-letter" value={letter} onChange={event => setLetter(event.target.value)}
          className="w-full rounded-sm border border-cohere-hairline bg-cohere-stone px-3 py-2 text-sm">
          {ALPHABET_LETTERS.map(value => <option value={value} key={value}>{t("referenceAlphabet", { letter: value })}</option>)}
        </select>
        <figure className="mt-3 overflow-hidden rounded-sm border border-cohere-hairline">
          <Image src={`/alfabet/${letter}.jpg`} alt={t("referenceAlphabet", { letter })} width={360} height={360}
            className="aspect-[4/3] w-full object-contain bg-cohere-stone" />
          <figcaption className="border-t border-cohere-hairline px-3 py-2 text-xs">{t("referenceAlphabet", { letter })}</figcaption>
        </figure>
        <p className="mt-3 text-xs leading-5 text-cohere-body-muted">{t("wordReferenceMissing")}</p>
        <Link href="/reference" className="mt-3 inline-block text-xs underline underline-offset-4">{t("openReference")}</Link>
      </div>
    </section>
    <section className="rounded-sm border border-cohere-hairline bg-cohere-stone/60 p-4">
      <h2 className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="size-4" aria-hidden="true" />{t("guideTitle")}</h2>
      <ul className="mt-4 space-y-4">
        {[
          { Icon: Hand, title: "guideHandsTitle", body: "guideFrame" },
          { Icon: Move, title: "guideMotionTitle", body: "guideMovement" },
          { Icon: Scan, title: "guideLightTitle", body: "guideLight" },
        ].map(({ Icon, title, body }) => <li key={title} className="flex items-start gap-3">
          <span className="rounded-sm border border-cohere-hairline bg-cohere-canvas p-2"><Icon className="size-4" aria-hidden="true" /></span>
          <div><h3 className="text-xs font-medium">{t(title)}</h3><p className="mt-1 text-xs leading-5 text-cohere-body-muted">{t(body)}</p></div>
        </li>)}
      </ul>
    </section>
  </aside>;
}
