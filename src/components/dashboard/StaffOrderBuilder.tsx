"use client";

import { useFormState } from "react-dom";
import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, AlertCircle } from "lucide-react";
import { createStaffOrder } from "@/lib/actions/dashboard/orders";
import { formatXAF, cn } from "@/lib/utils";
import { SubmitButton } from "@/components/site/SubmitButton";
import { FormField, inputClasses } from "@/components/site/FormField";

type MenuItem = { id: string; name: string; price: number };
type MenuCategory = { id: string; name: string; items: MenuItem[] };

type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  destination: "cuisine" | "bar";
};

export function StaffOrderBuilder({
  restaurantMenu,
  barMenu,
  tables,
}: {
  restaurantMenu: MenuCategory[];
  barMenu: MenuCategory[];
  tables: { id: string; label: string }[];
}) {
  const [tab, setTab] = useState<"restaurant" | "bar">("restaurant");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [state, formAction] = useFormState(createStaffOrder, null);

  const categories = tab === "restaurant" ? restaurantMenu : barMenu;
  const destination = tab === "restaurant" ? "cuisine" : "bar";
  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [cartLines]
  );

  function addToCart(item: MenuItem) {
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
      <div className="rounded-2xl border border-gold/40 bg-gold/5 p-8 text-center">
        <p className="font-display text-xl text-champagne">Commande envoyée</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
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

        <div className="mt-8 space-y-10">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-display text-lg text-gold-soft">{category.name}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-background-elevated px-4 py-3 text-left transition-colors hover:border-gold/50"
                  >
                    <span className="truncate text-sm text-champagne">{item.name}</span>
                    <span className="shrink-0 text-xs text-gold">{formatXAF(item.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-border-subtle bg-background-elevated p-6 lg:sticky lg:top-6">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-gold" />
          <p className="font-display text-lg text-champagne">Commande</p>
        </div>

        {cartLines.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Sélectionnez des articles.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {cartLines.map((line) => (
              <div key={line.menuItemId} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-champagne">{line.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.menuItemId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle text-muted hover:border-gold hover:text-gold"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center text-xs">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(line.menuItemId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle text-muted hover:border-gold hover:text-gold"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border-subtle/70 pt-3">
          <span className="text-sm text-muted">Total</span>
          <span className="font-display text-lg text-gold">{formatXAF(total)}</span>
        </div>

        {cartLines.length > 0 ? (
          <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="cart" value={JSON.stringify(cartLines)} />
            <FormField label="Table (optionnel)" htmlFor="tableId">
              <select id="tableId" name="tableId" className={inputClasses} defaultValue="">
                <option value="">Sur place / à emporter</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Notes (optionnel)" htmlFor="notes">
              <textarea id="notes" name="notes" rows={2} className={inputClasses} />
            </FormField>

            {state && !state.success ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{state.message}</p>
              </div>
            ) : null}

            <SubmitButton label="Envoyer la commande" pendingLabel="Envoi..." className="w-full" />
          </form>
        ) : null}
      </aside>
    </div>
  );
}
