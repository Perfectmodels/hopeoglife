"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupplier } from "@/lib/actions/dashboard/suppliers";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

function Result({ state }: { state: { success: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
        state.success
          ? "border-gold/40 bg-gold/5 text-champagne"
          : "border-red-500/40 bg-red-500/5 text-red-300"
      }`}
    >
      {state.success ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-gold" />
      ) : (
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <p>{state.message}</p>
    </div>
  );
}

export function NewSupplierForm() {
  const [state, formAction] = useFormState(createSupplier, null);
  return (
    <form action={formAction} className="space-y-3">
      <FormField label="Nom du fournisseur" htmlFor="supplier-name">
        <input id="supplier-name" name="name" required className={inputClasses} />
      </FormField>
      <FormField label="Contact (optionnel)" htmlFor="supplier-contact">
        <input id="supplier-contact" name="contactName" className={inputClasses} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" htmlFor="supplier-phone">
          <input id="supplier-phone" name="phone" className={inputClasses} />
        </FormField>
        <FormField label="E-mail" htmlFor="supplier-email">
          <input id="supplier-email" name="email" type="email" className={inputClasses} />
        </FormField>
      </div>
      <FormField label="Notes (optionnel)" htmlFor="supplier-notes">
        <textarea id="supplier-notes" name="notes" rows={2} className={inputClasses} />
      </FormField>
      <SubmitButton label="Ajouter le fournisseur" pendingLabel="Ajout..." className="w-full" />
      <Result state={state} />
    </form>
  );
}
