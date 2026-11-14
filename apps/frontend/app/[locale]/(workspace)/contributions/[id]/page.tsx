"use client";
import AuthGuard from "@/components/auth/AuthGuard";
import ContributionDetailContent from "./_content";
export default function ContributionDetailPage() {
  return <AuthGuard><ContributionDetailContent /></AuthGuard>;
}
