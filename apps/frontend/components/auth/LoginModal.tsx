"use client";

import { useEffect, useState } from "react";
import { X, Shield, Sparkles, Lock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      setError(null);
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      {/* ═══════════════════════════════════════════════════════════════
          BACKDROP — Deep blur with ambient glow
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Ambient glow behind modal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full bg-primary/10 blur-[120px]"
      />

      {/* ═══════════════════════════════════════════════════════════════
          MODAL CARD — Clean, centered, well-spaced
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "relative z-10 w-full max-w-[400px]",
          "flex max-h-[calc(100dvh-2rem)] flex-col items-center overflow-y-auto overflow-x-hidden overscroll-contain",
          "rounded-3xl",
          "bg-card/95 dark:bg-card/80",
          "shadow-2xl shadow-black/10 dark:shadow-black/30",
          "px-5 py-6 sm:px-8 sm:py-10",
          "border border-border/50",
          "animate-in fade-in zoom-in-95 duration-300",
        )}
      >
        {/* Subtle top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in"
          className={cn(
            "absolute top-4 right-4 z-20",
            "size-8 flex items-center justify-center rounded-full",
            "text-muted-foreground/50 hover:text-foreground hover:bg-muted",
            "transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        {/* ── Logo + Identity ────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center sm:mb-8">
          {/* Logo container - cleaner, no excessive glow */}
          <div className="relative mb-1" aria-hidden="true">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 sm:h-12 sm:w-12">
              <Logo href={false} size="sm" showWordmark={false} />
            </div>
          </div>

          {/* Title hierarchy - clearer */}
          <div className="space-y-1">
            <h1 className="font-display text-xl font-bold text-foreground tracking-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Signify
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time BISINDO sign language recognition
            </p>
          </div>
        </div>

        {/* ── Value propositions ─────────────────────────────────────── */}
        <div className="w-full space-y-2 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Save your history</p>
              <p className="text-xs text-muted-foreground">
                Track every sign you translate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Privacy first</p>
              <p className="text-xs text-muted-foreground">
                Camera never leaves your device
              </p>
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div className="w-full flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
            Continue with
          </span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* ── Google Sign-In ─────────────────────────────────────────── */}
        <div className="w-full flex flex-col items-center gap-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-busy={loading}
            aria-label={loading ? "Signing in…" : "Sign in with Google"}
            className={cn(
              "w-full h-11 rounded-xl",
              "flex items-center justify-center gap-3",
              "border border-[#dadce0] bg-white",
              "text-sm font-medium text-[#3c4043]",
              "shadow-sm",
              "transition-all duration-200",
              "hover:bg-[#f8f9fa] hover:shadow-md hover:-translate-y-0.5",
              "active:bg-[#f1f3f4] active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            )}
          >
            {loading ? (
              <>
                <svg
                  className="size-4 animate-spin text-[#3c4043]"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <svg
                  className="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Error state */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="w-full flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3"
            >
              <div className="size-1.5 rounded-full bg-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer notices ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 text-center">
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3" />
              End-to-end private
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span>No data stored</span>
          </div>
          <p className="text-xs text-muted-foreground/40 leading-relaxed">
            Password and account changes are managed via{" "}
            <a
              href="https://myaccount.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-muted-foreground/70 transition-colors"
            >
              Google Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}