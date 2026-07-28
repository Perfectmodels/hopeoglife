"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { CheckCircle2, AlertCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { createOnlineOrder } from "@/lib/actions/orders";
import { formatXAF, cn } from "@/lib/utils";
import type { DemoMenuCategory } from "@/lib/demo-data";
import { SubmitButton } from "./SubmitButton";
import { FormField, inputClasses } from "./FormField";

type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  destination: "cuisine" | "bar";
};

export function OrderBuilder({
  restaurantMenu,
  barMenu,
}: {
  restaurantMenu: DemoMenuCategory[];
  barMenu: DemoMenuCategory[];
}) {
  const [tab, setTab] = useState<"restaurant" | "bar">("restaurant");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [state, formAction] = useFormState(createOnlineOrder, null);

  const categories = tab === "restaurant" ? restaurantMenu : barMenu;
  const destination = tab === "restaurant" ? "cuisine" : "bar";

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [cartLines]
  );

  function addToCart(item: {
    id: string;
    name: string;
    price: number;
    isOrderable?: boolean;
  }) {
    if (item.isOrderable === false) return;
    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          destination,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      };
    });
  }

  function changeQuantity(id: string, delta: number) {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...existing, quantity } };
    });
  }

  if (state?.success) {
    return (
      <div className="flex items-start gap-4 rounded-2xl border border-gold/40 bg-gold/5 p-8">
        <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-gold" />
        <div>
          <p className="font-display text-xl text-champagne">Commande envoyée</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <div className="flex gap-2">
          {(["restaurant", "bar"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full border px-5 py-2 text-xs uppercase tracking-widest transition-colors",
                tab === key
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border-subtle text-muted hover:border-gold/50"
              )}
            >
              {key === "restaurant" ? "Restaurant" : "Bar"}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-12">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-display text-xl text-gold-soft">{category.name}</h3>
              <div className="mt-6 space-y-4">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-background-elevated px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm text-champagne">{item.name}</p>
                      <p className="mt-1 text-xs text-gold">{formatXAF(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      disabled={item.isOrderable === false}
                      className="shrink-0 rounded-full border border-gold/50 px-4 py-2 text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-muted disabled:hover:bg-transparent"
                    >
                      {item.isOrderable === false ? "Sur place" : "Ajouter"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-border-subtle bg-background-elevated p-8 lg:sticky lg:top-28">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-gold" />
          <p className="font-display text-lg text-champagne">Votre panier</p>
        </div>

        {cartLines.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Aucun article sélectionné pour le moment.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {cartLines.map((line) => (
              <div key={line.menuItemId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-champagne">{line.name}</p>
                  <p className="text-xs text-muted">{formatXAF(line.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.menuItemId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-muted hover:border-gold hover:text-gold"
                    aria-label="Retirer une unité"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-4 text-center text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.menuItemId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle text-muted hover:border-gold hover:text-gold"
                    aria-label="Ajouter une unité"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border-subtle/70 pt-4">
          <span className="text-sm text-muted">Total</span>
          <span className="font-display text-lg text-gold">{formatXAF(total)}</span>
        </div>

        {cartLines.length > 0 ? (
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="cart" value={JSON.stringify(cartLines)} />
            <FormField label="Prénom" htmlFor="o-firstName">
              <input id="o-firstName" name="firstName" required className={inputClasses} />
            </FormField>
            <FormField label="Nom" htmlFor="o-lastName">
              <input id="o-lastName" name="lastName" required className={inputClasses} />
            </FormField>
            <FormField label="Téléphone" htmlFor="o-phone">
              <input id="o-phone" name="phone" type="tel" required className={inputClasses} />
            </FormField>
            <FormField label="E-mail (optionnel)" htmlFor="o-email">
              <input id="o-email" name="email" type="email" className={inputClasses} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date de retrait" htmlFor="o-date">
                <input id="o-date" name="pickupDate" type="date" required className={inputClasses} />
              </FormField>
              <FormField label="Heure" htmlFor="o-time">
                <input id="o-time" name="pickupTime" type="time" required className={inputClasses} />
              </FormField>
            </div>
            <FormField label="Notes (optionnel)" htmlFor="o-notes">
              <textarea id="o-notes" name="notes" rows={2} className={inputClasses} />
            </FormField>

            {state && !state.success ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{state.message}</p>
              </div>
            ) : null}

            <p className="text-xs text-muted">
              Retrait sur place — paiement à régler à la réception de la commande.
            </p>

            <SubmitButton
              label="Confirmer la commande"
              pendingLabel="Envoi en cours..."
              className="w-full"
            />
          </form>
        ) : null}
      </aside>
    </div>
  );
}
