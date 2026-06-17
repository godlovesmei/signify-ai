import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");

  return {
    Link: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
      locale?: string;
      [key: string]: unknown;
    }) => {
      delete props.locale;

      return React.createElement(
        "a",
        {
          href,
          ...props,
        },
        children,
      );
    },
    getPathname: ({ href }: { href: string | { pathname?: string } }) =>
      typeof href === "string" ? href : (href.pathname ?? "/"),
    redirect: vi.fn(),
    usePathname: () => window.location.pathname || "/",
    useRouter: () => ({
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
    }),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  value: ResizeObserverMock,
  configurable: true,
});

Object.defineProperty(globalThis, "IntersectionObserver", {
  value: IntersectionObserverMock,
  configurable: true,
});
