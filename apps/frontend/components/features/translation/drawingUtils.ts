/**
 * drawingUtils.ts
 * Reusable drawing utilities for MediaPipe hand landmark visualization.
 * Supports rendering landmarks, connections, and full hand skeleton overlays
 * on an HTML5 canvas element.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Landmark {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z?: number; // Depth (optional)
}

export interface DrawLandmarksOptions {
  /** Radius of each landmark dot. Default: 4 */
  radius?: number;
  /** Fill color of each dot. Default: '#00f5d4' */
  color?: string;
  /** Border color of each dot. Default: 'rgba(0,0,0,0.5)' */
  borderColor?: string;
  /** Border width in px. Default: 1.5 */
  borderWidth?: number;
}

export interface DrawConnectionsOptions {
  /** Stroke color. Default: 'rgba(255,255,255,0.55)' */
  color?: string;
  /** Line width in px. Default: 2 */
  lineWidth?: number;
}

export interface DrawHandSkeletonOptions {
  landmarks?: DrawLandmarksOptions;
  connections?: DrawConnectionsOptions;
}

// ── MediaPipe hand connections ────────────────────────────────────────────────
// Index pairs matching the 21-point hand landmark model.

export const HAND_CONNECTIONS: [number, number][] = [
  // Palm
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17],            // Knuckle bridge
];

// Per-finger color palette for richer visualization
const FINGER_COLORS: Record<string, string> = {
  thumb:  '#f97316', // orange
  index:  '#3b82f6', // blue
  middle: '#10b981', // emerald
  ring:   '#a855f7', // purple
  pinky:  '#f43f5e', // rose
  palm:   'rgba(255,255,255,0.35)',
};

function getConnectionColor(a: number, b: number): string {
  if ((a <= 4 && b <= 4) || (a === 0 && b === 1))  return FINGER_COLORS.thumb;
  if (a >= 5  && a <= 8  && b >= 5  && b <= 8)     return FINGER_COLORS.index;
  if (a >= 9  && a <= 12 && b >= 9  && b <= 12)    return FINGER_COLORS.middle;
  if (a >= 13 && a <= 16 && b >= 13 && b <= 16)    return FINGER_COLORS.ring;
  if (a >= 17 && a <= 20 && b >= 17 && b <= 20)    return FINGER_COLORS.pinky;
  return FINGER_COLORS.palm;
}

// ── Core drawing functions ────────────────────────────────────────────────────

/**
 * Draw individual landmark dots on the canvas.
 */
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

/**
 * Draw lines between connected landmark pairs.
 */
export function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: [number, number][],
  canvasWidth: number,
  canvasHeight: number,
  options: DrawConnectionsOptions = {},
): void {
  const { color = 'rgba(255,255,255,0.55)', lineWidth = 2 } = options;

  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  for (const [a, b] of connections) {
    if (!landmarks[a] || !landmarks[b]) continue;

    const x1 = landmarks[a].x * canvasWidth;
    const y1 = landmarks[a].y * canvasHeight;
    const x2 = landmarks[b].x * canvasWidth;
    const y2 = landmarks[b].y * canvasHeight;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    // Use per-finger color if no explicit override was provided
    ctx.strokeStyle = options.color ? color : getConnectionColor(a, b);
    ctx.lineWidth   = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draw the full hand skeleton: connections first, landmarks on top.
 * This is the primary convenience function for most use cases.
 */
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

/**
 * Clear the entire canvas. Call this each animation frame before redrawing.
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Draw a bounding box around detected hand landmarks (useful for debugging).
 */
export function drawBoundingBox(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  canvasWidth: number,
  canvasHeight: number,
  color = 'rgba(0,245,212,0.3)',
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

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}