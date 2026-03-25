'use client';

import { useEffect, useRef } from 'react';
import {
  clearCanvas,
  drawHandSkeleton,
  drawBoundingBox,
  type DetectedHand,
  type DrawHandSkeletonOptions,
} from './drawingUtils';

const HAND_COLORS: Record<'Left' | 'Right', { stroke: string; pill: string }> = {
  Left:  { stroke: 'rgba(59,130,246,0.70)',  pill: 'rgba(59,130,246,0.85)'  },
  Right: { stroke: 'rgba(249,115,22,0.70)',  pill: 'rgba(249,115,22,0.85)'  },
};

export interface LandmarkOverlayProps {
  hands: DetectedHand[] | null;
  showBoundingBox?: boolean;
  showHandLabels?: boolean;
  /**
   * When true, landmark X coords are flipped (x → 1 – x) so drawings
   * align with the CSS-mirrored video. We flip per-landmark rather than
   * using ctx.scale(-1, 1) so that text labels render correctly without
   * a secondary un-mirror transform. Default: true
   */
  mirrored?: boolean;
  skeletonOptions?: DrawHandSkeletonOptions;
}

export default function LandmarkOverlay({
  hands,
  showBoundingBox  = true,
  showHandLabels   = true,
  mirrored         = true,
  skeletonOptions,
}: LandmarkOverlayProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width  = width;
        canvas.height = height;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas(ctx, canvas.width, canvas.height);
    if (!hands || hands.length === 0) return;

    for (const hand of hands) {
      const displayLandmarks = mirrored
        ? hand.landmarks.map((lm) => ({ ...lm, x: 1 - lm.x }))
        : hand.landmarks;

      drawHandSkeleton(ctx, displayLandmarks, canvas.width, canvas.height, skeletonOptions);

      if (showBoundingBox) {
        const colors = HAND_COLORS[hand.handedness];
        drawBoundingBox(ctx, displayLandmarks, canvas.width, canvas.height, {
          strokeColor: colors.stroke,
          labelBg:     colors.pill,
          labelColor:  '#ffffff',
          label: showHandLabels
            ? `${hand.handedness} · ${Math.round(hand.score * 100)}%`
            : undefined,
        });
      }
    }
  }, [hands, mirrored, showBoundingBox, showHandLabels, skeletonOptions]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    >
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}