"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  unit: z.string().trim().min(1, "L'unité est requise"),
  category: z.string().trim().optional(),
  quantityOnHand: z.coerce.number().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().nonnegative().default(0),
});

export async function createStockItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    category: formData.get("category"),
    quantityOnHand: formData.get("quantityOnHand"),
    lowStockThreshold: formData.get("lowStockThreshold"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("stock_items").insert({
    name: parsed.data.name,
    unit: parsed.data.unit,
    category: parsed.data.category || null,
    quantity_on_hand: parsed.data.quantityOnHand,
    low_stock_threshold: parsed.data.lowStockThreshold,
  });

  if (error) return { success: false, message: "Impossible de créer le produit de stock." };

  revalidatePath("/dashboard/stock");
  return { success: true, message: "Produit de stock ajouté." };
}

const movementSchema = z.object({
  stockItemId: z.string().min(1),
  type: z.enum(["entree", "sortie", "perte", "ajustement", "inventaire"]),
  quantity: z.coerce.number(),
  reason: z.string().trim().optional(),
});

export async function recordStockMovement(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const parsed = movementSchema.safeParse({
    stockItemId: formData.get("stockItemId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Mouvement invalide." };
  }

  const { stockItemId, type, quantity, reason } = parsed.data;
  const supabase = createAdminClient();

  const { data: item } = await supabase
    .from("stock_items")
    .select("quantity_on_hand")
    .eq("id", stockItemId)
    .maybeSingle();

  if (!item) return { success: false, message: "Produit introuvable." };

  const current = Number(item.quantity_on_hand);
  let delta = 0;
  let storedQuantity = quantity;

  if (type === "entree") delta = Math.abs(quantity);
  else if (type === "sortie" || type === "perte") delta = -Math.abs(quantity);
  else if (type === "ajustement") delta = quantity;
  else if (type === "inventaire") {
    delta = quantity - current;
    storedQuantity = delta;
  }

  const newQuantity = Math.max(0, current + delta);

  const { error: moveError } = await supabase.from("stock_movements").insert({
    stock_item_id: stockItemId,
    type,
    quantity: storedQuantity,
    reason: reason || null,
    created_by: employee.id,
  });

  if (moveError) return { success: false, message: "Impossible d'enregistrer le mouvement." };

  await supabase.from("stock_items").update({ quantity_on_hand: newQuantity }).eq("id", stockItemId);

  revalidatePath("/dashboard/stock");
  return { success: true, message: "Mouvement de stock enregistré." };
}
