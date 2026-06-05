import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseConfig } from '@/utils/supabase/config';
import type { Database } from '@/utils/supabase/database.types';

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// Returns { supabase, supabaseResponse }.
// The caller (middleware.ts) MUST return supabaseResponse — not a new
// NextResponse — so that Set-Cookie headers on the session are forwarded.
// ─────────────────────────────────────────────────────────────────────────────

export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient<Database>(
    url,
    publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies onto the request first (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Re-create response so Set-Cookie headers are included
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return { supabase, supabaseResponse };
};
