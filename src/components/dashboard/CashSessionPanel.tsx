"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { openCashSession, closeCashSession, addCashMovement } from "@/lib/actions/dashboard/cash";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { formatXAF } from "@/lib/utils";

function ResultMessage({ state }: { state: { success: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
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
  );
}

export function OpenSessionForm() {
  const [state, formAction] = useFormState(openCashSession, null);
  return (
    <form action={formAction} className="space-y-4">
      <FormField label="Fonds de caisse initial (XAF)" htmlFor="openingAmount">
        <input
          id="openingAmount"
          name="openingAmount"
          type="number"
          min={0}
          defaultValue={0}
          required
          className={inputClasses}
        />
      </FormField>
      <SubmitButton label="Ouvrir la session" pendingLabel="Ouverture..." className="w-full" />
      <ResultMessage state={state} />
    </form>
  );
}

export function CloseSessionForm({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useFormState(closeCashSession, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <FormField label="Montant compté en caisse (XAF)" htmlFor="closingAmount">
        <input
          id="closingAmount"
          name="closingAmount"
          type="number"
          min={0}
          required
          className={inputClasses}
        />
      </FormField>
      <SubmitButton label="Clôturer la session" pendingLabel="Clôture..." className="w-full" />
      <ResultMessage state={state} />
    </form>
  );
}

export function CashMovementForm({ sessionId }: { sessionId: string }) {
  const [state, formAction] = useFormState(addCashMovement, null);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type" htmlFor="type">
          <select id="type" name="type" className={inputClasses} defaultValue="entree">
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
            <option value="ajustement">Ajustement</option>
          </select>
        </FormField>
        <FormField label="Montant (XAF)" htmlFor="amount">
          <input id="amount" name="amount" type="number" min={1} required className={inputClasses} />
        </FormField>
      </div>
      <FormField label="Motif" htmlFor="reason">
        <input id="reason" name="reason" minLength={3} required className={inputClasses} />
      </FormField>
      <SubmitButton label="Enregistrer le mouvement" pendingLabel="Enregistrement..." className="w-full" />
      <ResultMessage state={state} />
    </form>
  );
}

export function MovementsList({
  movements,
}: {
  movements: { id: string; type: string; amount: number; reason: string | null; created_at: string }[];
}) {
  if (movements.length === 0) {
    return <p className="text-sm text-muted">Aucun mouvement enregistré.</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {movements.map((m) => (
        <li key={m.id} className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
          <div>
            <span className="capitalize text-champagne">{m.type}</span>
            {m.reason ? <span className="ml-2 text-xs text-muted">{m.reason}</span> : null}
          </div>
          <span className="text-gold">{formatXAF(m.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
