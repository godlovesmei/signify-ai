"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

export default function DocumentationMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-animate]")
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (prefersReducedMotion || rect.top <= window.innerHeight * 0.9) {
        element.classList.add("is-visible");
      }
    });

    if (prefersReducedMotion) return;

    root.dataset.motionReady = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    elements
      .filter((element) => !element.classList.contains("is-visible"))
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div ref={rootRef} className="documentation-motion">
      {children}
      <style jsx global>{`
        .documentation-motion h2,
        .documentation-motion h3 {
          font-family: var(--font-family-body);
        }

        .documentation-motion[data-motion-ready="true"] [data-animate] {
          opacity: 0;
          transform: translate3d(0, 32px, 0);
          transition:
            opacity var(--duration-slow) var(--ease-cohere),
            transform var(--duration-slow) var(--ease-cohere);
          transition-delay: var(--delay, 0ms);
        }

        .documentation-motion[data-motion-ready="true"]
          [data-animate].is-visible {
          opacity: 1;
          transform: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .documentation-motion [data-animate] {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
