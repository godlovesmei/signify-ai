"use client";
import AuthGuard from "@/components/auth/AuthGuard";
import NewContributionContent from "./_content";
export default function NewContributionPage() {
  return <AuthGuard><NewContributionContent /></AuthGuard>;
}
