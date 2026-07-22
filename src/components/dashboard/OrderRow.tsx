"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Wallet } from "lucide-react";
import { StatusSelect } from "./StatusSelect";
import { updateOrderStatus, recordPayment } from "@/lib/actions/dashboard/orders";
import { orderStatuses, toOptions } from "@/lib/statuses";
import { formatXAF } from "@/lib/utils";
import { SubmitButton } from "@/components/site/SubmitButton";
import { inputClasses } from "@/components/site/FormField";

const PAYABLE_STATUSES = new Set(["payee", "annulee", "remboursee"]);

type Order = {
  id: string;
  order_number: string;
  source: string;
  status: string;
  total_amount: number;
  created_at: string;
  dining_tables: { label: string } | null;
};

export function OrderRow({ order }: { order: Order }) {
  const [payOpen, setPayOpen] = useState(false);
  const [state, formAction] = useFormState(recordPayment, null);
  const canPay = !PAYABLE_STATUSES.has(order.status);

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-champagne">{order.order_number}</td>
      <td className="px-4 py-3 text-muted">{order.dining_tables?.label ?? "—"}</td>
      <td className="px-4 py-3 text-muted capitalize">{order.source.replace("_", " ")}</td>
      <td className="px-4 py-3 text-muted">
        {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </td>
      <td className="px-4 py-3 text-gold">{formatXAF(Number(order.total_amount))}</td>
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
              className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold hover:bg-gold/10"
            >
              <Wallet size={13} /> Encaisser
            </button>
            {payOpen ? (
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
                <input
                  type="number"
                  name="amount"
                  min={1}
                  defaultValue={Number(order.total_amount)}
                  className={inputClasses}
                  required
                />
                <SubmitButton label="Valider" pendingLabel="..." className="w-full !py-1.5 text-xs" />
                {state && !state.success ? (
                  <p className="text-xs text-red-400">{state.message}</p>
                ) : null}
              </form>
            ) : null}
          </>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
    </tr>
  );
}
