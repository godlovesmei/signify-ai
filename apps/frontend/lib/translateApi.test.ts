import { describe, expect, it, vi } from 'vitest';

import { predictFromBlob } from '@/lib/translateApi';

function makeBlob(): Blob {
  return new Blob(['x'], { type: 'image/jpeg' });
}

describe('translateApi predictFromBlob', () => {
  it('returns parsed response when first request succeeds', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        detections: [
          {
            class: 'A',
            confidence: 0.9,
            box: { x1: 10, y1: 20, x2: 200, y2: 220 },
          },
        ],
        inference_ms: 14.2,
        model: 'best.pt',
      }),
    } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retryDelayMs: 0,
    });

    expect(result).toEqual({
      detections: [
        {
          class: 'A',
          confidence: 0.9,
          box: { x1: 10, y1: 20, x2: 200, y2: 220 },
        },
      ],
      inference_ms: 14.2,
      model: 'best.pt',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and succeeds on next attempt', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          detections: [
            {
              class: 'B',
              confidence: 0.8,
              box: { x1: 5, y1: 15, x2: 120, y2: 170 },
            },
          ],
          inference_ms: 16.8,
          model: 'best.pt',
        }),
      } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result?.detections[0]?.class).toBe('B');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 and succeeds on next attempt', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          detections: [
            {
              class: 'C',
              confidence: 0.85,
              box: { x1: 25, y1: 30, x2: 180, y2: 210 },
            },
          ],
          inference_ms: 12.1,
          model: 'best.pt',
        }),
      } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result?.detections[0]?.class).toBe('C');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-retriable status', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns null after retry attempts are exhausted', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('network down'));

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});