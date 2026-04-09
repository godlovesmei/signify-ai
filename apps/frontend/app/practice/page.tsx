'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import PracticePageContent from './_content';

export default function PracticePage() {
  return (
    <AuthGuard>
      <PracticePageContent />
    </AuthGuard>
  );
}
