"use client";

import { useTranslations } from "next-intl";

export const GUIDE_BOX = {
  size: 0.55,
} as const;

export function guideBoxPixels(videoWidth: number, videoHeight: number) {
  const side = Math.round(videoHeight * GUIDE_BOX.size);
  const x = Math.round((videoWidth - side) / 2);
  const y = Math.round((videoHeight - side) / 2);
  return { x, y, side };
}

interface HandGuideBoxProps {
  handDetected?: boolean;
  active?: boolean;
}

export default function HandGuideBox({
  handDetected = false,
  active = false,
}: HandGuideBoxProps) {
  const t = useTranslations("workspace.translate");

  if (!active) return null;

  const sizePercent = GUIDE_BOX.size * 100;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <div
        className="relative"
        style={{
          width: `${sizePercent}%`,
          aspectRatio: "1 / 1",
          maxHeight: `${sizePercent}%`,
        }}
      >
        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <span
            key={pos}
            className={cn(
              "absolute h-8 w-8 transition-all duration-300",
              handDetected ? "border-success/60" : "border-white/40",
              pos === "tl" ? "top-0 left-0 border-t-[2.5px] border-l-[2.5px] rounded-tl-xl"
              : pos === "tr" ? "top-0 right-0 border-t-[2.5px] border-r-[2.5px] rounded-tr-xl"
              : pos === "bl" ? "bottom-0 left-0 border-b-[2.5px] border-l-[2.5px] rounded-bl-xl"
              : "bottom-0 right-0 border-b-[2.5px] border-r-[2.5px] rounded-br-xl"
            )}
          />
        ))}

        {/* Dashed inner border */}
        <div
          className={cn(
            "absolute inset-[6px] rounded-lg border-[1.5px] border-dashed transition-colors duration-300",
            handDetected ? "border-success/30" : "border-white/15"
          )}
        />

        {/* Label */}
        <span
          className={cn(
            "absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[30px] px-3 py-1",
            "text-[11px] font-medium transition-colors duration-300",
            handDetected
              ? "bg-success text-white"
              : "bg-black/50 text-white/70"
          )}
        >
          {handDetected ? t("handGuideDetected") : t("handGuidePlace")}
        </span>

        {/* Pulse ring when detected */}
        {handDetected && (
          <div className="absolute inset-0 rounded-xl border-2 border-success/20 animate-ping" />
        )}
      </div>
    </div>
  );
}

function cn(...inputs: (string | false | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}
