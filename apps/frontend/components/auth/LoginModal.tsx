"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Shield, Sparkles, X } from "lucide-react";
import { sanitizeRelativePath } from "@/lib/authRedirect";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/ui/Logo";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  nextPath?: string | null;
}

export function LoginModal({ open, onClose, nextPath }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      setError(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          sanitizeRelativePath(nextPath),
        )}`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (oauthError) {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-title"
      aria-describedby="sign-in-description"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-black/45 animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-[22px] border border-cohere-hairline bg-cohere-canvas text-cohere-ink animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between border-b border-cohere-hairline px-6 py-5">
          <Logo href={false} size="md" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close sign in"
            className="flex size-9 items-center justify-center rounded-sm border border-cohere-hairline text-cohere-slate transition-colors hover:bg-cohere-stone hover:text-cohere-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <p className="text-mono-label text-[12px] text-cohere-coral">Secure workspace</p>
          <h1
            id="sign-in-title"
            className="mt-3 max-w-sm font-display text-[42px] leading-none text-cohere-ink sm:text-[48px]"
          >
            Sign in to continue.
          </h1>
          <p
            id="sign-in-description"
            className="mt-5 max-w-md text-[16px] leading-[1.5] text-cohere-body-muted"
          >
            Access history, practice analytics, and saved preferences without changing the
            local camera workflow.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              { icon: Shield, title: "Local-first video", body: "Camera frames stay constrained to the active session." },
              { icon: Sparkles, title: "Practice continuity", body: "Keep alphabet progress and weak-letter queues." },
              { icon: Lock, title: "Account boundary", body: "Authentication is handled through Supabase and Google." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 border-t border-cohere-hairline pt-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-cohere-stone text-cohere-ink">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-cohere-ink">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.4] text-cohere-slate">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-[32px] bg-cohere-primary px-6 text-[14px] font-medium text-white transition-colors hover:bg-cohere-ink/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <GoogleMark />
            )}
            {loading ? "Opening Google..." : "Continue with Google"}
          </button>

          {error && (
            <p className="mt-4 text-center text-[13px] text-cohere-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
