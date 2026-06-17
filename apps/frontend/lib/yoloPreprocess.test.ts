import { describe, expect, it } from 'vitest';

import { rgbaToTensorData } from '@/lib/yoloPreprocess';

describe('yoloPreprocess rgbaToTensorData', () => {
  it('converts RGBA pixels into normalized channel-first RGB tensor data', () => {
    const rgba = new Uint8ClampedArray([
      255,
      0,
      0,
      255,
      0,
      128,
      0,
      255,
      0,
      0,
      64,
      255,
      255,
      255,
      255,
      255,
    ]);

    const tensor = rgbaToTensorData(rgba, 2, 2, 2);

    expect(Array.from(tensor.slice(0, 4))).toEqual([1, 0, 0, 1]);
    expect(tensor[4]).toBe(0);
    expect(tensor[5]).toBeCloseTo(128 / 255);
    expect(tensor[6]).toBe(0);
    expect(tensor[7]).toBe(1);
    expect(tensor[8]).toBe(0);
    expect(tensor[9]).toBe(0);
    expect(tensor[10]).toBeCloseTo(64 / 255);
    expect(tensor[11]).toBe(1);
  });

  it('rejects images that do not match the model input size', () => {
    expect(() => rgbaToTensorData(new Uint8ClampedArray(4), 1, 1, 640)).toThrow(
      'Expected 640x640 input',
    );
  });
});
