import type * as Ort from 'onnxruntime-web/webgpu';

import type { TranslatePredictionResponse } from '@/lib/translateApi';
import { createYoloSession, runYoloSessionFromImageData } from '@/lib/yoloSession';
import type { YoloWorkerRequest, YoloWorkerResponse } from '@/lib/yoloWorkerMessages';

type YoloPredictor = {
  kind: 'worker' | 'main';
  predict(imageData: ImageData): Promise<TranslatePredictionResponse>;
  dispose?: () => void;
};

let predictorPromise: Promise<YoloPredictor> | null = null;
let requestId = 0;

class WorkerYoloPredictor implements YoloPredictor {
  kind = 'worker' as const;

  private readonly worker: Worker;

  private readonly pending = new Map<
    number,
    {
      resolve: (response: TranslatePredictionResponse) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    this.worker = new Worker(new URL('./yolo.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', this.handleMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
    this.worker.addEventListener('messageerror', this.handleWorkerError);
  }

  predict(imageData: ImageData): Promise<TranslatePredictionResponse> {
    const id = requestId;
    requestId += 1;

    const buffer = imageData.data.slice().buffer;
    const message: YoloWorkerRequest = {
      type: 'predict',
      id,
      width: imageData.width,
      height: imageData.height,
      buffer,
    };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(message, [buffer]);
    });
  }

  dispose() {
    this.worker.removeEventListener('message', this.handleMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.removeEventListener('messageerror', this.handleWorkerError);
    this.worker.terminate();
    this.rejectAll(new Error('YOLO worker disposed'));
  }

  private handleMessage = (event: MessageEvent<YoloWorkerResponse>) => {
    const message = event.data;
    const pending = this.pending.get(message.id);
    if (!pending) return;

    this.pending.delete(message.id);
    if (message.type === 'result') {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error));
    }
  };

  private handleWorkerError = () => {
    this.rejectAll(new Error('YOLO worker failed'));
  };

  private rejectAll(error: Error) {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }
}

class MainThreadYoloPredictor implements YoloPredictor {
  kind = 'main' as const;

  private ortPromise: Promise<typeof Ort> | null = null;

  private sessionPromise: ReturnType<typeof createYoloSession> | null = null;

  predict(imageData: ImageData): Promise<TranslatePredictionResponse> {
    return this.getSession().then(async ({ ort, session }) =>
      runYoloSessionFromImageData(ort, session, imageData),
    );
  }

  private async getSession() {
    this.ortPromise ??= import('onnxruntime-web/webgpu');
    const ort = await this.ortPromise;
    this.sessionPromise ??= createYoloSession(ort);
    const session = await this.sessionPromise;
    return { ort, session };
  }
}

async function createPredictor(): Promise<YoloPredictor> {
  if (typeof Worker !== 'undefined') {
    try {
      return new WorkerYoloPredictor();
    } catch {
      // Fall back to main-thread ORT when workers are blocked by the browser/runtime.
    }
  }

  return new MainThreadYoloPredictor();
}

async function getPredictor(): Promise<YoloPredictor> {
  predictorPromise ??= createPredictor();
  return predictorPromise;
}

export async function predictWithBrowserYolo(
  imageData: ImageData,
): Promise<TranslatePredictionResponse> {
  const predictor = await getPredictor();

  try {
    return await predictor.predict(imageData);
  } catch (error) {
    if (predictor.kind !== 'worker') throw error;

    predictor.dispose?.();
    const fallback = new MainThreadYoloPredictor();
    predictorPromise = Promise.resolve(fallback);
    return fallback.predict(imageData);
  }
}
