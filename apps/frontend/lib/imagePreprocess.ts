/**
 * Image preprocessing utilities for BISINDO sign language inference.
 *
 * Pipeline (matches backend ml_service.py exactly):
 *   1. Crop region from video frame
 *   2. Auto-exposure normalization (histogram stretch)
 *   3. Grayscale conversion (ITU-R BT.601)
 *   4. Resize to 224x224 (stretch)
 *   5. Export as PNG blob
 *
 * Why preprocess on the frontend?
 *   - Access to raw camera pixels before JPEG/PNG compression
 *   - Auto-exposure is more accurate on full-resolution crop
 *   - Reduces backend compute — preprocessing offloaded to client
 *   - Grayscale conversion here ensures the PNG sent over the wire is
 *     already in the correct domain, reducing bandwidth (~66% smaller)
 */

const TARGET_SIZE = 224;

// ── Auto-exposure ────────────────────────────────────────────────────────────

/**
 * Linear histogram stretch: maps [actualMin, actualMax] -> [0, 255].
 *
 * This mimics camera "auto-brightness" — NOT CLAHE (which alters local
 * distributions and causes domain shift vs training data).
 *
 * Only activates when mean luminance falls outside [darkThreshold, brightThreshold],
 * so well-lit scenes are left untouched.
 *
 * @param imageData - Canvas ImageData to modify in-place (RGBA)
 * @param darkThreshold - Mean luminance below this triggers brightening
 * @param brightThreshold - Mean luminance above this triggers darkening
 */
function autoExpose(
  imageData: ImageData,
  darkThreshold = 80,
  brightThreshold = 200,
): void {
  const { data } = imageData;
  const len = data.length;

  // Pass 1: compute luminance statistics
  let sum = 0;
  let min = 255;
  let max = 0;
  let count = 0;

  for (let i = 0; i < len; i += 4) {
    // ITU-R BT.601 luminance — identical weights to backend
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    if (lum < min) min = lum;
    if (lum > max) max = lum;
    count++;
  }

  const mean = sum / count;

  // Only correct if too dark or too bright
  if (mean > darkThreshold && mean < brightThreshold) return;

  // Skip near-solid images (range < 10 means almost no detail)
  const range = max - min;
  if (range < 10) return;

  // Pass 2: linear stretch [min, max] -> [0, 255]
  const scale = 255 / range;
  for (let i = 0; i < len; i += 4) {
    data[i]     = Math.min(255, Math.max(0, (data[i]     - min) * scale));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
    // Alpha channel untouched
  }
}

// ── Grayscale conversion ─────────────────────────────────────────────────────

/**
 * Convert ImageData to grayscale in-place (R=G=B=luminance).
 * Uses ITU-R BT.601 weights, identical to backend ml_service.py:
 *   gray = 0.299*R + 0.587*G + 0.114*B
 */
function toGrayscale(imageData: ImageData): void {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
}

// ── Full pipeline ────────────────────────────────────────────────────────────

/**
 * Full preprocessing pipeline: crop -> auto-expose -> grayscale -> resize -> blob.
 *
 * @param video     - Source HTMLVideoElement (raw camera feed)
 * @param cropX     - Crop region X offset in video pixels
 * @param cropY     - Crop region Y offset in video pixels
 * @param cropSide  - Crop region side length in video pixels (square)
 * @param mirrored  - If true, flip horizontally (front camera compensation)
 * @returns PNG blob ready for /predict endpoint, or null on failure
 */
export function preprocessFrame(
  video: HTMLVideoElement,
  cropX: number,
  cropY: number,
  cropSide: number,
  mirrored: boolean,
): Blob | null {
  if (cropSide <= 0) return null;

  // Step 1: Crop from video at native resolution
  const raw    = document.createElement('canvas');
  raw.width    = cropSide;
  raw.height   = cropSide;
  const rawCtx = raw.getContext('2d', { willReadFrequently: true });
  if (!rawCtx) return null;

  if (mirrored) {
    rawCtx.translate(cropSide, 0);
    rawCtx.scale(-1, 1);
  }
  rawCtx.drawImage(video, cropX, cropY, cropSide, cropSide, 0, 0, cropSide, cropSide);

  // Step 2: Auto-exposure at native resolution (more accurate than downscaled)
  const rawData = rawCtx.getImageData(0, 0, cropSide, cropSide);
  autoExpose(rawData);
  rawCtx.putImageData(rawData, 0, 0);

  // Step 3: Resize to 224x224 (stretch)
  const out    = document.createElement('canvas');
  out.width    = TARGET_SIZE;
  out.height   = TARGET_SIZE;
  const outCtx = out.getContext('2d', { willReadFrequently: true });
  if (!outCtx) return null;

  outCtx.drawImage(raw, 0, 0, TARGET_SIZE, TARGET_SIZE);

  // Step 4: Grayscale conversion (after resize for performance — fewer pixels)
  const outData = outCtx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
  toGrayscale(outData);
  outCtx.putImageData(outData, 0, 0);

  // Step 5: Export as PNG blob
  const dataUrl = out.toDataURL('image/png');
  const binary  = atob(dataUrl.split(',')[1]);
  const arr     = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/png' });
}
