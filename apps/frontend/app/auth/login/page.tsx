'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

// ─── Error message map ────────────────────────────────────────────────────────
// Maps URL error params (set by callback/route.ts) to plain-language strings.
const CALLBACK_ERRORS: Record<string, string> = {
  auth_callback_failed: 'Sign-in failed. Please try again.',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick up errors forwarded from the OAuth callback route
  useEffect(() => {
    const cbError = searchParams.get('error');
    if (cbError) {
      setError(CALLBACK_ERRORS[cbError] ?? 'Sign-in failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Supabase will redirect here after Google consent
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Request refresh token so sessions survive browser restarts
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (oauthError) {
      setError('Sign-in failed. Please try again.');
      setLoading(false);
      // On success, Supabase triggers a full-page redirect — no need to reset loading
    }
  };

  return (
    /*
      Full-screen muted overlay.
      bg-background/95 + backdrop-blur gives the impression of the landing page
      underneath without distracting from the modal.
    */
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">

      {/* Subtle radial green tint behind the card — reinforces brand */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,_var(--color-primary-100)_0%,_transparent_100%)] opacity-50"
      />

      {/* ── Modal card ─────────────────────────────────────────────────────── */}
      <div
        role="main"
        className={cn(
          'relative z-10 w-full max-w-sm',
          'flex flex-col items-center gap-6',
          'rounded-2xl border border-border',
          'bg-card/90 backdrop-blur-md',
          'shadow-xl shadow-black/8',
          'px-8 py-10',
        )}
      >
        {/* ── Logo + App identity ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Signify
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time BISINDO sign language recognition
            </p>
          </div>
        </div>

        {/* ── Value proposition ──────────────────────────────────────────── */}
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          Sign in to save your translation history and track your practice progress.
        </p>

        <div className="w-full h-px bg-border" aria-hidden="true" />

        {/* ── Google Sign-In ─────────────────────────────────────────────── */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-busy={loading}
            aria-label={loading ? 'Signing in…' : 'Sign in with Google'}
            className={cn(
              // Google brand guidelines: white bg, #3c4043 text, #dadce0 border
              // Never restyle the Google button beyond these sanctioned states
              'w-full h-12 rounded-lg',
              'flex items-center justify-center gap-3',
              'border border-[#dadce0] bg-white',
              'text-sm font-medium text-[#3c4043]',
              'shadow-sm',
              'transition-all duration-150',
              'hover:bg-[#f8f9fa]',
              'active:bg-[#f1f3f4] active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {loading ? (
              /* Spinner replaces Google logo while request is in-flight */
              <>
                <svg
                  className="size-4 animate-spin text-[#3c4043]"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                {/* Official Google G — four-colour logo, never recoloured */}
                <svg
                  className="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Error state — plain language, no jargon */}
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-center text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </div>

        {/* ── Footer notices ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5 text-center">
          <p className="text-xs text-muted-foreground">
            Your camera stays on your device. No video is uploaded or stored.
          </p>
          <p className="text-xs text-muted-foreground">
            Password and account changes are managed via{' '}
            <a
              href="https://myaccount.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Google Account
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}