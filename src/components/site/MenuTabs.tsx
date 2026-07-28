"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuList } from "./MenuList";
import { inputClasses } from "./FormField";
import type { DemoMenuCategory } from "@/lib/demo-data";

const ITEMS_PER_PAGE = 12;

export function MenuTabs({
  restaurant,
  bar,
  initialTab = "restaurant",
}: {
  restaurant: DemoMenuCategory[];
  bar: DemoMenuCategory[];
  initialTab?: "restaurant" | "bar";
}) {
  const [tab, setTab] = useState<"restaurant" | "bar">(initialTab);
  const [activeCategoryId, setActiveCategoryId] = useState(
    (initialTab === "restaurant" ? restaurant : bar)[0]?.id ?? ""
  );
  const [page, setPage] = useState(1);
  const categories = tab === "restaurant" ? restaurant : bar;
  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  const totalPages = Math.max(
    1,
    Math.ceil((activeCategory?.items.length ?? 0) / ITEMS_PER_PAGE)
  );
  const visibleCategory = activeCategory
    ? {
        ...activeCategory,
        items: activeCategory.items.slice(
          (page - 1) * ITEMS_PER_PAGE,
          page * ITEMS_PER_PAGE
        ),
      }
    : null;

  function selectTab(nextTab: "restaurant" | "bar") {
    const nextCategories = nextTab === "restaurant" ? restaurant : bar;
    setTab(nextTab);
    setActiveCategoryId(nextCategories[0]?.id ?? "");
    setPage(1);
  }

  function selectCategory(id: string) {
    setActiveCategoryId(id);
    setPage(1);
  }

  return (
    <div>
      <div className="flex gap-2">
        {(
          [
            { key: "restaurant", label: "Restaurant" },
            { key: "bar", label: "Bar" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => selectTab(option.key)}
            className={cn(
              "rounded-full border px-5 py-2 text-xs uppercase tracking-widest transition-all duration-200 [transition-timing-function:var(--ease-out-quart)] active:scale-95",
              tab === option.key
                ? "border-gold bg-gold/10 text-gold"
                : "border-border-subtle text-muted hover:border-gold hover:text-gold"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div key={`chips-${tab}`} className="site-fade-in mt-8" aria-label="Catégories du menu">
        <label className="sr-only" htmlFor={`menu-category-${tab}`}>
          Catégorie
        </label>
        <select
          id={`menu-category-${tab}`}
          value={activeCategory?.id}
          onChange={(event) => selectCategory(event.target.value)}
          className={cn(inputClasses, "sm:hidden")}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.items.length})
            </option>
          ))}
        </select>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCategory(c.id)}
              aria-pressed={activeCategory?.id === c.id}
              className={cn(
                "min-h-10 rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                activeCategory?.id === c.id
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border-subtle text-muted hover:border-gold hover:text-gold"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div key={`${tab}-${activeCategory?.id}`} className="site-fade-in mt-12">
        <MenuList categories={visibleCategory ? [visibleCategory] : []} />
        {totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border-subtle px-4 text-xs text-muted hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
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
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border-subtle px-4 text-xs text-muted hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
            >
              Suivant <ChevronRight size={14} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
