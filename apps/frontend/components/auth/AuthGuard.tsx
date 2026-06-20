'use client';

/**
 * AuthGuard.tsx
 *
 * Wraps any page that requires authentication.
 * - Checks session via Supabase browser client on mount
 * - Shows a neutral loading state while the session check is in-flight
 *   (avoids a flash of protected content before the redirect fires)
 * - Redirects unauthenticated users to the landing login modal.
 *
 * Usage:
 *   export default function ProtectedPage() {
 *     return (
 *       <AuthGuard>
 *         <PageContent />
 *       </AuthGuard>
 *     );
 *   }
 *
 * Note: middleware.ts handles server-side protection for the same routes.
 * This component is the client-side complement — it prevents a brief flash
 * of protected UI on the client before the server redirect resolves.
 */

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { buildLoginPath } from '@/lib/authRedirect';
import { createClient } from '@/utils/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const t = useTranslations('auth.guard');
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const returnPath = `${pathname}${window.location.search}`;
    const redirectToLogin = () => {
      setAuthState('unauthenticated');
      router.replace(buildLoginPath(returnPath, locale));
    };

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (user) {
        setAuthState('authenticated');
      } else {
        redirectToLogin();
      }
    }).catch(() => {
      if (active) redirectToLogin();
    });

    // Also listen for auth state changes (sign-out mid-session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active || event === 'INITIAL_SESSION') return;

        if (session?.user) {
          setAuthState('authenticated');
          return;
        }

        if (event === 'SIGNED_OUT') {
          redirectToLogin();
        }
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [locale, pathname, router]);

  // Neutral loading screen — no flash of protected content
  if (authState === 'checking') {
    return (
      <div
        className="flex h-dvh w-full items-center justify-center bg-background"
        aria-label={t('checking')}
        role="status"
      >
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Middleware handles the first request; this neutral state covers session
  // expiry or sign-out while the protected page is already mounted.
  if (authState === 'unauthenticated') {
    return <div className="h-dvh w-full bg-background" />;
  }

  return <>{children}</>;
}
