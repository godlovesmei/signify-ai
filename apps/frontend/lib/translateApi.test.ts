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
      json: async () => ({ prediction: 'A', confidence: 0.9, low_confidence: false }),
    } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retryDelayMs: 0,
    });

    expect(result).toEqual({ prediction: 'A', confidence: 0.9, low_confidence: false });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries on network error and succeeds on next attempt', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ prediction: 'B', confidence: 0.8, low_confidence: false }),
      } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result?.prediction).toBe('B');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries on 503 and succeeds on next attempt', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ prediction: 'C', confidence: 0.85, low_confidence: false }),
      } as Response);

    const result = await predictFromBlob(makeBlob(), {
      baseUrl: 'http://localhost:8000',
      fetchImpl,
      retries: 2,
      retryDelayMs: 0,
    });

    expect(result?.prediction).toBe('C');
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