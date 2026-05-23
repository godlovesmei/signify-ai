"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import ProfilePageContent from "./_content";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}