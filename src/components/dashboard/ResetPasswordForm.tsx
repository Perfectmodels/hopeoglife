"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function ResetPasswordForm() {
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [state, formAction] = useFormState(updatePassword, null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
        <Loader2 size={16} className="animate-spin" />
        Vérification du lien...
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>Ce lien de réinitialisation est invalide ou a expiré.</p>
        </div>
        <Link
          href="/mot-de-passe-oublie"
          className="block text-center text-sm text-gold hover:underline"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/5 p-4 text-sm text-champagne">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" />
          <p>{state.message}</p>
        </div>
        <Link href="/dashboard" className="block text-center text-sm text-gold hover:underline">
          Accéder à mon espace →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Nouveau mot de passe" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClasses}
        />
      </FormField>
      <FormField label="Confirmer le mot de passe" htmlFor="confirmPassword">
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClasses}
        />
      </FormField>

      {state && !state.success ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <SubmitButton label="Mettre à jour le mot de passe" pendingLabel="Mise à jour..." className="w-full" />
    </form>
  );
}
