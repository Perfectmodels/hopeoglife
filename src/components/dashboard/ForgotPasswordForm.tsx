"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  if (state?.success) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/5 p-4 text-sm text-champagne">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" />
        <p>{state.message}</p>
      </div>
    );
  }

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

      {state && !state.success ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <SubmitButton
        label="Envoyer le lien de réinitialisation"
        pendingLabel="Envoi..."
        className="w-full"
      />
    </form>
  );
}
