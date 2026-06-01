import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

// ─── Auth-only routes ─────────────────────────────────────────────────────────
// Authenticated users visiting these are redirected away (e.g. back to app).
const AUTH_PREFIXES = ['/auth/signup'];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // IMPORTANT: always call getUser() — never getSession() — in middleware.
  // getUser() re-validates the token with the Supabase Auth server on every
  // request, preventing stale/forged session cookies from passing the guard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from login / signup pages.
  const isAuthPage = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/translate', request.url));
  }

  // Always return supabaseResponse so refreshed Supabase cookies are forwarded.
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (Next.js static files)
     *   - _next/image   (Next.js image optimisation)
     *   - favicon.ico
     *   - Static assets with file extensions (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
