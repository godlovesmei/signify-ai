import * as ort from 'onnxruntime-web/webgpu';

import type { YoloWorkerRequest, YoloWorkerResponse } from '@/lib/yoloWorkerMessages';
import { createYoloSession, runYoloSessionFromRgbaBuffer } from '@/lib/yoloSession';

let sessionPromise: ReturnType<typeof createYoloSession> | null = null;

function getSession() {
  sessionPromise ??= createYoloSession(ort);
  return sessionPromise;
}

self.onmessage = async (event: MessageEvent<YoloWorkerRequest>) => {
  const message = event.data;
  if (message.type !== 'predict') return;

  try {
    const session = await getSession();
    const result = await runYoloSessionFromRgbaBuffer(
      ort,
      session,
      message.buffer,
      message.width,
      message.height,
    );
    const response: YoloWorkerResponse = { type: 'result', id: message.id, result };
    self.postMessage(response);
  } catch (error) {
    const response: YoloWorkerResponse = {
      type: 'error',
      id: message.id,
      error: error instanceof Error ? error.message : 'YOLO inference failed',
    };
    self.postMessage(response);
  }
};

export {};
