import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ─── OAuth callback handler ───────────────────────────────────────────────────
// Supabase redirects here after Google OAuth with ?code=...
// We exchange the code for a session, then send the user to their destination.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  // `next` is set by middleware when redirecting to login — preserves destination
  const next = searchParams.get('next') ?? '/translate';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Exchange failed — redirect back to login with a plain error signal
  return NextResponse.redirect(
    `${origin}/?error=auth_callback_failed`,
  );
}