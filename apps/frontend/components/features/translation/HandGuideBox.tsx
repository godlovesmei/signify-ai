'use client';

/**
 * Static guide box overlay — user positions their hand inside this box.
 * Only the box region is cropped and sent to the model, keeping the face out.
 *
 * The box is a centered square covering ~55% of the video height.
 * Its normalised coordinates are exported so the crop function uses the
 * exact same region.
 */

/** Normalised guide box (fraction of video dimensions). */
export const GUIDE_BOX = {
  /** Fraction of video height for the box side length. */
  size: 0.55,
} as const;

/** Compute pixel coords for the guide box given video native dimensions. */
export function guideBoxPixels(videoWidth: number, videoHeight: number) {
  const side = Math.round(videoHeight * GUIDE_BOX.size);
  const x    = Math.round((videoWidth  - side) / 2);
  const y    = Math.round((videoHeight - side) / 2);
  return { x, y, side };
}

interface HandGuideBoxProps {
  /** True when at least one hand is inside / near the box. */
  handDetected?: boolean;
  /** True while the detection loop is active. */
  active?: boolean;
}

export default function HandGuideBox({
  handDetected = false,
  active       = false,
}: HandGuideBoxProps) {
  if (!active) return null;

  const sizePercent = GUIDE_BOX.size * 100; // 55%

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      {/* The guide square */}
      <div
        className="relative"
        style={{
          width:  `${sizePercent}%`,
          /* Use vmin-like trick: height matches width to stay square.
             Since the parent fills the video, height = sizePercent of parent height.
             We use aspect-ratio to keep it square regardless of parent aspect ratio. */
          aspectRatio: '1 / 1',
          maxHeight: `${sizePercent}%`,
        }}
      >
        {/* Corner brackets */}
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <span
            key={pos}
            className={[
              'absolute h-8 w-8 transition-colors duration-300',
              handDetected
                ? 'border-green-400'
                : 'border-white/50',
              pos === 'tl' ? 'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl'
                : pos === 'tr' ? 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl'
                : pos === 'bl' ? 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl'
                : 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
            ].join(' ')}
          />
        ))}

        {/* Dashed border between corners */}
        <div
          className={[
            'absolute inset-[6px] rounded-lg border-[1.5px] border-dashed transition-colors duration-300',
            handDetected
              ? 'border-green-400/40'
              : 'border-white/20',
          ].join(' ')}
        />

        {/* Label */}
        <span
          className={[
            'absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1',
            'text-[11px] font-medium backdrop-blur-sm transition-all duration-300',
            handDetected
              ? 'bg-green-500/80 text-white'
              : 'bg-black/40 text-white/70',
          ].join(' ')}
        >
          {handDetected ? 'Hand detected' : 'Place your hand here'}
        </span>

        {/* Subtle pulse when hand detected */}
        {handDetected && (
          <div className="absolute inset-0 rounded-xl border-2 border-green-400/30 animate-ping" />
        )}
      </div>
    </div>
  );
}
