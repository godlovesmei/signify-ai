export interface Landmark {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z?: number;
}

/**
 * A single detected hand. Handedness has already been mirror-corrected
 * before this type is produced (see the detection loop in page.tsx).
 */
export interface DetectedHand {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface DrawLandmarksOptions {
  radius?: number;      // Default: 4
  color?: string;       // Default: '#00f5d4'
  borderColor?: string; // Default: 'rgba(0,0,0,0.5)'
  borderWidth?: number; // Default: 1.5
}

export interface DrawConnectionsOptions {
  color?: string;     // Default: per-finger palette
  lineWidth?: number; // Default: 2
}

export interface DrawHandSkeletonOptions {
  landmarks?: DrawLandmarksOptions;
  connections?: DrawConnectionsOptions;
}

export interface DrawBoundingBoxOptions {
  strokeColor?: string; // Default: 'rgba(0,245,212,0.5)'
  label?: string;       // E.g. "Left · 94%"
  labelBg?: string;
  labelColor?: string;  // Default: '#ffffff'
}

export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const FINGER_COLORS: Record<string, string> = {
  thumb:  '#f97316',
  index:  '#3b82f6',
  middle: '#10b981',
  ring:   '#a855f7',
  pinky:  '#f43f5e',
  palm:   'rgba(255,255,255,0.35)',
};

function getConnectionColor(a: number, b: number): string {
  if ((a <= 4 && b <= 4) || (a === 0 && b === 1)) return FINGER_COLORS.thumb;
  if (a >= 5  && a <= 8  && b >= 5  && b <= 8)   return FINGER_COLORS.index;
  if (a >= 9  && a <= 12 && b >= 9  && b <= 12)  return FINGER_COLORS.middle;
  if (a >= 13 && a <= 16 && b >= 13 && b <= 16)  return FINGER_COLORS.ring;
  if (a >= 17 && a <= 20 && b >= 17 && b <= 20)  return FINGER_COLORS.pinky;
  return FINGER_COLORS.palm;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getCanvasUiFontStack(): string {
  if (typeof window === 'undefined') {
    return 'ui-sans-serif, system-ui, sans-serif';
  }

  const computed = window.getComputedStyle(document.body).fontFamily.trim();
  return computed.length > 0 ? computed : 'ui-sans-serif, system-ui, sans-serif';
}

export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawLandmarksOptions = {},
): void {
  const {
    radius      = 4,
    color       = '#00f5d4',
    borderColor = 'rgba(0,0,0,0.5)',
    borderWidth = 1.5,
  } = options;

  for (const lm of landmarks) {
    const x = lm.x * canvasWidth;
    const y = lm.y * canvasHeight;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (borderWidth > 0) {
      ctx.lineWidth   = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
  }
}

export function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: [number, number][],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawConnectionsOptions = {},
): void {
  const { color, lineWidth = 2 } = options;
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';
  for (const [a, b] of connections) {
    if (!landmarks[a] || !landmarks[b]) continue;
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * canvasWidth,  landmarks[a].y * canvasHeight);
    ctx.lineTo(landmarks[b].x * canvasWidth,  landmarks[b].y * canvasHeight);
    ctx.strokeStyle = color ?? getConnectionColor(a, b);
    ctx.lineWidth   = lineWidth;
    ctx.stroke();
  }
}

export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawHandSkeletonOptions = {},
): void {
  if (!landmarks || landmarks.length === 0) return;
  ctx.save();
  drawConnections(ctx, landmarks, HAND_CONNECTIONS, canvasWidth, canvasHeight, options.connections);
  drawLandmarks(ctx, landmarks, canvasWidth, canvasHeight, options.landmarks);
  ctx.restore();
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Derive a bounding box from hand landmarks and draw it on the canvas.
 *
 * IMPORTANT: landmarks must already be in display space (x-flipped if
 * mirrored) before being passed here — this function applies no transforms.
 */
export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawBoundingBoxOptions = {},
): void {
  if (!landmarks || landmarks.length === 0) return;

  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const lm of landmarks) {
    if (lm.x < xMin) xMin = lm.x;
    if (lm.y < yMin) yMin = lm.y;
    if (lm.x > xMax) xMax = lm.x;
    if (lm.y > yMax) yMax = lm.y;
  }

  const PAD = 0.04;
  const x = Math.max(0, (xMin - PAD) * canvasWidth);
  const y = Math.max(0, (yMin - PAD) * canvasHeight);
  const w = Math.min(canvasWidth  - x, (xMax - xMin + PAD * 2) * canvasWidth);
  const h = Math.min(canvasHeight - y, (yMax - yMin + PAD * 2) * canvasHeight);

  const {
    strokeColor = 'rgba(0,245,212,0.5)',
    label,
    labelBg     = strokeColor,
    labelColor  = '#ffffff',
  } = options;

  ctx.save();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);

  if (label) {
    ctx.setLineDash([]);
    const FONT_SIZE  = 11;
    const PILL_PAD_X = 6;
    const PILL_PAD_Y = 3;
    const PILL_R     = 4;
    const uiFontStack = getCanvasUiFontStack();

    ctx.font         = `600 ${FONT_SIZE}px ${uiFontStack}`;
    ctx.textBaseline = 'top';

    const textW  = ctx.measureText(label).width;
    const pillW  = textW + PILL_PAD_X * 2;
    const pillH  = FONT_SIZE + PILL_PAD_Y * 2;
    const px     = x + 1;
    const rawPY  = y - pillH - 1;
    const finalPY = rawPY < 0 ? y + 2 : rawPY;

    roundedRect(ctx, px, finalPY, pillW, pillH, PILL_R);
    ctx.fillStyle = labelBg;
    ctx.fill();
    ctx.fillStyle = labelColor;
    ctx.fillText(label, px + PILL_PAD_X, finalPY + PILL_PAD_Y);
  }

  ctx.restore();
}