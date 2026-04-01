/**
 * Dynamic Region of Interest (ROI) extraction from MediaPipe hand landmarks.
 *
 * When MediaPipe detects a hand, this module computes a tight bounding box
 * around the landmarks and returns pixel coordinates for cropping.
 *
 * This produces crops much closer to the Roboflow training distribution
 * (which was hand-cropped by annotators) compared to a static guide box,
 * because background noise is minimised and the hand fills most of the frame.
 *
 * Padding (default 25%) ensures context around the hand (wrist, fingertips)
 * is preserved — the model needs to see the full hand posture.
 */

export interface ROIBox {
  x: number;
  y: number;
  side: number;
}

/**
 * Compute a square bounding box from MediaPipe hand landmarks.
 *
 * @param landmarks   - Array of normalised landmarks ({ x, y } in [0, 1])
 * @param videoWidth  - Native video width in pixels
 * @param videoHeight - Native video height in pixels
 * @param padding     - Fractional padding on each side (0.25 = 25%)
 * @returns Square crop region in pixel coordinates, or null if landmarks empty
 */
export function landmarksToBBox(
  landmarks: ReadonlyArray<{ x: number; y: number }>,
  videoWidth: number,
  videoHeight: number,
  padding = 0.25,
): ROIBox | null {
  if (landmarks.length === 0) return null;

  // Find normalised bounding box
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }

  // Convert to pixel coordinates
  const pxMinX = minX * videoWidth;
  const pxMinY = minY * videoHeight;
  const pxMaxX = maxX * videoWidth;
  const pxMaxY = maxY * videoHeight;

  // Make square — use longest side so no part of the hand is cut off
  const w    = pxMaxX - pxMinX;
  const h    = pxMaxY - pxMinY;
  const side = Math.max(w, h);

  // Center of the bounding box
  const cx = (pxMinX + pxMaxX) / 2;
  const cy = (pxMinY + pxMaxY) / 2;

  // Apply padding
  const padded = side * (1 + padding * 2);

  // Clamp to video bounds
  const x        = Math.max(0, Math.min(videoWidth  - padded, cx - padded / 2));
  const y        = Math.max(0, Math.min(videoHeight - padded, cy - padded / 2));
  const finalSide = Math.min(padded, videoWidth - x, videoHeight - y);

  return {
    x:    Math.round(x),
    y:    Math.round(y),
    side: Math.round(finalSide),
  };
}
