"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { updatePassword } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function ChangePasswordForm() {
  const [state, formAction] = useFormState(updatePassword, null);

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

      {state ? (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            state.success
              ? "border-gold/40 bg-gold/5 text-champagne"
              : "border-red-500/40 bg-red-500/5 text-red-300"
          }`}
        >
          {state.success ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          )}
          <p>{state.message}</p>
        </div>
      ) : null}

      <SubmitButton label="Mettre à jour le mot de passe" pendingLabel="Mise à jour..." />
    </form>
  );
}
