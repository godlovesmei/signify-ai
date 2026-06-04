import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import LandingNavbar from "@/components/layout/LandingNavbar";
import DocumentationMotion from "./_components/DocumentationMotion";

export default function DocumentationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xs bg-[var(--color-bg-inverse)] px-4 py-2 text-[14px] text-[var(--color-text-inverse)] transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <DocumentationMotion>{children}</DocumentationMotion>
      <Footer />
    </div>
  );
}
