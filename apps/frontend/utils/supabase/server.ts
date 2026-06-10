import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseConfig } from '@/utils/supabase/config';
import type { Database } from '@/utils/supabase/database.types';

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// This is async because Next.js 15 made cookies() async.
// Always await createClient() in Server Components, Route Handlers,
// and Server Actions:
//   const supabase = await createClient()
// ─────────────────────────────────────────────────────────────────────────────

export type SupabaseCookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export const createClient = async (
  onCookiesSet?: (cookiesToSet: SupabaseCookieToSet[]) => void,
) => {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          onCookiesSet?.(cookiesToSet);
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware handles session refresh.
          }
        },
      },
    },
  );
};
