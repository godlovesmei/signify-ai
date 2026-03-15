'use client';

/**
 * LandmarkOverlay.tsx
 * Renders a transparent <canvas> positioned over the webcam video.
 * Uses drawingUtils to paint hand landmarks and skeleton connections
 * whenever the `landmarks` prop changes.
 *
 * Design decisions:
 *  - The canvas is absolutely positioned and sized to match its parent.
 *  - We use a ResizeObserver instead of a fixed size so it stays correct
 *    when the panel resizes (e.g. responsive layout switches).
 *  - `pointer-events: none` ensures click-through to camera controls.
 *  - Mirroring is handled via CSS transform so coordinates stay consistent.
 */

import { useEffect, useRef } from 'react';
import {
  clearCanvas,
  drawHandSkeleton,
  drawBoundingBox,
  type Landmark,
  type DrawHandSkeletonOptions,
} from './drawingUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LandmarkOverlayProps {
  /** Array of 21 normalized hand landmarks from MediaPipe */
  landmarks: Landmark[] | null;
  /** Whether to show the bounding box around the detected hand */
  showBoundingBox?: boolean;
  /** Whether the video is mirrored (user-facing camera) */
  mirrored?: boolean;
  /** Optional style overrides for skeleton drawing */
  skeletonOptions?: DrawHandSkeletonOptions;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandmarkOverlay({
  landmarks,
  showBoundingBox = false,
  mirrored = true,
  skeletonOptions,
}: LandmarkOverlayProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);

  // Keep canvas dimensions in sync with the container using ResizeObserver
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

  // Redraw whenever landmarks change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas(ctx, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    // When the video is mirrored (CSS -scale-x-100), we mirror the canvas
    // drawing context so landmarks align correctly with the flipped feed.
    if (mirrored) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, skeletonOptions);

    if (showBoundingBox) {
      drawBoundingBox(ctx, landmarks, canvas.width, canvas.height);
    }

    if (mirrored) {
      ctx.restore();
    }
  }, [landmarks, mirrored, showBoundingBox, skeletonOptions]);

  return (
    // Container fills the parent (the camera section)
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-hidden="true"
      />
    </div>
  );
}