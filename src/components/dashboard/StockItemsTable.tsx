"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  quantity_on_hand: number;
  low_stock_threshold: number;
  image_url: string | null;
};

const UNCATEGORIZED = "Sans catégorie";

export function StockItemsTable({ items }: { items: StockItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Tous");

  const categories = useMemo(() => {
    const names = new Set(items.map((item) => item.category || UNCATEGORIZED));
    return ["Tous", ...Array.from(names).sort((a, b) => a.localeCompare(b, "fr"))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const category = item.category || UNCATEGORIZED;
      if (activeCategory !== "Tous" && category !== activeCategory) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, activeCategory]);

  const groups = useMemo(() => {
    const map = new Map<string, StockItem[]>();
    for (const item of filtered) {
      const category = item.category || UNCATEGORIZED;
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }, [filtered]);

  if (items.length === 0) {
    return <EmptyState message="Aucun produit de stock enregistré." />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            aria-label="Rechercher un produit"
            className="w-full rounded-lg border border-border-subtle bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-gold"
          />
        </div>
        <p className="text-xs text-muted sm:text-right">
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          {activeCategory !== "Tous" || query ? ` sur ${items.length}` : ""}
        </p>
      </div>

      {categories.length > 2 ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrer par catégorie">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
              className={cn(
                "min-h-9 shrink-0 rounded-full border px-3.5 py-1.5 text-xs uppercase tracking-widest transition-colors",
                activeCategory === category
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border-subtle text-muted hover:border-gold hover:text-gold"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {groups.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groups.map(([category, groupItems]) => (
            <div key={category}>
              {activeCategory === "Tous" ? (
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                  {category} <span className="text-muted/60">({groupItems.length})</span>
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="table-responsive w-full text-left text-sm lg:min-w-[560px]">
                  <thead className="text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th className="py-2 pr-4">Produit</th>
                      <th className="py-2 pr-4">Catégorie</th>
                      <th className="py-2 pr-4">Quantité</th>
                      <th className="py-2 pr-4">Seuil</th>
                      <th className="py-2 pr-4">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {groupItems.map((item) => {
                      const low = Number(item.quantity_on_hand) <= Number(item.low_stock_threshold);
                      return (
                        <tr key={item.id}>
                          <td className="py-3 pr-4" data-label="Produit">
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.name}
                                  width={32}
                                  height={32}
                                  className="h-8 w-8 shrink-0 rounded-md object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-elevated text-muted">
                                  <PackageSearch size={14} />
                                </div>
                              )}
                              <span className="text-champagne">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-muted" data-label="Catégorie">{item.category || "—"}</td>
                          <td className="py-3 pr-4 text-muted" data-label="Quantité">
                            {item.quantity_on_hand} {item.unit}
                          </td>
                          <td className="py-3 pr-4 text-muted" data-label="Seuil">
                            {item.low_stock_threshold} {item.unit}
                          </td>
                          <td className="py-3 pr-4" data-label="État">
                            <StatusBadge
                              label={low ? "Stock faible" : "OK"}
                              tone={low ? "danger" : "success"}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Aucun produit ne correspond à cette recherche.</p>
      )}
    </div>
  );
}
