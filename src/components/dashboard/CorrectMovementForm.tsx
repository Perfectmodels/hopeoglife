"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2, Pencil } from "lucide-react";
import { correctStockReceiptItem } from "@/lib/actions/dashboard/stock-receipts";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

export function CorrectMovementForm({
  receiptItemId,
  currentQuantity,
  unit,
}: {
  receiptItemId: string;
  currentQuantity: number;
  unit: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(correctStockReceiptItem, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted hover:text-gold"
      >
        <Pencil size={12} /> Corriger
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-background p-3">
      <input type="hidden" name="receiptItemId" value={receiptItemId} />
      <FormField label={`Nouvelle quantité reçue (${unit})`} htmlFor={`correct-qty-${receiptItemId}`}>
        <input
          id={`correct-qty-${receiptItemId}`}
          name="newQuantity"
          type="number"
          min={0}
          step="0.01"
          defaultValue={currentQuantity}
          required
          className={inputClasses}
        />
      </FormField>
      <FormField label="Motif" htmlFor={`correct-reason-${receiptItemId}`}>
        <input id={`correct-reason-${receiptItemId}`} name="reason" required className={inputClasses} />
      </FormField>
      {state && !state.success ? (
        <p className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={14} /> {state.message}
        </p>
      ) : null}
      {state?.success ? (
        <p className="flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 size={14} /> {state.message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-lg border border-border-subtle py-1.5 text-xs text-muted hover:border-gold/50 hover:text-champagne"
        >
          Fermer
        </button>
        <SubmitButton label="Enregistrer la correction" pendingLabel="Enregistrement..." className="flex-1" />
      </div>
    </form>
  );
}
