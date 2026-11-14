"use client";
import AuthGuard from "@/components/auth/AuthGuard";
import ContributionsContent from "./_content";
export default function ContributionsPage() {
  return <AuthGuard><ContributionsContent /></AuthGuard>;
}
