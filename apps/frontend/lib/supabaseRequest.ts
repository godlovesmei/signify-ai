import { SupabaseRequestError, withSupabaseRetry } from "@/lib/supabaseRetry";

export type SupabaseResult<T> = {
  data: T;
  error: { code?: string; message: string } | null;
  status: number;
};

export async function executeSupabaseRequest<T>(
  operation: () => PromiseLike<SupabaseResult<T>>,
): Promise<T> {
  return withSupabaseRetry(async () => {
    const { data, error, status } = await operation();
    if (error) throw new SupabaseRequestError(error.message, status, error.code);
    return data;
  });
}
