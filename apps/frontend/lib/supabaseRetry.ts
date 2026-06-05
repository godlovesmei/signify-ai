export class SupabaseRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SupabaseRequestError";
    this.status = status;
    this.code = code;
  }
}

export function isRetryableSupabaseError(error: unknown): boolean {
  if (error instanceof SupabaseRequestError) {
    return error.status === 0 || error.status === 429 || error.status >= 500;
  }

  return error instanceof TypeError;
}

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  sleep?: (delayMs: number) => Promise<void>;
}

const sleep = (delayMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export async function withSupabaseRetry<T>(
  operation: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 250,
    sleep: wait = sleep,
  }: RetryOptions = {},
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retries || !isRetryableSupabaseError(error)) throw error;
      await wait(baseDelayMs * 2 ** attempt);
      attempt += 1;
    }
  }
}
