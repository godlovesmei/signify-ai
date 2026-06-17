'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import TranslatePageContent from './_content';

/**
 * translate/page.tsx — Protected route shell.
 *
 * Responsibilities of THIS file:
 *   - Wrap content with AuthGuard (redirects unauthenticated users to /auth/login)
 *   - Nothing else — all detection logic lives in ./_content.tsx
 *
 * Why the split?
 *   AuthGuard is a client component that runs a useEffect on mount.
 *   Keeping it in the page shell means the heavy detection logic in _content.tsx
 *   is only ever rendered after the auth check passes — no flash of protected UI.
 */
export default function TranslatePage() {
  return (
    <AuthGuard>
      <TranslatePageContent />
    </AuthGuard>
  );
}