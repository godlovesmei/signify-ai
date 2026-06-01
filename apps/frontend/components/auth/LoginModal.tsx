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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-3xl transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-emerald-500/10 blur-[180px]"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-[480px]",
          "rounded-[3.5rem]",
          "bg-black border border-white/10",
          "shadow-[0_0_100px_rgba(0,0,0,1)]",
          "px-8 py-12 sm:px-12 sm:py-16",
          "animate-in fade-in zoom-in-95 duration-500",
          "glass-panel overflow-hidden"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-white" />
        
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in"
          className={cn(
            "absolute top-8 right-8 z-20",
            "size-10 flex items-center justify-center rounded-2xl",
            "bg-white/5 text-white/30 hover:text-white hover:bg-white/10",
            "transition-all duration-300 group"
          )}
        >
          <X className="size-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
        </button>

        <div className="mb-12 flex flex-col items-center gap-6 text-center">
          <div className="relative mb-2">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-black border border-white/10 shadow-3xl">
              <Logo href={false} size="lg" showWordmark={false} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-black text-4xl text-white tracking-tighter">
              NEURAL ENTRY
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Biometric & Neural Authorization
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-4 rounded-3xl bg-white/[0.02] border border-white/5 p-5 transition-colors hover:bg-white/[0.04]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-emerald-400">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Encrypted Workspace</p>
              <p className="text-[9px] font-bold text-white/20">All translation logs are locally encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-3xl bg-white/[0.02] border border-white/5 p-5 transition-colors hover:bg-white/[0.04]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-cyan-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Neural Telemetry</p>
              <p className="text-[9px] font-bold text-white/20">Sync your practice progress across nodes</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={cn(
              "relative group w-full h-16 flex items-center justify-center gap-3 overflow-hidden rounded-[1.5rem] bg-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50",
            )}
          >
             <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-white/50 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000 pointer-events-none" />
             
             {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
             ) : (
                <>
                  <svg className="size-5" viewBox="0 0 24 24">
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
                  <span className="font-black text-sm text-black uppercase tracking-widest">Authorize with Google</span>
                </>
             )}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-[10px] font-black text-red-500 uppercase tracking-widest justify-center">
               <div className="size-1 bg-red-500 rounded-full animate-pulse" />
               {error}
            </div>
          )}

          <div className="pt-8 text-center">
             <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
               By authorizing, you agree to secure neural telemetry and local data processing protocols.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}