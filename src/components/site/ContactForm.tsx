"use client";

import { useFormState } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { sendContactMessage } from "@/lib/actions/contact";
import { SubmitButton } from "./SubmitButton";
import { FormField, inputClasses } from "./FormField";

export function ContactForm() {
  const [state, formAction] = useFormState(sendContactMessage, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="c-firstName">
          <input id="c-firstName" name="firstName" required className={inputClasses} />
        </FormField>
        <FormField label="Nom" htmlFor="c-lastName">
          <input id="c-lastName" name="lastName" required className={inputClasses} />
        </FormField>
        <FormField label="E-mail" htmlFor="c-email">
          <input id="c-email" name="email" type="email" required className={inputClasses} />
        </FormField>
        <FormField label="Téléphone (optionnel)" htmlFor="c-phone">
          <input id="c-phone" name="phone" type="tel" className={inputClasses} />
        </FormField>
      </div>

      <FormField label="Sujet (optionnel)" htmlFor="c-subject">
        <input id="c-subject" name="subject" className={inputClasses} />
      </FormField>

      <FormField label="Message" htmlFor="c-message">
        <textarea id="c-message" name="message" rows={5} required className={inputClasses} />
      </FormField>

      {state ? (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
            state.success
              ? "border-gold/40 bg-gold/5 text-champagne"
              : "border-red-500/40 bg-red-500/5 text-red-300"
          }`}
        >
          {state.success ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" />
          ) : (
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" />
          )}
          <p>{state.message}</p>
        </div>
      ) : null}

      <SubmitButton
        label="Envoyer le message"
        pendingLabel="Envoi en cours..."
        className="w-full sm:w-auto"
      />
    </form>
  );
}
