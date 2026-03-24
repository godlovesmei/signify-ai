import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// This is async because Next.js 15 made cookies() async.
// Always await createClient() in Server Components, Route Handlers,
// and Server Actions:
//   const supabase = await createClient()
// ─────────────────────────────────────────────────────────────────────────────

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
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