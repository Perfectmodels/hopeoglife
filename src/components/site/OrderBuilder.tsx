"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

const ITEMS_PER_PAGE = 12;

export function OrderBuilder({
  restaurantMenu,
  barMenu,
}: {
  restaurantMenu: DemoMenuCategory[];
  barMenu: DemoMenuCategory[];
}) {
  const [tab, setTab] = useState<"restaurant" | "bar">("restaurant");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Record<"restaurant" | "bar", string>>({
    restaurant: restaurantMenu[0]?.id ?? "",
    bar: barMenu[0]?.id ?? "",
  });
  const [state, formAction] = useFormState(createOnlineOrder, null);

  const categories = tab === "restaurant" ? restaurantMenu : barMenu;
  const destination = tab === "restaurant" ? "cuisine" : "bar";
  const normalizedQuery = normalizeSearch(query);
  const allItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({ ...item, categoryName: category.name }))
      ),
    [categories]
  );
  const visibleItems = useMemo(() => {
    if (normalizedQuery) {
      return allItems.filter((item) =>
        normalizeSearch(`${item.name} ${item.description} ${item.categoryName}`).includes(
          normalizedQuery
        )
      );
    }
    const category =
      categories.find((item) => item.id === selectedCategory[tab]) ?? categories[0];
    return (category?.items ?? []).map((item) => ({
      ...item,
      categoryName: category?.name ?? "",
    }));
  }, [allItems, categories, normalizedQuery, selectedCategory, tab]);
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
  const paginatedItems = visibleItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

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
    <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.85fr)]">
      <div className="min-w-0">
        <div className="flex gap-2">
          {(["restaurant", "bar"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setQuery("");
                setPage(1);
              }}
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

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-border-subtle bg-background-elevated px-3">
          <Search size={17} className="shrink-0 text-gold" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un plat ou une boisson…"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>

        {!normalizedQuery ? (
          <div className="mt-4">
            <label className="sr-only" htmlFor={`order-category-${tab}`}>
              Catégorie
            </label>
            <select
              id={`order-category-${tab}`}
              value={selectedCategory[tab] || categories[0]?.id}
              onChange={(event) => {
                setSelectedCategory((current) => ({
                  ...current,
                  [tab]: event.target.value,
                }));
                setPage(1);
              }}
              className={cn(inputClasses, "sm:hidden")}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.items.length})
                </option>
              ))}
            </select>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory((current) => ({ ...current, [tab]: category.id }));
                    setPage(1);
                  }}
                  className={cn(
                    "min-h-10 rounded-full border px-3.5 text-xs transition-colors",
                    (selectedCategory[tab] || categories[0]?.id) === category.id
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border-subtle text-muted hover:border-gold hover:text-gold"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <div className="flex items-end justify-between gap-3">
            <h3 className="font-display text-xl text-gold-soft">
              {normalizedQuery
                ? `Résultats pour « ${query} »`
                : categories.find(
                    (category) =>
                      category.id === (selectedCategory[tab] || categories[0]?.id)
                  )?.name}
            </h3>
            <span className="text-xs text-muted">{visibleItems.length} article(s)</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {paginatedItems.map((item) => (
              <div
                key={item.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-background-elevated p-2"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <ShoppingBag
                      size={18}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-display text-sm leading-snug text-champagne">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-gold">{formatXAF(item.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  disabled={item.isOrderable === false}
                  aria-label={`Ajouter ${item.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-border-subtle disabled:text-muted disabled:hover:bg-transparent"
                >
                  {item.isOrderable === false ? (
                    <span className="text-[8px] uppercase">Place</span>
                  ) : (
                    <Plus size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
          {visibleItems.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
              Aucun produit trouvé.
            </div>
          ) : null}
          {totalPages > 1 ? (
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border-subtle px-3 text-xs text-muted hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <span className="text-xs text-muted">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border-subtle px-3 text-xs text-muted hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <aside className="h-fit min-w-0 rounded-2xl border border-border-subtle bg-background-elevated p-4 sm:p-6 xl:sticky xl:top-28">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-gold" />
          <p className="font-display text-lg text-champagne">Votre panier</p>
        </div>

        {cartLines.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Aucun article sélectionné pour le moment.</p>
        ) : (
          <div className="dashboard-scrollbar mt-6 max-h-[38dvh] space-y-4 overflow-y-auto pr-1">
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
            <div className="grid gap-3 sm:grid-cols-2">
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

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("fr");
}
