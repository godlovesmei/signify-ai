import { type NextRequest, NextResponse } from 'next/server';
import { sanitizeRelativePath } from '@/lib/authRedirect';
import {
  createClient,
  type SupabaseCookieToSet,
} from '@/utils/supabase/server';

// ─── OAuth callback handler ───────────────────────────────────────────────────
// Supabase redirects here after Google OAuth with ?code=...
// We exchange the code for a session, then send the user to their destination.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host;
  const protocol =
    request.headers.get('x-forwarded-proto') ??
    request.nextUrl.protocol.replace(/:$/, '');
  const requestOrigin = `${protocol}://${host}`;

  const code = searchParams.get('code');
  // `next` is set by middleware when redirecting to login — preserves destination
  const next = sanitizeRelativePath(searchParams.get('next'));

  if (code) {
    const cookiesToSet: SupabaseCookieToSet[] = [];
    const supabase = await createClient((nextCookies) => {
      cookiesToSet.push(...nextCookies);
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let destination = next;
      // Preserve explicit return paths; use the curator panel for the default landing.
      if (next === '/translate' || next === '/en/translate') {
        try {
          const { data: access } = await supabase.rpc('dataset_access_info');
          if (access?.is_curator === true) {
            destination = next.startsWith('/en/') ? '/en/curator' : '/curator';
          }
        } catch {
          // A role lookup outage must not discard a successfully created session.
        }
      }
      const response = NextResponse.redirect(new URL(destination, requestOrigin));
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }
  }

  // Exchange failed — redirect back to login with a plain error signal
  return NextResponse.redirect(
    `${requestOrigin}/?error=auth_callback_failed`,
  );
}
