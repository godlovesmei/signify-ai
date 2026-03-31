export interface Landmark {
  x: number; // Normalized [0, 1]
  y: number; // Normalized [0, 1]
  z?: number;
}

/**
 * A single detected hand. Handedness has already been mirror-corrected
 * before this type is produced (see the detection loop in _content.tsx).
 */
export interface DetectedHand {
  landmarks: Landmark[];
  handedness: 'Left' | 'Right';
  score: number;
}
