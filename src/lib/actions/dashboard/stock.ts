"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canAdministerStock, canManageBarStock } from "@/lib/auth/permissions";
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
  if (!employee || !canManageBarStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

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
    .select("quantity_on_hand, destination")
    .eq("id", stockItemId)
    .maybeSingle();

  if (!item) return { success: false, message: "Produit introuvable." };

  // Le rôle bar n'agit que sur son propre stock : l'identifiant vient d'un
  // formulaire, on ne peut donc pas se fier au filtrage fait côté page.
  if (employee.role === "bar" && item.destination !== "bar") {
    return { success: false, message: "Ce produit ne fait pas partie du stock du bar." };
  }

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
  revalidatePath("/dashboard/bar/stock");
  return { success: true, message: "Mouvement de stock enregistré." };
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

type BarMenuItemCheck =
  | { ok: false; message: string }
  | { ok: true; name: string };

/**
 * Confirme qu'un produit du menu relève bien du bar. `menu_items.destination`
 * fait autorité quand il est renseigné, sinon on retombe sur le type de la
 * catégorie — même résolution que la prise de commande (`createStaffOrder`).
 */
async function loadUnlinkedBarMenuItem(
  supabase: SupabaseClient,
  menuItemId: string
): Promise<BarMenuItemCheck> {
  const { data: menuItem } = await supabase
    .from("menu_items")
    .select("id, name, destination, stock_item_id, menu_categories ( kind )")
    .eq("id", menuItemId)
    .maybeSingle();

  if (!menuItem) return { ok: false, message: "Produit du menu introuvable." };
  if (menuItem.stock_item_id) {
    return { ok: false, message: "Ce produit est déjà relié à une fiche de stock." };
  }

  const category = Array.isArray(menuItem.menu_categories)
    ? menuItem.menu_categories[0]
    : menuItem.menu_categories;
  const isBar =
    menuItem.destination === "bar" ||
    (menuItem.destination !== "cuisine" && category?.kind === "bar");

  if (!isBar) return { ok: false, message: "Ce produit n'est pas un produit du bar." };

  return { ok: true, name: menuItem.name };
}

const stockForMenuItemSchema = z.object({
  menuItemId: z.string().min(1),
  unit: z.string().trim().min(1, "L'unité est requise"),
  category: z.string().trim().optional(),
  quantityOnHand: z.coerce.number().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().nonnegative().default(0),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
});

export async function createStockItemForMenuItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canAdministerStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = stockForMenuItemSchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    unit: formData.get("unit"),
    category: formData.get("category"),
    quantityOnHand: formData.get("quantityOnHand"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    purchasePrice: formData.get("purchasePrice") || undefined,
    salePrice: formData.get("salePrice") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  const check = await loadUnlinkedBarMenuItem(supabase, data.menuItemId);
  if (!check.ok) return { success: false, message: check.message };

  const { data: item, error: itemError } = await supabase
    .from("stock_items")
    .insert({
      name: check.name,
      unit: data.unit,
      category: data.category || null,
      quantity_on_hand: data.quantityOnHand,
      low_stock_threshold: data.lowStockThreshold,
      purchase_price: data.purchasePrice ?? null,
      sale_price: data.salePrice ?? null,
      destination: "bar",
    })
    .select("id")
    .single();

  if (itemError || !item) {
    return { success: false, message: "Impossible de créer la fiche de stock." };
  }

  const { error: linkError } = await supabase
    .from("menu_items")
    .update({ stock_item_id: item.id })
    .eq("id", data.menuItemId);

  if (linkError) {
    await supabase.from("stock_items").delete().eq("id", item.id);
    return { success: false, message: "Impossible de relier la fiche au produit du menu." };
  }

  revalidatePath("/dashboard/bar/stock");
  revalidatePath("/dashboard/stock");
  return { success: true, message: `Fiche de stock créée pour ${check.name}.` };
}

const linkStockSchema = z.object({
  menuItemId: z.string().min(1),
  stockItemId: z.string().min(1, "Sélectionnez une fiche de stock"),
});

export async function linkExistingStockItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canAdministerStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = linkStockSchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    stockItemId: formData.get("stockItemId"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { menuItemId, stockItemId } = parsed.data;
  const supabase = createAdminClient();

  const check = await loadUnlinkedBarMenuItem(supabase, menuItemId);
  if (!check.ok) return { success: false, message: check.message };

  const { data: stockItem } = await supabase
    .from("stock_items")
    .select("id, name, destination")
    .eq("id", stockItemId)
    .maybeSingle();

  if (!stockItem) return { success: false, message: "Fiche de stock introuvable." };
  if (stockItem.destination !== "bar") {
    return { success: false, message: "Cette fiche de stock n'appartient pas au bar." };
  }

  const { error } = await supabase
    .from("menu_items")
    .update({ stock_item_id: stockItemId })
    .eq("id", menuItemId);

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "Cette fiche de stock est déjà reliée à un autre produit."
          : "Impossible de relier cette fiche de stock.",
    };
  }

  revalidatePath("/dashboard/bar/stock");
  revalidatePath("/dashboard/stock");
  return { success: true, message: `${check.name} relié à ${stockItem.name}.` };
}
