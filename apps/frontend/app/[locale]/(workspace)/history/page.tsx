'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import HistoryPageContent from './_content';

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryPageContent />
    </AuthGuard>
  );
}
