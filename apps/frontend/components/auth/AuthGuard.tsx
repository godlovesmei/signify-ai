'use client';

/**
 * AuthGuard.tsx
 *
 * Wraps any page that requires authentication.
 * - Checks session via Supabase browser client on mount
 * - Shows a neutral loading state while the session check is in-flight
 *   (avoids a flash of protected content before the redirect fires)
 * - Redirects unauthenticated users to /auth/login, preserving the
 *   intended destination via ?next= so the callback can restore it
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
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function AuthGuard({ children }: AuthGuardProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    const supabase = createClient();

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
        const loginUrl = `/auth/login?next=${encodeURIComponent(pathname)}`;
        router.replace(loginUrl);
      }
    });

    // Also listen for auth state changes (sign-out mid-session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthState('unauthenticated');
          const loginUrl = `/auth/login?next=${encodeURIComponent(pathname)}`;
          router.replace(loginUrl);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  // Neutral loading screen — no flash of protected content
  if (authState === 'checking' || authState === 'unauthenticated') {
    return (
      <div
        className="flex h-dvh w-full items-center justify-center bg-background"
        aria-label="Checking authentication…"
        role="status"
      >
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  return <>{children}</>;
}