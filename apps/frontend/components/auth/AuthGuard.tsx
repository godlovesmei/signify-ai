'use client';

/**
 * AuthGuard.tsx
 *
 * Wraps any page that requires authentication.
 * - Checks session via Supabase browser client on mount
 * - Shows a neutral loading state while the session check is in-flight
 *   (avoids a flash of protected content before the redirect fires)
 * - Shows the LoginModal if the user is unauthenticated.
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
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { LoginModal } from '@/components/auth/LoginModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export default function AuthGuard({ children }: AuthGuardProps) {
  const router   = useRouter();
  const [authState, setAuthState] = useState<AuthState>('checking');

  useEffect(() => {
    const supabase = createClient();

    // Initial session check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAuthState('authenticated');
      } else {
        setAuthState('unauthenticated');
      }
    });

    // Also listen for auth state changes (sign-out mid-session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthState('unauthenticated');
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Neutral loading screen — no flash of protected content
  if (authState === 'checking') {
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

  // Show LoginModal over a neutral background if unauthenticated
  if (authState === 'unauthenticated') {
    return (
      <>
        <div className="h-dvh w-full bg-background" />
        <LoginModal open={true} onClose={() => router.push('/')} />
      </>
    );
  }

  return <>{children}</>;
}