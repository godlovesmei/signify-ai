import { describe, expect, it } from 'vitest';

import {
  decodeYoloDetections,
  intersectionOverUnion,
  nonMaxSuppression,
} from '@/lib/yoloPostprocess';
import type { TranslateDetection } from '@/lib/translateApi';

const LABELS = ['A', 'B'] as const;
const ATTRIBUTES = 4 + LABELS.length;

function makeAttributesFirstTensor(anchorCount: number) {
  const data = new Float32Array(ATTRIBUTES * anchorCount);
  return {
    data,
    dims: [1, ATTRIBUTES, anchorCount],
    set(attribute: number, anchor: number, value: number) {
      data[attribute * anchorCount + anchor] = value;
    },
  };
}

function makeAnchorsFirstTensor(anchorCount: number) {
  const data = new Float32Array(ATTRIBUTES * anchorCount);
  return {
    data,
    dims: [1, anchorCount, ATTRIBUTES],
    set(attribute: number, anchor: number, value: number) {
      data[anchor * ATTRIBUTES + attribute] = value;
    },
  };
}

function setPrediction(
  tensor: ReturnType<typeof makeAttributesFirstTensor>,
  anchor: number,
  values: {
    cx: number;
    cy: number;
    width: number;
    height: number;
    a: number;
    b: number;
  },
) {
  tensor.set(0, anchor, values.cx);
  tensor.set(1, anchor, values.cy);
  tensor.set(2, anchor, values.width);
  tensor.set(3, anchor, values.height);
  tensor.set(4, anchor, values.a);
  tensor.set(5, anchor, values.b);
}

describe('yoloPostprocess decodeYoloDetections', () => {
  it('maps YOLO output to sorted TranslateDetection records', () => {
    const tensor = makeAttributesFirstTensor(2);
    setPrediction(tensor, 0, { cx: 100, cy: 120, width: 40, height: 20, a: 0.95, b: 0.1 });
    setPrediction(tensor, 1, { cx: 300, cy: 320, width: 60, height: 80, a: 0.2, b: 0.8 });

    const detections = decodeYoloDetections(tensor, {
      labels: LABELS,
      inputSize: 640,
      confidenceThreshold: 0.5,
      iouThreshold: 0.45,
    });

    expect(detections).toEqual([
      {
        class: 'A',
        confidence: expect.closeTo(0.95, 5),
        box: { x1: 80, y1: 110, x2: 120, y2: 130 },
      },
      {
        class: 'B',
        confidence: expect.closeTo(0.8, 5),
        box: { x1: 270, y1: 280, x2: 330, y2: 360 },
      },
    ]);
  });

  it('supports anchors-first tensors from alternate ONNX layouts', () => {
    const tensor = makeAnchorsFirstTensor(1);
    setPrediction(tensor, 0, { cx: 20, cy: 20, width: 10, height: 10, a: 0.1, b: 0.7 });

    const detections = decodeYoloDetections(tensor, {
      labels: LABELS,
      inputSize: 640,
      confidenceThreshold: 0.5,
    });

    expect(detections[0]?.class).toBe('B');
    expect(detections[0]?.box).toEqual({ x1: 15, y1: 15, x2: 25, y2: 25 });
  });

  it('filters low-confidence predictions and applies class-aware NMS', () => {
    const tensor = makeAttributesFirstTensor(3);
    setPrediction(tensor, 0, { cx: 100, cy: 100, width: 100, height: 100, a: 0.9, b: 0.1 });
    setPrediction(tensor, 1, { cx: 105, cy: 105, width: 100, height: 100, a: 0.8, b: 0.1 });
    setPrediction(tensor, 2, { cx: 400, cy: 400, width: 50, height: 50, a: 0.2, b: 0.3 });

    const detections = decodeYoloDetections(tensor, {
      labels: LABELS,
      inputSize: 640,
      confidenceThreshold: 0.5,
      iouThreshold: 0.45,
    });

    expect(detections).toHaveLength(1);
    expect(detections[0]?.confidence).toBeCloseTo(0.9);
  });
});

describe('yoloPostprocess geometry helpers', () => {
  it('calculates intersection-over-union and suppresses only same-class overlaps', () => {
    const base: TranslateDetection = {
      class: 'A',
      confidence: 0.9,
      box: { x1: 0, y1: 0, x2: 100, y2: 100 },
    };
    const sameClass: TranslateDetection = {
      class: 'A',
      confidence: 0.8,
      box: { x1: 10, y1: 10, x2: 110, y2: 110 },
    };
    const otherClass: TranslateDetection = {
      class: 'B',
      confidence: 0.7,
      box: { x1: 10, y1: 10, x2: 110, y2: 110 },
    };

    expect(intersectionOverUnion(base, sameClass)).toBeGreaterThan(0.45);
    expect(nonMaxSuppression([sameClass, otherClass, base], 0.45)).toEqual([base, otherClass]);
  });
});
