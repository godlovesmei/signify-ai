import type { TranslateDetection } from '@/lib/translateApi';
import { YOLO_MODEL_MANIFEST } from '@/lib/yoloModel';

type YoloTensorLike = {
  data: ArrayLike<number>;
  dims: readonly number[];
};

type DecodeOptions = {
  labels?: readonly string[];
  inputSize?: number;
  confidenceThreshold?: number;
  iouThreshold?: number;
  maxDetections?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isFiniteBox(cx: number, cy: number, width: number, height: number): boolean {
  return (
    Number.isFinite(cx) &&
    Number.isFinite(cy) &&
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0
  );
}

export function intersectionOverUnion(a: TranslateDetection, b: TranslateDetection): number {
  const x1 = Math.max(a.box.x1, b.box.x1);
  const y1 = Math.max(a.box.y1, b.box.y1);
  const x2 = Math.min(a.box.x2, b.box.x2);
  const y2 = Math.min(a.box.y2, b.box.y2);

  const intersectionWidth = Math.max(0, x2 - x1);
  const intersectionHeight = Math.max(0, y2 - y1);
  const intersectionArea = intersectionWidth * intersectionHeight;
  if (intersectionArea === 0) return 0;

  const areaA = Math.max(0, a.box.x2 - a.box.x1) * Math.max(0, a.box.y2 - a.box.y1);
  const areaB = Math.max(0, b.box.x2 - b.box.x1) * Math.max(0, b.box.y2 - b.box.y1);
  const unionArea = areaA + areaB - intersectionArea;

  return unionArea > 0 ? intersectionArea / unionArea : 0;
}

export function nonMaxSuppression(
  detections: TranslateDetection[],
  iouThreshold: number = YOLO_MODEL_MANIFEST.iouThreshold,
  maxDetections: number = YOLO_MODEL_MANIFEST.maxDetections,
): TranslateDetection[] {
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: TranslateDetection[] = [];

  for (const detection of sorted) {
    const overlapsSameClass = kept.some(
      (candidate) =>
        candidate.class === detection.class &&
        intersectionOverUnion(candidate, detection) > iouThreshold,
    );

    if (!overlapsSameClass) {
      kept.push(detection);
    }

    if (kept.length >= maxDetections) break;
  }

  return kept;
}

export function decodeYoloDetections(
  output: YoloTensorLike,
  {
    labels = YOLO_MODEL_MANIFEST.labels,
    inputSize = YOLO_MODEL_MANIFEST.inputSize,
    confidenceThreshold = YOLO_MODEL_MANIFEST.confidenceThreshold,
    iouThreshold = YOLO_MODEL_MANIFEST.iouThreshold,
    maxDetections = YOLO_MODEL_MANIFEST.maxDetections,
  }: DecodeOptions = {},
): TranslateDetection[] {
  const [batchSize, dimA, dimB] = output.dims;
  if (output.dims.length !== 3 || batchSize !== 1) {
    throw new Error(`Unsupported YOLO output shape: ${output.dims.join('x')}`);
  }

  const attributes = labels.length + 4;
  const attributesFirst = dimA === attributes;
  const anchorsFirst = dimB === attributes;
  if (!attributesFirst && !anchorsFirst) {
    throw new Error(`Expected ${attributes} YOLO attributes, received ${dimA}x${dimB}`);
  }

  const anchorCount = attributesFirst ? dimB : dimA;
  const valueAt = attributesFirst
    ? (attribute: number, anchor: number) => output.data[attribute * anchorCount + anchor]
    : (attribute: number, anchor: number) => output.data[anchor * attributes + attribute];

  const detections: TranslateDetection[] = [];

  for (let anchor = 0; anchor < anchorCount; anchor += 1) {
    let classIndex = -1;
    let confidence = -Infinity;

    for (let labelIndex = 0; labelIndex < labels.length; labelIndex += 1) {
      const score = valueAt(4 + labelIndex, anchor);
      if (score > confidence) {
        confidence = score;
        classIndex = labelIndex;
      }
    }

    if (confidence < confidenceThreshold || classIndex < 0) continue;

    const cx = valueAt(0, anchor);
    const cy = valueAt(1, anchor);
    const width = valueAt(2, anchor);
    const height = valueAt(3, anchor);
    if (!isFiniteBox(cx, cy, width, height)) continue;

    detections.push({
      class: labels[classIndex],
      confidence,
      box: {
        x1: clamp(cx - width / 2, 0, inputSize),
        y1: clamp(cy - height / 2, 0, inputSize),
        x2: clamp(cx + width / 2, 0, inputSize),
        y2: clamp(cy + height / 2, 0, inputSize),
      },
    });
  }

  return nonMaxSuppression(detections, iouThreshold, maxDetections);
}
