"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, PackagePlus, Trash2 } from "lucide-react";
import { saveStockReceipt } from "@/lib/actions/dashboard/stock-receipts";
import { formatXAF, cn } from "@/lib/utils";
import { FormField, inputClasses } from "@/components/site/FormField";
import { ReceiptScanner } from "./ReceiptScanner";

function IntentButton({
  intent,
  label,
  pendingLabel,
  disabled,
  variant = "default",
}: {
  intent: "draft" | "validate";
  label: string;
  pendingLabel: string;
  disabled: boolean;
  variant?: "default" | "primary";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={disabled || pending}
      className={cn(
        "rounded-lg px-5 py-2.5 text-xs uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary"
          ? "border border-gold bg-gold/10 text-gold hover:bg-gold/20"
          : "border border-border-subtle text-muted hover:border-gold/50 hover:text-champagne"
      )}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export type ReceiptLine = {
  stockItemId: string;
  name: string;
  unit: string;
  quantityReceived: number;
  unitCost?: number;
  batchNumber?: string;
  manufacturingDate?: string;
  expirationDate?: string;
  stockLocationId?: string;
  condition?: "bon" | "abime" | "perime";
  comment?: string;
};

type Option = { id: string; name: string };

export function ReceiptBuilder({
  mode,
  receiptId,
  receiptNumber,
  initialSupplierId,
  initialInvoiceNumber,
  initialLocationId,
  initialNotes,
  initialLines,
  stockItems,
  suppliers,
  locations,
}: {
  mode: "edit" | "readonly";
  receiptId?: string;
  receiptNumber?: string;
  initialSupplierId?: string;
  initialInvoiceNumber?: string;
  initialLocationId?: string;
  initialNotes?: string;
  initialLines?: ReceiptLine[];
  stockItems: (Option & { unit: string })[];
  suppliers: Option[];
  locations: Option[];
}) {
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(initialInvoiceNumber ?? "");
  const [locationId, setLocationId] = useState(initialLocationId ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [lines, setLines] = useState<ReceiptLine[]>(initialLines ?? []);

  const [draftItemId, setDraftItemId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("");
  const [draftCost, setDraftCost] = useState("");
  const [draftBatch, setDraftBatch] = useState("");
  const [draftManufacturing, setDraftManufacturing] = useState("");
  const [draftExpiration, setDraftExpiration] = useState("");
  const [draftLocationId, setDraftLocationId] = useState("");
  const [draftCondition, setDraftCondition] = useState<"bon" | "abime" | "perime">("bon");
  const [draftComment, setDraftComment] = useState("");

  const [state, formAction] = useFormState(saveStockReceipt, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success && state.receiptId && state.receiptId !== receiptId) {
      router.replace(`/dashboard/stock/receptions/${state.receiptId}`);
      router.refresh();
    }
  }, [state, receiptId, router]);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (l.unitCost ?? 0) * l.quantityReceived, 0),
    [lines]
  );

  function addOrMergeLine(newLine: ReceiptLine) {
    setLines((prev) => {
      const idx = prev.findIndex(
        (l) =>
          l.stockItemId === newLine.stockItemId &&
          (l.batchNumber || "") === (newLine.batchNumber || "") &&
          (l.stockLocationId || "") === (newLine.stockLocationId || "")
      );
      if (idx === -1) return [...prev, newLine];
      const next = [...prev];
      const existing = next[idx];
      next[idx] = {
        ...existing,
        quantityReceived: existing.quantityReceived + newLine.quantityReceived,
        unitCost: existing.unitCost ?? newLine.unitCost,
      };
      return next;
    });
  }

  function addLine() {
    const item = stockItems.find((i) => i.id === draftItemId);
    const quantity = Number(draftQuantity);
    if (!item || !Number.isFinite(quantity) || quantity <= 0) return;

    addOrMergeLine({
      stockItemId: item.id,
      name: item.name,
      unit: item.unit,
      quantityReceived: quantity,
      unitCost: draftCost ? Number(draftCost) : undefined,
      batchNumber: draftBatch || undefined,
      manufacturingDate: draftManufacturing || undefined,
      expirationDate: draftExpiration || undefined,
      stockLocationId: draftLocationId || undefined,
      condition: draftCondition,
      comment: draftComment || undefined,
    });

    setDraftItemId("");
    setDraftQuantity("");
    setDraftCost("");
    setDraftBatch("");
    setDraftManufacturing("");
    setDraftExpiration("");
    setDraftLocationId("");
    setDraftCondition("bon");
    setDraftComment("");
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const readonly = mode === "readonly";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-border-subtle bg-background-elevated p-6 sm:grid-cols-2 lg:grid-cols-4">
        {receiptNumber ? (
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-wider text-muted">Bon de réception</p>
            <p className="font-display text-lg text-gold">{receiptNumber}</p>
          </div>
        ) : null}
        <FormField label="Fournisseur" htmlFor="rb-supplier">
          <select
            id="rb-supplier"
            className={inputClasses}
            value={supplierId}
            disabled={readonly}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="N° de facture" htmlFor="rb-invoice">
          <input
            id="rb-invoice"
            className={inputClasses}
            value={invoiceNumber}
            disabled={readonly}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </FormField>
        <FormField label="Emplacement par défaut" htmlFor="rb-location">
          <select
            id="rb-location"
            className={inputClasses}
            value={locationId}
            disabled={readonly}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">—</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="rb-notes">
          <input
            id="rb-notes"
            className={inputClasses}
            value={notes}
            disabled={readonly}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>
      </div>

      {!readonly ? (
        <ReceiptScanner defaultLocationId={locationId || undefined} onAddLine={addOrMergeLine} />
      ) : null}

      {!readonly ? (
        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-6">
          <p className="mb-4 flex items-center gap-2 font-display text-base text-champagne">
            <PackagePlus size={18} className="text-gold" /> Ajouter un produit manuellement
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Produit" htmlFor="rb-draft-item">
              <select
                id="rb-draft-item"
                className={inputClasses}
                value={draftItemId}
                onChange={(e) => setDraftItemId(e.target.value)}
              >
                <option value="">Sélectionnez un produit</option>
                {stockItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Quantité reçue" htmlFor="rb-draft-qty">
              <input
                id="rb-draft-qty"
                type="number"
                min={0}
                step="0.01"
                className={inputClasses}
                value={draftQuantity}
                onChange={(e) => setDraftQuantity(e.target.value)}
              />
            </FormField>
            <FormField label="Prix d'achat (optionnel)" htmlFor="rb-draft-cost">
              <input
                id="rb-draft-cost"
                type="number"
                min={0}
                step="0.01"
                className={inputClasses}
                value={draftCost}
                onChange={(e) => setDraftCost(e.target.value)}
              />
            </FormField>
            <FormField label="Emplacement (optionnel)" htmlFor="rb-draft-location">
              <select
                id="rb-draft-location"
                className={inputClasses}
                value={draftLocationId}
                onChange={(e) => setDraftLocationId(e.target.value)}
              >
                <option value="">Emplacement par défaut</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="N° de lot (optionnel)" htmlFor="rb-draft-batch">
              <input
                id="rb-draft-batch"
                className={inputClasses}
                value={draftBatch}
                onChange={(e) => setDraftBatch(e.target.value)}
              />
            </FormField>
            <FormField label="Date de fabrication (optionnel)" htmlFor="rb-draft-mfg">
              <input
                id="rb-draft-mfg"
                type="date"
                className={inputClasses}
                value={draftManufacturing}
                onChange={(e) => setDraftManufacturing(e.target.value)}
              />
            </FormField>
            <FormField label="Date d'expiration (optionnel)" htmlFor="rb-draft-exp">
              <input
                id="rb-draft-exp"
                type="date"
                className={inputClasses}
                value={draftExpiration}
                onChange={(e) => setDraftExpiration(e.target.value)}
              />
            </FormField>
            <FormField label="État" htmlFor="rb-draft-condition">
              <select
                id="rb-draft-condition"
                className={inputClasses}
                value={draftCondition}
                onChange={(e) => setDraftCondition(e.target.value as "bon" | "abime" | "perime")}
              >
                <option value="bon">Bon</option>
                <option value="abime">Abîmé</option>
                <option value="perime">Périmé</option>
              </select>
            </FormField>
            <FormField label="Commentaire (optionnel)" htmlFor="rb-draft-comment" className="lg:col-span-4">
              <input
                id="rb-draft-comment"
                className={inputClasses}
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
              />
            </FormField>
          </div>
          <button
            type="button"
            onClick={addLine}
            disabled={!draftItemId || !draftQuantity}
            className="mt-4 rounded-lg border border-gold/50 px-4 py-2 text-xs uppercase tracking-widest text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter à la réception
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated p-4 sm:p-6">
        {lines.length > 0 ? (
          <table className="table-responsive w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2 pr-4">Produit</th>
                <th className="py-2 pr-4">Quantité</th>
                <th className="py-2 pr-4">Prix</th>
                <th className="py-2 pr-4">Lot</th>
                <th className="py-2 pr-4">Expiration</th>
                <th className="py-2 pr-4">État</th>
                {!readonly ? <th className="py-2 pr-4">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className="py-3 pr-4 text-champagne" data-label="Produit">{line.name}</td>
                  <td className="py-3 pr-4 text-muted" data-label="Quantité">
                    {line.quantityReceived} {line.unit}
                  </td>
                  <td className="py-3 pr-4 text-muted" data-label="Prix">
                    {line.unitCost ? formatXAF(line.unitCost) : "—"}
                  </td>
                  <td className="py-3 pr-4 text-muted" data-label="Lot">{line.batchNumber || "—"}</td>
                  <td className="py-3 pr-4 text-muted" data-label="Expiration">{line.expirationDate || "—"}</td>
                  <td className="py-3 pr-4 text-muted capitalize" data-label="État">{line.condition ?? "—"}</td>
                  {!readonly ? (
                    <td className="py-3 pr-4" data-label="Actions">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-muted hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted">Aucun produit ajouté à cette réception.</p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border-subtle/70 pt-4">
          <span className="text-sm text-muted">Articles : {lines.length}</span>
          <span className="font-display text-lg text-gold">Total : {formatXAF(total)}</span>
        </div>
      </div>

      {!readonly ? (
        <form action={formAction} className="space-y-4">
          {receiptId ? <input type="hidden" name="receiptId" value={receiptId} /> : null}
          <input type="hidden" name="supplierId" value={supplierId} />
          <input type="hidden" name="invoiceNumber" value={invoiceNumber} />
          <input type="hidden" name="stockLocationId" value={locationId} />
          <input type="hidden" name="notes" value={notes} />
          <input
            type="hidden"
            name="lines"
            value={JSON.stringify(
              lines.map((l) => ({
                stockItemId: l.stockItemId,
                quantityReceived: l.quantityReceived,
                unitCost: l.unitCost,
                batchNumber: l.batchNumber,
                manufacturingDate: l.manufacturingDate,
                expirationDate: l.expirationDate,
                stockLocationId: l.stockLocationId,
                condition: l.condition,
                comment: l.comment,
              }))
            )}
          />

          {state && !state.success ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{state.message}</p>
            </div>
          ) : null}
          {state?.success ? (
            <div className="flex items-start gap-2 rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs text-champagne">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-gold" />
              <p>{state.message}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <IntentButton
              intent="draft"
              label="Enregistrer le brouillon"
              pendingLabel="Enregistrement..."
              disabled={lines.length === 0}
            />
            <IntentButton
              intent="validate"
              label="Valider la réception"
              pendingLabel="Validation..."
              disabled={lines.length === 0}
              variant="primary"
            />
          </div>
        </form>
      ) : null}
    </div>
  );
}
