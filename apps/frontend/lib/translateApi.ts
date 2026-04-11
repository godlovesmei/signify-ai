export type TranslatePredictionResponse = {
  prediction: string;
  confidence: number;
  low_confidence: boolean;
};

type PredictFromBlobOptions = {
  baseUrl: string;
  accessToken?: string;
  retries?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 120;

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function predictFromBlob(
  blob: Blob,
  {
    baseUrl,
    accessToken,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    fetchImpl = fetch,
  }: PredictFromBlobOptions,
): Promise<TranslatePredictionResponse | null> {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const hasNextAttempt = attempt < retries;
    try {
      const form = new FormData();
      form.append('file', blob, 'hand.jpg');

      const res = await fetchImpl(`${baseUrl}/api/v1/translate/predict`, {
        method: 'POST',
        body: form,
        headers,
      });

      if (res.ok) {
        return (await res.json()) as TranslatePredictionResponse;
      }

      if (!hasNextAttempt || !shouldRetryStatus(res.status)) {
        return null;
      }
    } catch {
      if (!hasNextAttempt) {
        return null;
      }
    }

    if (retryDelayMs > 0) {
      await delay(retryDelayMs * (attempt + 1));
    }
  }

  return null;
}