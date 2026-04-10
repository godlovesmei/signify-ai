export interface ROIBox {
  x: number;
  y: number;
  side: number;
}

const ALPHA = 0.35;
let _smoothed: { x: number; y: number; side: number } | null = null;

export function resetROISmoother(): void {
  _smoothed = null;
}

export function landmarksToBBox(
  landmarks: ReadonlyArray<{ x: number; y: number }>,
  videoWidth: number,
  videoHeight: number,
  padding = 0.25,
): ROIBox | null {
  if (landmarks.length === 0) return null;

  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }

  const pxMinX = minX * videoWidth;
  const pxMinY = minY * videoHeight;
  const pxMaxX = maxX * videoWidth;
  const pxMaxY = maxY * videoHeight;

  const w    = pxMaxX - pxMinX;
  const h    = pxMaxY - pxMinY;
  const side = Math.max(w, h);
  const cx   = (pxMinX + pxMaxX) / 2;
  const cy   = (pxMinY + pxMaxY) / 2;
  const padded = side * (1 + padding * 2);

  const rawX    = Math.max(0, Math.min(videoWidth  - padded, cx - padded / 2));
  const rawY    = Math.max(0, Math.min(videoHeight - padded, cy - padded / 2));
  const rawSide = Math.min(padded, videoWidth - rawX, videoHeight - rawY);

  if (!_smoothed) {
    _smoothed = { x: rawX, y: rawY, side: rawSide };
  } else {
    _smoothed = {
      x:    ALPHA * rawX    + (1 - ALPHA) * _smoothed.x,
      y:    ALPHA * rawY    + (1 - ALPHA) * _smoothed.y,
      side: ALPHA * rawSide + (1 - ALPHA) * _smoothed.side,
    };
  }

  return {
    x:    Math.round(_smoothed.x),
    y:    Math.round(_smoothed.y),
    side: Math.round(_smoothed.side),
  };
}