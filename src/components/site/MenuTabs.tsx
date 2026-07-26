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
  const categories = tab === "restaurant" ? restaurant : bar;

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
            onClick={() => setTab(option.key)}
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

      <div key={`chips-${tab}`} className="site-fade-in mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="rounded-full border border-border-subtle px-4 py-2 text-xs uppercase tracking-widest text-muted transition-colors hover:border-gold hover:text-gold"
          >
            {c.name}
          </a>
        ))}
      </div>

      <div key={`list-${tab}`} className="site-fade-in mt-16">
        <MenuList categories={categories} />
      </div>
    </div>
  );
}
