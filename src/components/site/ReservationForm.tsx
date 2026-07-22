"use client";

import { useFormState } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { createReservation } from "@/lib/actions/reservations";
import { SubmitButton } from "./SubmitButton";
import { FormField, inputClasses } from "./FormField";

export function ReservationForm() {
  const [state, formAction] = useFormState(createReservation, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
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
        <FormField label="Date" htmlFor="reservationDate">
          <input
            id="reservationDate"
            name="reservationDate"
            type="date"
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Heure" htmlFor="reservationTime">
          <input
            id="reservationTime"
            name="reservationTime"
            type="time"
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Nombre de personnes" htmlFor="partySize">
          <input
            id="partySize"
            name="partySize"
            type="number"
            min={1}
            max={50}
            defaultValue={2}
            required
            className={inputClasses}
          />
        </FormField>
        <FormField label="Occasion (optionnel)" htmlFor="occasion">
          <input
            id="occasion"
            name="occasion"
            placeholder="Anniversaire, dîner d'affaires..."
            className={inputClasses}
          />
        </FormField>
      </div>

      <FormField label="Demandes particulières (optionnel)" htmlFor="specialRequests">
        <textarea
          id="specialRequests"
          name="specialRequests"
          rows={4}
          placeholder="Allergies, préférences de placement, occasion spéciale..."
          className={inputClasses}
        />
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
        label="Envoyer ma demande de réservation"
        pendingLabel="Envoi en cours..."
        className="w-full sm:w-auto"
      />
    </form>
  );
}
