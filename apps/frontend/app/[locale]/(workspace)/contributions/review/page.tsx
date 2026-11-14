"use client";
import AuthGuard from "@/components/auth/AuthGuard";
import DatasetAccessGate from "@/components/features/dataset/DatasetAccessGate";
import DatasetCuration from "@/components/features/dataset/DatasetCuration";
export default function CuratorPage() {
  return <AuthGuard><DatasetAccessGate role="curator"><DatasetCuration /></DatasetAccessGate></AuthGuard>;
}
