export function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  targetSize = 640,
): Promise<Blob | null> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  canvas.width = targetSize;
  canvas.height = targetSize;
  ctx.drawImage(video, 0, 0, targetSize, targetSize);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.85);
  });
}
