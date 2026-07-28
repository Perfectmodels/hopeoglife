"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createStockItemForMenuItem,
  linkExistingStockItem,
} from "@/lib/actions/dashboard/stock";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";
import { formatXAF, cn } from "@/lib/utils";

export type UnlinkedMenuItem = {
  id: string;
  name: string;
  price: number;
  categoryName: string | null;
};

type AvailableStockItem = { id: string; name: string; unit: string };

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

/**
 * Le menu compte plusieurs centaines de boissons : on en traite une à la fois
 * via un sélecteur plutôt que d'afficher un formulaire par produit.
 */
export function AttachStockCard({
  menuItems,
  availableStockItems,
}: {
  menuItems: UnlinkedMenuItem[];
  availableStockItems: AvailableStockItem[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<"create" | "link">("create");
  const [createState, createAction] = useFormState(createStockItemForMenuItem, null);
  const [linkState, linkAction] = useFormState(linkExistingStockItem, null);

  const groups = useMemo(() => {
    const map = new Map<string, UnlinkedMenuItem[]>();
    for (const item of menuItems) {
      const key = item.categoryName ?? "Sans catégorie";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [menuItems]);

  const selected = menuItems.find((item) => item.id === selectedId) ?? null;
  const canLink = availableStockItems.length > 0;
  const activeMode = canLink ? mode : "create";

  return (
    <div>
      <p className="font-display text-base text-champagne">Boissons du menu sans stock</p>
      <p className="mb-4 mt-1 text-xs text-muted">
        {menuItems.length} boisson{menuItems.length > 1 ? "s" : ""} du menu n&apos;
        {menuItems.length > 1 ? "ont" : "a"} pas encore de fiche de stock.
      </p>

      <FormField label="Boisson à rattacher" htmlFor="attach-menu-item">
        <select
          id="attach-menu-item"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={inputClasses}
        >
          <option value="">Sélectionnez une boisson</option>
          {groups.map(([category, categoryItems]) => (
            <optgroup key={category} label={category}>
              {categoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </FormField>

      {selected ? (
        <>
          <p className="mt-3 text-xs text-muted">
            Prix menu : <span className="text-gold">{formatXAF(Number(selected.price))}</span>
          </p>

          {canLink ? (
            <div className="mt-3 flex gap-2" role="group" aria-label="Mode de rattachement">
              {(["create", "link"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={activeMode === value}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    activeMode === value
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border-subtle text-muted hover:border-gold hover:text-gold"
                  )}
                >
                  {value === "create" ? "Nouvelle fiche" : "Fiche existante"}
                </button>
              ))}
            </div>
          ) : null}

          {activeMode === "create" ? (
            <form key={`create-${selected.id}`} action={createAction} className="mt-3 space-y-3">
              <input type="hidden" name="menuItemId" value={selected.id} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Unité" htmlFor="attach-unit">
                  <input
                    id="attach-unit"
                    name="unit"
                    placeholder="bouteille, L..."
                    required
                    className={inputClasses}
                  />
                </FormField>
                <FormField label="Catégorie" htmlFor="attach-category">
                  <input
                    id="attach-category"
                    name="category"
                    defaultValue={selected.categoryName ?? ""}
                    className={inputClasses}
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Quantité initiale" htmlFor="attach-qty">
                  <input
                    id="attach-qty"
                    name="quantityOnHand"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={0}
                    className={inputClasses}
                  />
                </FormField>
                <FormField label="Seuil d'alerte" htmlFor="attach-threshold">
                  <input
                    id="attach-threshold"
                    name="lowStockThreshold"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={0}
                    className={inputClasses}
                  />
                </FormField>
              </div>
              <FormField label="Prix d'achat (optionnel)" htmlFor="attach-purchase">
                <input
                  id="attach-purchase"
                  name="purchasePrice"
                  type="number"
                  min={0}
                  step="1"
                  className={inputClasses}
                />
              </FormField>
              <SubmitButton label="Créer la fiche" pendingLabel="Création..." className="w-full" />
            </form>
          ) : (
            <form key={`link-${selected.id}`} action={linkAction} className="mt-3 space-y-3">
              <input type="hidden" name="menuItemId" value={selected.id} />
              <FormField label="Fiche de stock" htmlFor="attach-stock-item">
                <select
                  id="attach-stock-item"
                  name="stockItemId"
                  required
                  defaultValue=""
                  className={inputClasses}
                >
                  <option value="" disabled>
                    Sélectionnez une fiche
                  </option>
                  {availableStockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.unit})
                    </option>
                  ))}
                </select>
              </FormField>
              <SubmitButton label="Relier" pendingLabel="Liaison..." className="w-full" />
            </form>
          )}
        </>
      ) : null}

      {/* Hors du bloc conditionnel : après un succès la boisson quitte la liste,
          le message doit rester visible malgré la disparition du formulaire. */}
      <Result state={activeMode === "create" ? createState : linkState} />
    </div>
  );
}
