"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { Wallet, Receipt, ArrowLeftRight } from "lucide-react";
import { StatusSelect } from "./StatusSelect";
import { StatusBadge } from "./StatusBadge";
import { updateOrderStatus, recordPayment, transferOrderTable } from "@/lib/actions/dashboard/orders";
import { orderStatuses, toOptions } from "@/lib/statuses";
import { formatXAF, cn } from "@/lib/utils";
import { SubmitButton } from "@/components/site/SubmitButton";
import { inputClasses } from "@/components/site/FormField";
import type { EmployeeRole } from "@/lib/auth/session";

const CLOSED_STATUSES = new Set(["annulee", "remboursee"]);
const SERVER_STATUSES = new Set([
  "confirmee",
  "transmise",
  "servie",
  "en_attente_paiement",
]);

type Order = {
  id: string;
  order_number: string;
  source: string;
  status: string;
  total_amount: number;
  created_at: string;
  table_id: string | null;
  dining_tables: { label: string } | null;
  payments: { amount: number }[];
};

export function OrderRow({
  order,
  tables,
  role,
}: {
  order: Order;
  tables: { id: string; label: string }[];
  role: EmployeeRole;
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [pendingSensitiveStatus, setPendingSensitiveStatus] = useState<string | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState("");
  const [state, formAction] = useFormState(recordPayment, null);
  const [isPending, startTransition] = useTransition();

  const paidSoFar = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(order.total_amount) - paidSoFar);
  const closed = CLOSED_STATUSES.has(order.status);
  const isManager = role === "admin" || role === "manager";
  const canChangeStatus = isManager || role === "serveur";
  const canPay =
    !closed && remaining > 0 && (isManager || role === "caissier");
  const canTransfer = !closed && (isManager || role === "serveur");
  const otherTables = tables.filter((t) => t.id !== order.table_id);
  const statusOptions = toOptions(orderStatuses).filter(
    (option) => isManager || SERVER_STATUSES.has(option.value) || option.value === order.status
  );

  async function handleStatusChange(status: string) {
    setStatusError("");
    if (status === "annulee" || status === "remboursee") {
      setPendingSensitiveStatus(status);
      setStatusReason("");
      return;
    }

    const result = await updateOrderStatus(order.id, status);
    if (!result.success) setStatusError(result.message);
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-champagne" data-label="N°">{order.order_number}</td>
      <td className="px-4 py-3 text-muted capitalize" data-label="Origine">{order.source.replace("_", " ")}</td>
      <td className="px-4 py-3 text-muted" data-label="Heure">
        {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </td>
      <td className="px-4 py-3 text-gold" data-label="Total">
        {formatXAF(Number(order.total_amount))}
        {paidSoFar > 0 && remaining > 0 ? (
          <p className="text-[11px] font-normal text-muted">
            Reste {formatXAF(remaining)}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3" data-label="Statut">
        {canChangeStatus ? (
          <>
            <StatusSelect
              value={order.status}
              options={statusOptions}
              onChange={handleStatusChange}
            />
            {pendingSensitiveStatus ? (
              <form
                className="mt-2 w-52 space-y-2 rounded-lg border border-red-500/30 bg-red-500/[0.04] p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  startTransition(async () => {
                    const result = await updateOrderStatus(
                      order.id,
                      pendingSensitiveStatus,
                      statusReason
                    );
                    if (result.success) {
                      setPendingSensitiveStatus(null);
                      setStatusReason("");
                      setStatusError("");
                    } else {
                      setStatusError(result.message);
                    }
                  });
                }}
              >
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-red-300">
                  Motif obligatoire
                </label>
                <textarea
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  minLength={3}
                  rows={2}
                  required
                  className={cn(inputClasses, "resize-none text-xs")}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSensitiveStatus(null)}
                    className="text-[11px] text-muted hover:text-foreground"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : null}
            {statusError ? <p className="mt-1 text-[11px] text-red-400">{statusError}</p> : null}
          </>
        ) : (
          <StatusBadge
            label={orderStatuses[order.status]?.label ?? order.status}
            tone={orderStatuses[order.status]?.tone ?? "neutral"}
          />
        )}
      </td>
      <td className="px-4 py-3" data-label="Paiement">
        {canPay ? (
          <>
            <button
              type="button"
              onClick={() => setPayOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold transition-transform duration-150 hover:bg-gold/10 active:scale-95"
            >
              <Wallet size={13} /> Encaisser
            </button>
            <div className={cn("collapse-panel", payOpen && "is-open")}>
              <div>
                <form action={formAction} className="mt-2 space-y-2 rounded-lg border border-border-subtle bg-background p-3">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="method" className={inputClasses} defaultValue="especes">
                    <option value="especes">Espèces</option>
                    <option value="carte">Carte bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="virement">Virement</option>
                    <option value="en_ligne">En ligne</option>
                    <option value="mixte">Mixte</option>
                    <option value="offert">Offert</option>
                  </select>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted">Montant</label>
                    <input
                      type="number"
                      name="amount"
                      min={1}
                      max={remaining}
                      defaultValue={remaining}
                      className={inputClasses}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted">
                      Pourboire (optionnel)
                    </label>
                    <input type="number" name="tip" min={0} defaultValue={0} className={inputClasses} />
                  </div>
                  <SubmitButton label="Valider" pendingLabel="..." className="w-full py-1.5 text-xs" />
                  {state && !state.success ? (
                    <p className="text-xs text-red-400">{state.message}</p>
                  ) : null}
                </form>
              </div>
            </div>
          </>
        ) : order.status === "payee" ? (
          <Link
            href={`/recu/${order.id}`}
            target="_blank"
            className="flex w-fit items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-xs text-muted hover:border-gold hover:text-gold"
          >
            <Receipt size={13} /> Reçu
          </Link>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3" data-label="Table">
        <p className="text-muted">{order.dining_tables?.label ?? "—"}</p>
        {canTransfer ? (
          <>
            <button
              type="button"
              onClick={() => setTransferOpen((v) => !v)}
              className="mt-1 flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-xs text-muted transition-transform duration-150 hover:border-gold hover:text-gold active:scale-95"
            >
              <ArrowLeftRight size={12} /> Transférer
            </button>
            <div className={cn("collapse-panel", transferOpen && "is-open")}>
              <div>
                <form
                  className="mt-2 flex items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const select = e.currentTarget.elements.namedItem("tableId") as HTMLSelectElement;
                    if (!select.value) return;
                    startTransition(async () => {
                      await transferOrderTable(order.id, select.value);
                      setTransferOpen(false);
                    });
                  }}
                >
                  <select name="tableId" className={inputClasses} defaultValue="" required>
                    <option value="" disabled>
                      Choisir...
                    </option>
                    {otherTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-3 py-1.5 text-xs font-medium text-background transition-transform duration-150 hover:bg-gold-soft active:scale-95 disabled:opacity-50"
                  >
                    {isPending ? "..." : "OK"}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : null}
      </td>
    </tr>
  );
}
