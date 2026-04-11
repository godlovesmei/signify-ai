export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

/** Normalize 21 MediaPipe landmarks into a translation/scale-invariant 63-float vector. */
export function normalizeLandmarks(lms: LandmarkPoint[]): number[] {
  const wx = lms[0].x;
  const wy = lms[0].y;
  const wz = lms[0].z;

  const coords = lms.map((lm) => [lm.x - wx, lm.y - wy, lm.z - wz]);

  // Scale using wrist -> middle MCP distance (index 9).
  const ref = coords[9];
  const scale = Math.sqrt(ref[0] ** 2 + ref[1] ** 2 + ref[2] ** 2);
  if (scale > 1e-6) {
    for (const c of coords) {
      c[0] /= scale;
      c[1] /= scale;
      c[2] /= scale;
    }
  }

  return coords.flat();
}