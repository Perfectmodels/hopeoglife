"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createEmployeeProfile } from "@/lib/actions/dashboard/employees";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { roleLabels } from "@/lib/dashboard-nav";

export function NewEmployeeForm() {
  const [state, formAction] = useFormState(createEmployeeProfile, null);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">
        Créez d&apos;abord le compte dans Supabase → Authentication → Users, puis complétez son
        profil ici avec l&apos;UID généré.
      </p>
      <FormField label="UID Supabase" htmlFor="userId">
        <input id="userId" name="userId" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required className={inputClasses} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Prénom" htmlFor="firstName">
          <input id="firstName" name="firstName" required className={inputClasses} />
        </FormField>
        <FormField label="Nom" htmlFor="lastName">
          <input id="lastName" name="lastName" required className={inputClasses} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Téléphone" htmlFor="phone">
          <input id="phone" name="phone" className={inputClasses} />
        </FormField>
        <FormField label="E-mail" htmlFor="email">
          <input id="email" name="email" type="email" className={inputClasses} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Rôle" htmlFor="role">
          <select id="role" name="role" className={inputClasses} defaultValue="serveur">
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date d'embauche" htmlFor="hiredAt">
          <input id="hiredAt" name="hiredAt" type="date" className={inputClasses} />
        </FormField>
      </div>

      {state ? (
        <div
          className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
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
      ) : null}

      <SubmitButton label="Créer le profil" pendingLabel="Création..." className="w-full" />
    </form>
  );
}
