'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import ReferencePageContent from './_content';

export default function ReferencePage() {
  return (
    <AuthGuard>
      <ReferencePageContent />
    </AuthGuard>
  );
}
