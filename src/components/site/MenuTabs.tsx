"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MenuList } from "./MenuList";
import type { DemoMenuCategory } from "@/lib/demo-data";

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
  const categories = tab === "restaurant" ? restaurant : bar;
  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? categories[0];

  function selectTab(nextTab: "restaurant" | "bar") {
    const nextCategories = nextTab === "restaurant" ? restaurant : bar;
    setTab(nextTab);
    setActiveCategoryId(nextCategories[0]?.id ?? "");
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

      <div
        key={`chips-${tab}`}
        className="site-fade-in -mx-4 mt-8 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
        aria-label="Catégories du menu"
      >
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategoryId(c.id)}
            aria-pressed={activeCategory?.id === c.id}
            className={cn(
              "min-h-11 shrink-0 snap-start rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors",
              activeCategory?.id === c.id
                ? "border-gold bg-gold/10 text-gold"
                : "border-border-subtle text-muted hover:border-gold hover:text-gold"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div key={`${tab}-${activeCategory?.id}`} className="site-fade-in mt-12">
        <MenuList categories={activeCategory ? [activeCategory] : []} />
      </div>
    </div>
  );
}
