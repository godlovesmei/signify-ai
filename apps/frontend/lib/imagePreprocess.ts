const TRANSPORT_SIZE = 320;

export function preprocessFrame(
  video: HTMLVideoElement,
  cropX: number,
  cropY: number,
  cropSide: number,
  mirrored: boolean,
): Blob | null {
  if (cropSide <= 0) return null;

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

  const out    = document.createElement('canvas');
  out.width    = TRANSPORT_SIZE;
  out.height   = TRANSPORT_SIZE;
  const outCtx = out.getContext('2d', { willReadFrequently: true });
  if (!outCtx) return null;

  outCtx.drawImage(raw, 0, 0, TRANSPORT_SIZE, TRANSPORT_SIZE);

  const dataUrl = out.toDataURL('image/jpeg', 0.95);
  const binary  = atob(dataUrl.split(',')[1]);
  const arr     = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: 'image/jpeg' });
}