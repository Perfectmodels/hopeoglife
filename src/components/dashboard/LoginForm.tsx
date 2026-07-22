"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function LoginForm() {
  const [state, formAction] = useFormState(signIn, null);

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="E-mail" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className={inputClasses}
        />
      </FormField>
      <FormField label="Mot de passe" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClasses}
        />
      </FormField>

      <div className="text-right">
        <Link href="/mot-de-passe-oublie" className="text-xs text-muted hover:text-gold">
          Mot de passe oublié ?
        </Link>
      </div>

      {state && !state.success ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <SubmitButton label="Se connecter" pendingLabel="Connexion..." className="w-full" />
    </form>
  );
}
