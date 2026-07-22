"use client";

import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createStockItem, recordStockMovement } from "@/lib/actions/dashboard/stock";
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

export function NewStockItemForm() {
  const [state, formAction] = useFormState(createStockItem, null);
  return (
    <form action={formAction} className="space-y-3">
      <FormField label="Nom du produit" htmlFor="stock-name">
        <input id="stock-name" name="name" required className={inputClasses} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Unité" htmlFor="stock-unit">
          <input id="stock-unit" name="unit" placeholder="kg, L, unité..." required className={inputClasses} />
        </FormField>
        <FormField label="Catégorie (optionnel)" htmlFor="stock-category">
          <input id="stock-category" name="category" className={inputClasses} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Quantité initiale" htmlFor="stock-qty">
          <input id="stock-qty" name="quantityOnHand" type="number" min={0} step="0.01" defaultValue={0} className={inputClasses} />
        </FormField>
        <FormField label="Seuil d'alerte" htmlFor="stock-threshold">
          <input id="stock-threshold" name="lowStockThreshold" type="number" min={0} step="0.01" defaultValue={0} className={inputClasses} />
        </FormField>
      </div>
      <SubmitButton label="Ajouter le produit" pendingLabel="Ajout..." className="w-full" />
      <Result state={state} />
    </form>
  );
}

export function StockMovementForm({ items }: { items: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(recordStockMovement, null);
  return (
    <form action={formAction} className="space-y-3">
      <FormField label="Produit" htmlFor="move-item">
        <select id="move-item" name="stockItemId" required className={inputClasses} defaultValue="">
          <option value="" disabled>
            Sélectionnez un produit
          </option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type" htmlFor="move-type">
          <select id="move-type" name="type" className={inputClasses} defaultValue="entree">
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
            <option value="perte">Perte</option>
            <option value="ajustement">Ajustement (+/-)</option>
            <option value="inventaire">Inventaire (nouvelle quantité)</option>
          </select>
        </FormField>
        <FormField label="Quantité" htmlFor="move-quantity">
          <input id="move-quantity" name="quantity" type="number" step="0.01" required className={inputClasses} />
        </FormField>
      </div>
      <FormField label="Motif (optionnel)" htmlFor="move-reason">
        <input id="move-reason" name="reason" className={inputClasses} />
      </FormField>
      <SubmitButton label="Enregistrer le mouvement" pendingLabel="Enregistrement..." className="w-full" />
      <Result state={state} />
    </form>
  );
}
