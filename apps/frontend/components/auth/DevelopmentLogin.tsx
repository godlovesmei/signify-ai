"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { developmentLoginEnabled } from "@/lib/dataset/config";
import { sanitizeRelativePath } from "@/lib/authRedirect";
import { createClient } from "@/utils/supabase/client";

export function DevelopmentLogin({ nextPath }: { nextPath?: string | null }) {
  const t = useTranslations("auth.development");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!developmentLoginEnabled()) return null;
  return <form className="mt-6 space-y-3 border-t border-cohere-hairline pt-5" onSubmit={async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setFailed(false);
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      setPassword("");
      window.location.assign(sanitizeRelativePath(nextPath));
    } catch { setFailed(true); setBusy(false); }
  }}>
    <p className="text-sm font-medium">{t("title")}</p>
    <p className="text-xs leading-5 text-cohere-body-muted">{t("description")}</p>
    <label className="block text-sm">{t("email")}
      <input className="mt-1 w-full rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2"
        type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
    </label>
    <label className="block text-sm">{t("password")}
      <input className="mt-1 w-full rounded-sm border border-cohere-hairline bg-cohere-canvas px-3 py-2"
        type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
    </label>
    <Button type="submit" variant="outline" isLoading={busy} className="w-full">{t("submit")}</Button>
    {failed && <p role="alert" className="text-sm text-cohere-error">{t("error")}</p>}
  </form>;
}
