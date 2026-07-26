"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { Wallet, Receipt, ArrowLeftRight } from "lucide-react";
import { StatusSelect } from "./StatusSelect";
import { updateOrderStatus, recordPayment, transferOrderTable } from "@/lib/actions/dashboard/orders";
import { orderStatuses, toOptions } from "@/lib/statuses";
import { formatXAF, cn } from "@/lib/utils";
import { SubmitButton } from "@/components/site/SubmitButton";
import { inputClasses } from "@/components/site/FormField";

const CLOSED_STATUSES = new Set(["annulee", "remboursee"]);

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
}: {
  order: Order;
  tables: { id: string; label: string }[];
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [state, formAction] = useFormState(recordPayment, null);
  const [isPending, startTransition] = useTransition();

  const paidSoFar = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, Number(order.total_amount) - paidSoFar);
  const closed = CLOSED_STATUSES.has(order.status);
  const canPay = !closed && remaining > 0;
  const otherTables = tables.filter((t) => t.id !== order.table_id);

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-champagne">{order.order_number}</td>
      <td className="px-4 py-3 text-muted capitalize">{order.source.replace("_", " ")}</td>
      <td className="px-4 py-3 text-muted">
        {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </td>
      <td className="px-4 py-3 text-gold">
        {formatXAF(Number(order.total_amount))}
        {paidSoFar > 0 && remaining > 0 ? (
          <p className="text-[11px] font-normal text-muted">
            Reste {formatXAF(remaining)}
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <StatusSelect
          value={order.status}
          options={toOptions(orderStatuses)}
          onChange={(status) => updateOrderStatus(order.id, status)}
        />
      </td>
      <td className="px-4 py-3">
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
      <td className="px-4 py-3">
        <p className="text-muted">{order.dining_tables?.label ?? "—"}</p>
        {!closed ? (
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
