import { captureImageData } from '@/lib/imagePreprocess';
import { predictWithBrowserYolo } from '@/lib/browserYoloRuntime';
import { YOLO_MODEL_MANIFEST } from '@/lib/yoloModel';

export type TranslateDetection = {
  class: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type TranslatePredictionResponse = {
  detections: TranslateDetection[];
  inference_ms: number;
  model: string;
};

type PredictFromVideoFrameOptions = {
  inputSize?: number;
};

export async function predictFromImageData(
  imageData: ImageData,
): Promise<TranslatePredictionResponse | null> {
  try {
    return await predictWithBrowserYolo(imageData);
  } catch {
    return null;
  }
}

export async function predictFromVideoFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  { inputSize = YOLO_MODEL_MANIFEST.inputSize }: PredictFromVideoFrameOptions = {},
): Promise<TranslatePredictionResponse | null> {
  const imageData = captureImageData(video, canvas, inputSize);
  if (imageData === null) return null;

  return predictFromImageData(imageData);
}
