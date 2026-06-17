import { describe, expect, it, vi, beforeEach } from 'vitest';

import { predictWithBrowserYolo } from '@/lib/browserYoloRuntime';
import { predictFromImageData, predictFromVideoFrame } from '@/lib/translateApi';

vi.mock('@/lib/browserYoloRuntime', () => ({
  predictWithBrowserYolo: vi.fn(),
}));

const mockedPredictWithBrowserYolo = vi.mocked(predictWithBrowserYolo);

function makeResponse() {
  return {
    detections: [
      {
        class: 'A',
        confidence: 0.9,
        box: { x1: 10, y1: 20, x2: 200, y2: 220 },
      },
    ],
    inference_ms: 14.2,
    model: 'best.onnx',
  };
}

function makeImageData(width = 1, height = 1): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  } as ImageData;
}

describe('translateApi browser inference facade', () => {
  beforeEach(() => {
    mockedPredictWithBrowserYolo.mockReset();
  });

  it('TC-011 returns parsed browser inference response', async () => {
    const response = makeResponse();
    const imageData = makeImageData();
    mockedPredictWithBrowserYolo.mockResolvedValue(response);

    await expect(predictFromImageData(imageData)).resolves.toEqual(response);
    expect(mockedPredictWithBrowserYolo).toHaveBeenCalledWith(imageData);
  });

  it('TC-011 does not call the legacy FastAPI prediction endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    mockedPredictWithBrowserYolo.mockResolvedValue(makeResponse());

    await expect(predictFromImageData(makeImageData())).resolves.toMatchObject({
      model: 'best.onnx',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('TC-011 returns null when browser inference fails', async () => {
    mockedPredictWithBrowserYolo.mockRejectedValue(new Error('model unavailable'));

    await expect(predictFromImageData(makeImageData())).resolves.toBeNull();
  });

  it('captures a video frame directly into ImageData before inference', async () => {
    const response = makeResponse();
    const imageData = makeImageData();
    const drawImage = vi.fn();
    const getImageData = vi.fn(() => imageData);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
      getImageData,
    } as unknown as CanvasRenderingContext2D);
    mockedPredictWithBrowserYolo.mockResolvedValue(response);

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');

    await expect(predictFromVideoFrame(video, canvas, { inputSize: 1 })).resolves.toEqual(response);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1, 1);
    expect(getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
    expect(mockedPredictWithBrowserYolo).toHaveBeenCalledWith(imageData);
  });
});
