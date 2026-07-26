"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Clock, AlertTriangle, Flame } from "lucide-react";
import { updateOrderItemStatus } from "@/lib/actions/dashboard/orders";
import { cn } from "@/lib/utils";

export type TicketItem = {
  id: string;
  name: string;
  quantity: number;
  notes: string | null;
  status: string;
  modifiers: string[];
  priority: string;
};

export type Ticket = {
  orderId: string;
  orderNumber: string;
  tableLabel: string | null;
  customerName: string | null;
  createdAt: string;
  items: TicketItem[];
};

const nextAction: Record<string, { label: string; next: string } | null> = {
  recu: { label: "Commencer", next: "en_preparation" },
  en_preparation: { label: "Marquer prêt", next: "pret" },
  pret: { label: "Marquer servi", next: "servi" },
  servi: null,
  indisponible: null,
};

function ItemRow({ item }: { item: TicketItem }) {
  const [isPending, startTransition] = useTransition();
  const [justUpdated, setJustUpdated] = useState(false);
  const prevStatus = useRef(item.status);
  const action = nextAction[item.status];

  useEffect(() => {
    if (prevStatus.current === item.status) return;
    prevStatus.current = item.status;
    setJustUpdated(true);
    const timer = setTimeout(() => setJustUpdated(false), 900);
    return () => clearTimeout(timer);
  }, [item.status]);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border-b border-border-subtle/60 py-3 transition-[background-color] duration-150 last:border-0",
        item.priority === "urgente" && "-mx-2 rounded-lg border-b-0 bg-red-500/5 px-2",
        justUpdated && "animate-flash-gold"
      )}
    >
      <div>
        <p className="flex items-center gap-1.5 text-sm text-champagne">
          {item.priority === "urgente" ? <Flame size={13} className="text-red-400" /> : null}
          {item.quantity}× {item.name}
        </p>
        {item.modifiers.length > 0 ? (
          <p className="text-xs text-gold-soft">{item.modifiers.join(", ")}</p>
        ) : null}
        {item.notes ? <p className="text-xs text-muted">{item.notes}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {item.status !== "indisponible" && item.status !== "servi" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                updateOrderItemStatus(item.id, "indisponible");
              })
            }
            aria-label="Signaler indisponible"
            className="rounded-full border border-red-500/40 p-2 text-red-400 transition-transform duration-150 hover:bg-red-500/10 active:scale-90 disabled:opacity-50"
          >
            <AlertTriangle size={14} />
          </button>
        ) : null}
        {action ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                updateOrderItemStatus(item.id, action.next);
              })
            }
            className="rounded-full bg-gold px-4 py-2 text-xs font-medium text-background transition-transform duration-150 hover:bg-gold-soft active:scale-90 disabled:opacity-50"
          >
            {action.label}
          </button>
        ) : (
          <span className="text-xs capitalize text-muted">{item.status}</span>
        )}
      </div>
    </div>
  );
}

export function KitchenBoard({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle p-10 text-center text-sm text-muted">
        Aucune commande en attente.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => {
        const elapsedMin = Math.max(
          0,
          Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60000)
        );
        return (
          <div
            key={ticket.orderId}
            className="animate-pop-in rounded-2xl border border-border-subtle bg-background-elevated p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-base text-champagne">
                {ticket.tableLabel ?? "À emporter"}
              </p>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  elapsedMin >= 20 ? "text-red-400" : "text-muted"
                )}
              >
                <Clock size={12} /> {elapsedMin} min
              </span>
            </div>
            <p className="mb-2 text-xs text-muted">
              Commande {ticket.orderNumber}
              {ticket.customerName ? ` — ${ticket.customerName}` : ""}
            </p>
            <div>
              {ticket.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
