import { beforeEach, describe, expect, it } from 'vitest';

import { landmarksToBBox, resetROISmoother } from '@/lib/handROI';

describe('handROI landmarksToBBox', () => {
  beforeEach(() => {
    resetROISmoother();
  });

  it('returns null for empty landmarks', () => {
    const result = landmarksToBBox([], 640, 480);
    expect(result).toBeNull();
  });

  it('returns bounded ROI for valid landmarks', () => {
    const landmarks = [
      { x: 0.4, y: 0.3 },
      { x: 0.6, y: 0.3 },
      { x: 0.6, y: 0.6 },
      { x: 0.4, y: 0.6 },
    ];

    const result = landmarksToBBox(landmarks, 640, 480, 0.25);
    expect(result).not.toBeNull();
    expect(result!.x).toBeGreaterThanOrEqual(0);
    expect(result!.y).toBeGreaterThanOrEqual(0);
    expect(result!.x + result!.side).toBeLessThanOrEqual(640);
    expect(result!.y + result!.side).toBeLessThanOrEqual(480);
  });

  it('applies smoothing across consecutive frames', () => {
    const frameA = [
      { x: 0.35, y: 0.3 },
      { x: 0.5, y: 0.3 },
      { x: 0.5, y: 0.55 },
      { x: 0.35, y: 0.55 },
    ];

    const frameB = [
      { x: 0.45, y: 0.3 },
      { x: 0.6, y: 0.3 },
      { x: 0.6, y: 0.55 },
      { x: 0.45, y: 0.55 },
    ];

    const roiA = landmarksToBBox(frameA, 640, 480, 0.25)!;
    const roiB = landmarksToBBox(frameB, 640, 480, 0.25)!;

    // With smoothing enabled, ROI shift should be smaller than the raw landmark shift.
    expect(roiB.x - roiA.x).toBeLessThan(64);
    expect(roiB.x).toBeGreaterThan(roiA.x);
  });

  it('resets smoothing state when requested', () => {
    const frame = [
      { x: 0.35, y: 0.3 },
      { x: 0.5, y: 0.3 },
      { x: 0.5, y: 0.55 },
      { x: 0.35, y: 0.55 },
    ];

    const first = landmarksToBBox(frame, 640, 480, 0.25)!;
    const second = landmarksToBBox(frame, 640, 480, 0.25)!;
    expect(second).toEqual(first);

    resetROISmoother();
    const afterReset = landmarksToBBox(frame, 640, 480, 0.25)!;
    expect(afterReset).toEqual(first);
  });
});
