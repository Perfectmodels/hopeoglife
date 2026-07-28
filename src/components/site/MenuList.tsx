import Image from "next/image";
import { formatXAF } from "@/lib/utils";
import { BrandedVisual } from "./BrandedVisual";
import type { DemoMenuCategory } from "@/lib/demo-data";

export function MenuList({ categories }: { categories: DemoMenuCategory[] }) {
  return (
    <div className="space-y-16">
      {categories.map((category) => (
        <div key={category.id} id={category.id}>
          <h3 className="font-display text-2xl text-gold-soft">{category.name}</h3>
          <div className="divider-gold mt-4 h-px w-16" />
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {category.items.map((item) => (
              <div key={item.id} className="flex min-w-0 items-start gap-3 sm:gap-4">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <BrandedVisual className="h-16 w-16 shrink-0" watermarkSize={28} />
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base text-champagne">{item.name}</p>
                      {item.isDailySpecial ? (
                        <span className="rounded-full border border-gold/50 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                          Suggestion
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                    {item.allergens && item.allergens.length > 0 ? (
                      <p className="mt-1 text-xs text-muted/70">
                        Allergènes : {item.allergens.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-medium text-gold">
                    {formatXAF(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
