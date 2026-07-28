"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { MenuItemRow } from "@/components/dashboard/MenuItemRow";
import { NewCategoryForm, NewItemForm } from "@/components/dashboard/MenuForms";
import { inputClasses } from "@/components/site/FormField";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_sellable: boolean;
  is_daily_special: boolean;
};

type Category = {
  id: string;
  name: string;
  kind: string;
  menu_items: Item[];
};

const ITEMS_PER_PAGE = 12;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

export function CatalogManager({ categories }: { categories: Category[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = normalize(query);
  const allCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  const results = useMemo(() => {
    if (!normalizedQuery) return activeCategory?.menu_items ?? [];
    return categories.flatMap((category) =>
      category.menu_items.filter((item) =>
        normalize(`${item.name} ${item.description ?? ""} ${category.name}`).includes(
          normalizedQuery
        )
      )
    );
  }, [activeCategory, categories, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
  const visibleItems = results.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function selectCategory(id: string) {
    setActiveCategoryId(id);
    setQuery("");
    setPage(1);
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-border-subtle bg-background-elevated p-3 sm:p-4">
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-background px-3">
            <Search size={17} className="shrink-0 text-gold" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un produit ou une catégorie…"
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
          </div>

          {!normalizedQuery ? (
            <>
              <label htmlFor="catalog-category" className="sr-only">
                Catégorie du catalogue
              </label>
              <select
                id="catalog-category"
                value={activeCategory?.id}
                onChange={(event) => selectCategory(event.target.value)}
                className={cn(inputClasses, "mt-3 md:hidden")}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.menu_items.length})
                  </option>
                ))}
              </select>
              <div className="mt-3 hidden flex-wrap gap-2 md:flex">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      "min-h-9 rounded-full border px-3 text-xs transition-colors",
                      activeCategory?.id === category.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border-subtle text-muted hover:border-gold/50 hover:text-champagne"
                    )}
                  >
                    {category.name}{" "}
                    <span className="opacity-60">({category.menu_items.length})</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <Card className="mt-4 min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-display text-lg text-gold-soft">
                {normalizedQuery ? `Résultats pour « ${query} »` : activeCategory?.name}
              </p>
              <p className="mt-1 text-xs text-muted">
                {results.length} produit{results.length > 1 ? "s" : ""}
              </p>
            </div>
            {!normalizedQuery && activeCategory ? (
              <span className="text-xs uppercase tracking-widest text-muted">
                {activeCategory.kind === "restaurant" ? "Restaurant" : "Bar"}
              </span>
            ) : null}
          </div>

          {visibleItems.length > 0 ? (
            <div>
              {visibleItems.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState message="Aucun produit trouvé." />
          )}

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
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
        </Card>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
        <Card>
          <p className="mb-4 font-display text-base text-champagne">Nouvelle catégorie</p>
          <NewCategoryForm />
        </Card>
        {allCategories.length > 0 ? (
          <Card>
            <p className="mb-4 font-display text-base text-champagne">Nouveau produit</p>
            <NewItemForm categories={allCategories} />
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
