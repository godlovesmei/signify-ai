'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import CollectPageContent from './_content';

export default function CollectPage() {
  return (
    <AuthGuard>
      <CollectPageContent />
    </AuthGuard>
  );
}
