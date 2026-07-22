"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import {
  updateMenuItemPrice,
  updateMenuItemImage,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "@/lib/actions/dashboard/menu";
import { ImageUploadButton } from "./ImageUploadButton";
import { BrandedVisual } from "@/components/site/BrandedVisual";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_daily_special: boolean;
};

export function MenuItemRow({ item }: { item: Item }) {
  const [price, setPrice] = useState(item.price);
  const [imageUrl, setImageUrl] = useState(item.image_url);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle/60 py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.name}
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <BrandedVisual className="h-12 w-12 shrink-0" watermarkSize={20} />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-champagne">
            {item.name}
            {item.is_daily_special ? (
              <span className="ml-2 rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold">
                Suggestion
              </span>
            ) : null}
          </p>
          {item.description ? (
            <p className="truncate text-xs text-muted">{item.description}</p>
          ) : null}
          <ImageUploadButton
            pathPrefix={`items/${item.id}`}
            label={imageUrl ? "Changer la photo" : "Ajouter une photo"}
            className="mt-1"
            onUploaded={(url) => {
              setImageUrl(url);
              startTransition(() => updateMenuItemImage(item.id, url));
            }}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onBlur={() => {
            if (price !== item.price) {
              startTransition(() => updateMenuItemPrice(item.id, price));
            }
          }}
          className="w-24 rounded-lg border border-border-subtle bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => toggleMenuItemAvailability(item.id, !item.is_available))
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs disabled:opacity-50",
            item.is_available
              ? "border-emerald-500/40 text-emerald-400"
              : "border-red-500/40 text-red-400"
          )}
        >
          {item.is_available ? "Disponible" : "Indisponible"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Supprimer "${item.name}" ?`)) {
              startTransition(() => deleteMenuItem(item.id));
            }
          }}
          aria-label="Supprimer"
          className="text-muted hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
