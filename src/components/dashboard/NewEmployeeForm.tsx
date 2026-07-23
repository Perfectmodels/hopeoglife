"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createEmployeeProfile } from "@/lib/actions/dashboard/employees";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { roleLabels } from "@/lib/dashboard-nav";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    ""
  );
}

export function NewEmployeeForm() {
  const [state, formAction] = useFormState(createEmployeeProfile, null);
  const [password, setPassword] = useState("");
  const [officeAccess, setOfficeAccess] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">
        Le compte est créé directement dans Supabase Authentication. La connexion au quotidien se
        fait par code PIN.
      </p>
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
          <input id="email" name="email" type="email" required className={inputClasses} />
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

      <FormField label="Code PIN (connexion au quotidien)" htmlFor="pin">
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

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={officeAccess}
          onChange={(e) => setOfficeAccess(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border-subtle"
        />
        Donner aussi un accès e-mail / mot de passe (back-office)
      </label>

      {officeAccess ? (
        <FormField label="Mot de passe temporaire" htmlFor="password">
          <div className="flex gap-2">
            <input
              id="password"
              name="password"
              type="text"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              className={`${inputClasses} font-mono`}
            />
            <button
              type="button"
              onClick={() => setPassword(generatePassword())}
              className="shrink-0 rounded-lg border border-border-subtle px-4 py-3 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
            >
              Générer
            </button>
          </div>
        </FormField>
      ) : null}

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

      <SubmitButton label="Créer le compte" pendingLabel="Création..." className="w-full" />
    </form>
  );
}
