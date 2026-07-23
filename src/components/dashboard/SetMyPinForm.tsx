"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { setMyPin } from "@/lib/actions/dashboard/employees";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function SetMyPinForm({ hasPin }: { hasPin: boolean }) {
  const [state, formAction] = useFormState(setMyPin, null);

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-xs leading-relaxed text-muted">
        {hasPin
          ? "Utilisé pour vous connecter rapidement en salle, en cuisine ou au bar."
          : "Aucun code PIN défini pour l'instant — vous ne pouvez pas encore vous connecter par PIN."}
      </p>
      <FormField label={hasPin ? "Nouveau code PIN" : "Code PIN"} htmlFor="pin">
        <input
          id="pin"
          name="pin"
          type="text"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          required
          placeholder="4 à 6 chiffres"
          className={`${inputClasses} font-mono`}
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

      <SubmitButton
        label={hasPin ? "Mettre à jour le PIN" : "Définir mon PIN"}
        pendingLabel="Enregistrement..."
      />
    </form>
  );
}
