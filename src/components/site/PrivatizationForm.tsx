"use client";

import { useFormState } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { createPrivatizationRequest } from "@/lib/actions/privatization";
import { SubmitButton } from "./SubmitButton";
import { FormField, inputClasses } from "./FormField";

const occasions = [
  { value: "anniversaire", label: "Anniversaire" },
  { value: "mariage", label: "Mariage" },
  { value: "diner_prive", label: "Dîner privé" },
  { value: "conference", label: "Conférence" },
  { value: "soiree_entreprise", label: "Soirée d'entreprise" },
  { value: "lancement_produit", label: "Lancement de produit" },
  { value: "reception", label: "Réception" },
  { value: "shooting", label: "Shooting" },
  { value: "ceremonie", label: "Cérémonie" },
  { value: "autre", label: "Autre" },
];

export function PrivatizationForm() {
  const [state, formAction] = useFormState(createPrivatizationRequest, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Type d'événement" htmlFor="occasion">
          <select id="occasion" name="occasion" required className={inputClasses} defaultValue="">
            <option value="" disabled>
              Sélectionnez une occasion
            </option>
            {occasions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Nombre de personnes" htmlFor="partySize">
          <input
            id="partySize"
            name="partySize"
            type="number"
            min={1}
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Date souhaitée" htmlFor="requestedDate">
          <input
            id="requestedDate"
            name="requestedDate"
            type="date"
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Heure souhaitée (optionnel)" htmlFor="requestedTime">
          <input id="requestedTime" name="requestedTime" type="time" className={inputClasses} />
        </FormField>
        <FormField label="Prénom" htmlFor="firstName">
          <input id="firstName" name="firstName" required className={inputClasses} />
        </FormField>
        <FormField label="Nom" htmlFor="lastName">
          <input id="lastName" name="lastName" required className={inputClasses} />
        </FormField>
        <FormField label="Téléphone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" required className={inputClasses} />
        </FormField>
        <FormField label="E-mail (optionnel)" htmlFor="email">
          <input id="email" name="email" type="email" className={inputClasses} />
        </FormField>
      </div>

      <FormField label="Espace(s) souhaité(s) (optionnel)" htmlFor="desiredAreas">
        <input
          id="desiredAreas"
          name="desiredAreas"
          placeholder="Salle intérieure, terrasse, espace VIP..."
          className={inputClasses}
        />
      </FormField>

      <FormField label="Budget indicatif (optionnel)" htmlFor="budgetIndicatif">
        <input id="budgetIndicatif" name="budgetIndicatif" className={inputClasses} />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Menu souhaité (optionnel)" htmlFor="menuSouhaite">
          <textarea id="menuSouhaite" name="menuSouhaite" rows={3} className={inputClasses} />
        </FormField>
        <FormField label="Boissons souhaitées (optionnel)" htmlFor="boissonsSouhaitees">
          <textarea
            id="boissonsSouhaitees"
            name="boissonsSouhaitees"
            rows={3}
            className={inputClasses}
          />
        </FormField>
        <FormField label="Équipements nécessaires (optionnel)" htmlFor="equipements">
          <textarea id="equipements" name="equipements" rows={3} className={inputClasses} />
        </FormField>
        <FormField label="Animations souhaitées (optionnel)" htmlFor="animations">
          <textarea id="animations" name="animations" rows={3} className={inputClasses} />
        </FormField>
      </div>

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
        label="Envoyer ma demande de privatisation"
        pendingLabel="Envoi en cours..."
        className="w-full sm:w-auto"
      />
    </form>
  );
}
