import type * as Ort from 'onnxruntime-web/webgpu';

import type { TranslatePredictionResponse } from '@/lib/translateApi';
import { YOLO_MODEL_CACHE_NAME, YOLO_MODEL_MANIFEST, ORT_WASM_PATH } from '@/lib/yoloModel';
import { decodeYoloDetections } from '@/lib/yoloPostprocess';
import { imageDataToTensorData, rgbaBufferToTensorData } from '@/lib/yoloPreprocess';

type OrtModule = typeof Ort;
type OrtSession = Ort.InferenceSession;

function getThreadCount(): number {
  if (!globalThis.crossOriginIsolated) return 1;

  const hardwareConcurrency = globalThis.navigator?.hardwareConcurrency ?? 2;
  return Math.max(1, Math.min(4, Math.floor(hardwareConcurrency / 2)));
}

function supportsWebGpu(): boolean {
  const navigatorWithGpu = globalThis.navigator as Navigator & { gpu?: unknown };
  return Boolean(navigatorWithGpu?.gpu);
}

export function configureOrt(ort: OrtModule): void {
  ort.env.wasm.wasmPaths = ORT_WASM_PATH;
  ort.env.wasm.numThreads = getThreadCount();
}

async function fetchModelBytes(): Promise<ArrayBuffer> {
  const modelUrl = YOLO_MODEL_MANIFEST.artifactPath;
  const request = new Request(modelUrl, { cache: 'force-cache' });

  if ('caches' in globalThis) {
    const cache = await caches.open(YOLO_MODEL_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached.arrayBuffer();

    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`Failed to load YOLO model: ${response.status}`);
    }

    await cache.put(request, response.clone());
    return response.arrayBuffer();
  }

  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`Failed to load YOLO model: ${response.status}`);
  }

  return response.arrayBuffer();
}

async function createSessionWithProviders(
  ort: OrtModule,
  modelBytes: ArrayBuffer,
  executionProviders: Ort.InferenceSession.ExecutionProviderConfig[],
): Promise<OrtSession> {
  return ort.InferenceSession.create(modelBytes, {
    executionProviders,
    graphOptimizationLevel: 'all',
  });
}

export async function createYoloSession(ort: OrtModule): Promise<OrtSession> {
  configureOrt(ort);
  const modelBytes = await fetchModelBytes();

  if (supportsWebGpu()) {
    try {
      return await createSessionWithProviders(ort, modelBytes.slice(0), ['webgpu', 'wasm']);
    } catch {
      // Fall through to WASM. Some browsers expose navigator.gpu but lack an ORT-compatible stack.
    }
  }

  return createSessionWithProviders(ort, modelBytes.slice(0), ['wasm']);
}

function getOutputTensor(session: OrtSession, results: Ort.InferenceSession.ReturnType): Ort.Tensor {
  const outputName = session.outputNames[0] ?? YOLO_MODEL_MANIFEST.outputName;
  const output = results[outputName];
  if (!output) {
    throw new Error(`Missing ONNX output tensor: ${outputName}`);
  }
  return output;
}

async function runTensor(
  ort: OrtModule,
  session: OrtSession,
  tensorData: Float32Array,
): Promise<TranslatePredictionResponse> {
  const inputName = session.inputNames[0] ?? YOLO_MODEL_MANIFEST.inputName;
  const input = new ort.Tensor('float32', tensorData, [
    1,
    3,
    YOLO_MODEL_MANIFEST.inputSize,
    YOLO_MODEL_MANIFEST.inputSize,
  ]);

  const start = performance.now();
  const results = await session.run({ [inputName]: input });
  const inferenceMs = performance.now() - start;
  const output = getOutputTensor(session, results);

  return {
    detections: decodeYoloDetections({
      data: output.data as ArrayLike<number>,
      dims: output.dims,
    }),
    inference_ms: Math.round(inferenceMs * 100) / 100,
    model: YOLO_MODEL_MANIFEST.modelFile,
  };
}

export function runYoloSessionFromImageData(
  ort: OrtModule,
  session: OrtSession,
  imageData: ImageData,
): Promise<TranslatePredictionResponse> {
  return runTensor(ort, session, imageDataToTensorData(imageData));
}

export function runYoloSessionFromRgbaBuffer(
  ort: OrtModule,
  session: OrtSession,
  buffer: ArrayBuffer,
  width: number,
  height: number,
): Promise<TranslatePredictionResponse> {
  return runTensor(ort, session, rgbaBufferToTensorData(buffer, width, height));
}
