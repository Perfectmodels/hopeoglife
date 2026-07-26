"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";
import { decodeBarcodeImageBuffer } from "@/lib/barcode/decode-image";

const itemSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  unit: z.string().trim().min(1, "L'unité est requise"),
  category: z.string().trim().optional(),
  quantityOnHand: z.coerce.number().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().nonnegative().default(0),
  barcode: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
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
    barcode: formData.get("barcode"),
    imageUrl: formData.get("imageUrl"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { data: item, error } = await supabase
    .from("stock_items")
    .insert({
      name: parsed.data.name,
      unit: parsed.data.unit,
      category: parsed.data.category || null,
      quantity_on_hand: parsed.data.quantityOnHand,
      low_stock_threshold: parsed.data.lowStockThreshold,
      image_url: parsed.data.imageUrl || null,
    })
    .select("id")
    .single();

  if (error || !item) {
    return { success: false, message: "Impossible de créer le produit de stock." };
  }

  if (parsed.data.barcode) {
    const { error: barcodeError } = await supabase.from("product_barcodes").insert({
      stock_item_id: item.id,
      barcode: parsed.data.barcode,
      is_primary: true,
    });

    if (barcodeError) {
      await supabase.from("stock_items").delete().eq("id", item.id);
      return {
        success: false,
        message:
          barcodeError.code === "23505"
            ? "Ce code-barres est déjà associé à un autre produit."
            : "Impossible de créer le produit de stock.",
      };
    }
  }

  revalidatePath("/dashboard/stock");
  return { success: true, message: "Produit de stock ajouté." };
}

export type BarcodeLookupResult =
  | {
      status: "existing";
      item: {
        id: string;
        name: string;
        unit: string;
        category: string | null;
        quantityOnHand: number;
        imageUrl: string | null;
      };
    }
  | { status: "external"; name: string; imageUrl: string | null; brand: string | null }
  | { status: "not_found" };

export type BarcodeCaptureResult =
  | { success: true; code: string; format: string }
  | { success: false; message: string };

export async function decodeBarcodeCapture(formData: FormData): Promise<BarcodeCaptureResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { success: false, message: "La capture reçue est vide." };
  }
  if (image.size > 5 * 1024 * 1024) {
    return { success: false, message: "La capture est trop volumineuse." };
  }

  try {
    const decoded = await decodeBarcodeImageBuffer(Buffer.from(await image.arrayBuffer()));
    if (!decoded) {
      return {
        success: false,
        message: "Aucun code détecté. Rapprochez le produit, évitez les reflets puis réessayez.",
      };
    }

    return { success: true, code: decoded.text, format: decoded.format };
  } catch {
    return {
      success: false,
      message: "Cette capture n'a pas pu être analysée. Veuillez réessayer.",
    };
  }
}

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { status: "not_found" };

  const code = barcode.trim();
  if (!code) return { status: "not_found" };

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("product_barcodes")
    .select("stock_items(id, name, unit, category, quantity_on_hand, image_url)")
    .eq("barcode", code)
    .maybeSingle();

  const item = existing?.stock_items as
    | { id: string; name: string; unit: string; category: string | null; quantity_on_hand: number; image_url: string | null }
    | null
    | undefined;

  if (item) {
    return {
      status: "existing",
      item: {
        id: item.id,
        name: item.name,
        unit: item.unit,
        category: item.category,
        quantityOnHand: Number(item.quantity_on_hand),
        imageUrl: item.image_url,
      },
    };
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`,
      { headers: { "User-Agent": "HopeOfLifeStock/1.0 (contact@hopeoflife-gabon.com)" } }
    );

    if (res.ok) {
      const data = await res.json();
      const product = data?.product;
      const name: string | undefined = product?.product_name || product?.generic_name;

      if (data?.status === 1 && product && name) {
        return {
          status: "external",
          name,
          imageUrl: product.image_front_url || product.image_url || null,
          brand: product.brands || null,
        };
      }
    }
  } catch {
    // Open Food Facts indisponible — la création manuelle reste possible.
  }

  return { status: "not_found" };
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
    quantity_before: current,
    quantity_after: newQuantity,
  });

  if (moveError) return { success: false, message: "Impossible d'enregistrer le mouvement." };

  await supabase.from("stock_items").update({ quantity_on_hand: newQuantity }).eq("id", stockItemId);

  revalidatePath("/dashboard/stock");
  return { success: true, message: "Mouvement de stock enregistré." };
}
