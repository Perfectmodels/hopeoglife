"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canManageStock, canAdministerStock } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/actions/types";

function generateReceiptNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REC-${stamp}-${random}`;
}

const receiptLineSchema = z.object({
  stockItemId: z.string().min(1),
  barcodeId: z.string().min(1).optional(),
  quantityScanned: z.number().nonnegative().default(0),
  quantityReceived: z.number().positive("La quantité reçue doit être supérieure à 0"),
  unitCost: z.number().nonnegative().optional(),
  batchNumber: z.string().trim().optional(),
  manufacturingDate: z.string().trim().optional(),
  expirationDate: z.string().trim().optional(),
  stockLocationId: z.string().min(1).optional(),
  condition: z.enum(["bon", "abime", "perime"]).optional(),
  comment: z.string().trim().optional(),
});

const saveReceiptSchema = z.object({
  receiptId: z.string().min(1).optional(),
  supplierId: z.string().min(1).optional(),
  invoiceNumber: z.string().trim().optional(),
  stockLocationId: z.string().min(1).optional(),
  notes: z.string().trim().optional(),
  intent: z.enum(["draft", "validate"]),
  lines: z.array(receiptLineSchema).min(1, "Ajoutez au moins un produit avant d'enregistrer."),
});

export type SaveStockReceiptResult = ActionResult & { receiptId?: string };

export async function saveStockReceipt(
  _prev: SaveStockReceiptResult | null,
  formData: FormData
): Promise<SaveStockReceiptResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canManageStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  let linesRaw: unknown;
  try {
    linesRaw = JSON.parse(String(formData.get("lines") ?? "[]"));
  } catch {
    return { success: false, message: "Lignes de réception invalides." };
  }

  const parsed = saveReceiptSchema.safeParse({
    receiptId: formData.get("receiptId") || undefined,
    supplierId: formData.get("supplierId") || undefined,
    invoiceNumber: formData.get("invoiceNumber"),
    stockLocationId: formData.get("stockLocationId") || undefined,
    notes: formData.get("notes"),
    intent: formData.get("intent") || "draft",
    lines: linesRaw,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();
  let receiptId = data.receiptId;

  if (receiptId) {
    const { data: existing } = await supabase
      .from("stock_receipts")
      .select("status")
      .eq("id", receiptId)
      .maybeSingle();

    if (!existing) return { success: false, message: "Réception introuvable." };
    if (existing.status !== "brouillon") {
      return { success: false, message: "Cette réception a déjà été validée ou annulée." };
    }

    const { error: updateError } = await supabase
      .from("stock_receipts")
      .update({
        supplier_id: data.supplierId || null,
        invoice_number: data.invoiceNumber || null,
        stock_location_id: data.stockLocationId || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", receiptId);

    if (updateError) return { success: false, message: "Impossible de mettre à jour la réception." };

    await supabase.from("stock_receipt_items").delete().eq("receipt_id", receiptId);
  } else {
    const { data: created, error: createError } = await supabase
      .from("stock_receipts")
      .insert({
        receipt_number: generateReceiptNumber(),
        supplier_id: data.supplierId || null,
        invoice_number: data.invoiceNumber || null,
        stock_location_id: data.stockLocationId || null,
        notes: data.notes || null,
        created_by: employee.id,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return { success: false, message: "Impossible de créer la réception." };
    }
    receiptId = created.id;
  }

  const { error: itemsError } = await supabase.from("stock_receipt_items").insert(
    data.lines.map((line) => ({
      receipt_id: receiptId,
      stock_item_id: line.stockItemId,
      barcode_id: line.barcodeId || null,
      quantity_scanned: line.quantityScanned,
      quantity_received: line.quantityReceived,
      unit_cost: line.unitCost ?? null,
      batch_number: line.batchNumber || null,
      manufacturing_date: line.manufacturingDate || null,
      expiration_date: line.expirationDate || null,
      stock_location_id: line.stockLocationId || data.stockLocationId || null,
      condition: line.condition || null,
      comment: line.comment || null,
    }))
  );

  if (itemsError) {
    return { success: false, message: "Impossible d'enregistrer les produits de la réception." };
  }

  if (data.intent === "validate") {
    const { error: rpcError } = await supabase.rpc("validate_stock_receipt", {
      p_receipt_id: receiptId,
      p_employee_id: employee.id,
    });

    if (rpcError) {
      return {
        success: false,
        receiptId,
        message: "Le brouillon a été enregistré, mais la validation a échoué : " + rpcError.message,
      };
    }

    revalidatePath("/dashboard/stock");
    revalidatePath("/dashboard/stock/receptions");
    return { success: true, receiptId, message: "Réception validée, le stock a été mis à jour." };
  }

  revalidatePath("/dashboard/stock/receptions");
  return { success: true, receiptId, message: "Brouillon enregistré." };
}

export type ScanReceiptResult =
  | {
      status: "existing";
      stockItemId: string;
      name: string;
      unit: string;
      barcodeId: string;
      packaging: { name: string; unitsPerPackage: number } | null;
    }
  | { status: "similar"; code: string; suggestedName: string | null; suggestedImageUrl: string | null; candidates: { id: string; name: string; unit: string }[] }
  | { status: "external"; code: string; name: string; imageUrl: string | null; brand: string | null }
  | { status: "not_found"; code: string };

export async function scanReceiptBarcode(code: string): Promise<ScanReceiptResult> {
  const employee = await getCurrentEmployee();
  const trimmed = code.trim();
  if (!employee || !trimmed) return { status: "not_found", code: trimmed };

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("product_barcodes")
    .select("id, stock_item_id, stock_items(name, unit), product_packagings(name, units_per_package)")
    .eq("barcode", trimmed)
    .maybeSingle();

  if (existing) {
    const item = existing.stock_items as unknown as { name: string; unit: string } | null;
    const packaging = existing.product_packagings as unknown as
      | { name: string; units_per_package: number }
      | null;

    if (item) {
      return {
        status: "existing",
        stockItemId: existing.stock_item_id,
        name: item.name,
        unit: item.unit,
        barcodeId: existing.id,
        packaging: packaging ? { name: packaging.name, unitsPerPackage: Number(packaging.units_per_package) } : null,
      };
    }
  }

  let offName: string | null = null;
  let offImage: string | null = null;
  let offBrand: string | null = null;

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`,
      { headers: { "User-Agent": "HopeOfLifeStock/1.0 (contact@hopeoflife-gabon.com)" } }
    );
    if (res.ok) {
      const data = await res.json();
      const product = data?.product;
      const name: string | undefined = product?.product_name || product?.generic_name;
      if (data?.status === 1 && product && name) {
        offName = name;
        offImage = product.image_front_url || product.image_url || null;
        offBrand = product.brands || null;
      }
    }
  } catch {
    // Open Food Facts indisponible — la création manuelle reste possible.
  }

  if (offName) {
    const firstWord = offName.trim().split(/\s+/)[0];
    const { data: candidates } = await supabase
      .from("stock_items")
      .select("id, name, unit")
      .ilike("name", `%${firstWord}%`)
      .limit(5);

    if (candidates && candidates.length > 0) {
      return {
        status: "similar",
        code: trimmed,
        suggestedName: offName,
        suggestedImageUrl: offImage,
        candidates,
      };
    }

    return { status: "external", code: trimmed, name: offName, imageUrl: offImage, brand: offBrand };
  }

  return { status: "not_found", code: trimmed };
}

export async function associateBarcodeToProduct(
  stockItemId: string,
  barcode: string
): Promise<ActionResult & { barcodeId?: string }> {
  const employee = await getCurrentEmployee();
  if (!employee || !canManageStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_barcodes")
    .insert({ stock_item_id: stockItemId, barcode: barcode.trim() })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      message:
        error?.code === "23505"
          ? "Ce code-barres est déjà associé à un autre produit."
          : "Impossible d'associer ce code-barres.",
    };
  }

  return { success: true, message: "Code-barres associé.", barcodeId: data.id };
}

const enrichedItemSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  unit: z.string().trim().min(1, "L'unité est requise"),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  contentSize: z.string().trim().optional(),
  quantityOnHand: z.coerce.number().nonnegative().default(0),
  lowStockThreshold: z.coerce.number().nonnegative().default(0),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  destination: z.enum(["bar", "cuisine", "reserve"]).optional(),
  isSellable: z.coerce.boolean().default(true),
  expirationTracked: z.coerce.boolean().default(false),
  imageUrl: z.string().trim().optional(),
  barcode: z.string().trim().min(1, "Le code-barres est requis"),
  packagingName: z.string().trim().optional(),
  unitsPerPackage: z.coerce.number().positive().optional(),
});

export type CreateEnrichedItemResult = ActionResult & { stockItemId?: string; barcodeId?: string };

export async function createEnrichedStockItem(
  _prev: CreateEnrichedItemResult | null,
  formData: FormData
): Promise<CreateEnrichedItemResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canManageStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = enrichedItemSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    brand: formData.get("brand"),
    contentSize: formData.get("contentSize"),
    quantityOnHand: formData.get("quantityOnHand"),
    lowStockThreshold: formData.get("lowStockThreshold"),
    purchasePrice: formData.get("purchasePrice") || undefined,
    salePrice: formData.get("salePrice") || undefined,
    destination: formData.get("destination") || undefined,
    isSellable: formData.get("isSellable") === "on",
    expirationTracked: formData.get("expirationTracked") === "on",
    imageUrl: formData.get("imageUrl"),
    barcode: formData.get("barcode"),
    packagingName: formData.get("packagingName") || undefined,
    unitsPerPackage: formData.get("unitsPerPackage") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: item, error: itemError } = await supabase
    .from("stock_items")
    .insert({
      name: data.name,
      unit: data.unit,
      category: data.category || null,
      subcategory: data.subcategory || null,
      brand: data.brand || null,
      content_size: data.contentSize || null,
      quantity_on_hand: data.quantityOnHand,
      low_stock_threshold: data.lowStockThreshold,
      purchase_price: data.purchasePrice ?? null,
      sale_price: data.salePrice ?? null,
      destination: data.destination || null,
      is_sellable: data.isSellable,
      expiration_tracked: data.expirationTracked,
      image_url: data.imageUrl || null,
    })
    .select("id")
    .single();

  if (itemError || !item) {
    return { success: false, message: "Impossible de créer le produit." };
  }

  let packagingId: string | null = null;
  if (data.packagingName && data.unitsPerPackage) {
    const { data: packaging } = await supabase
      .from("product_packagings")
      .insert({
        stock_item_id: item.id,
        name: data.packagingName,
        units_per_package: data.unitsPerPackage,
      })
      .select("id")
      .single();
    packagingId = packaging?.id ?? null;
  }

  const { data: barcodeRow, error: barcodeError } = await supabase
    .from("product_barcodes")
    .insert({
      stock_item_id: item.id,
      barcode: data.barcode,
      is_primary: true,
      packaging_id: packagingId,
    })
    .select("id")
    .single();

  if (barcodeError) {
    await supabase.from("stock_items").delete().eq("id", item.id);
    return {
      success: false,
      message:
        barcodeError.code === "23505"
          ? "Ce code-barres est déjà associé à un autre produit."
          : "Impossible de créer le produit.",
    };
  }

  revalidatePath("/dashboard/stock");
  return { success: true, message: "Produit créé.", stockItemId: item.id, barcodeId: barcodeRow.id };
}

export async function validateStockReceipt(receiptId: string): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canManageStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("validate_stock_receipt", {
    p_receipt_id: receiptId,
    p_employee_id: employee.id,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/stock/receptions");
  return { success: true, message: "Réception validée, le stock a été mis à jour." };
}

const correctionSchema = z.object({
  receiptItemId: z.string().min(1),
  newQuantity: z.coerce.number().nonnegative(),
  reason: z.string().trim().min(1, "Le motif est requis"),
});

export async function correctStockReceiptItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canAdministerStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = correctionSchema.safeParse({
    receiptItemId: formData.get("receiptItemId"),
    newQuantity: formData.get("newQuantity"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Correction invalide." };
  }

  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from("stock_receipt_items")
    .select("id, stock_item_id, quantity_received, stock_location_id")
    .eq("id", parsed.data.receiptItemId)
    .maybeSingle();

  if (!item) return { success: false, message: "Ligne de réception introuvable." };

  const { data: originalMovement } = await supabase
    .from("stock_movements")
    .select("id")
    .eq("receipt_item_id", item.id)
    .eq("type", "entree")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: stockItem } = await supabase
    .from("stock_items")
    .select("quantity_on_hand")
    .eq("id", item.stock_item_id)
    .maybeSingle();

  if (!stockItem) return { success: false, message: "Produit introuvable." };

  const delta = parsed.data.newQuantity - Number(item.quantity_received);
  const current = Number(stockItem.quantity_on_hand);
  const updated = Math.max(0, current + delta);

  const { error: moveError } = await supabase.from("stock_movements").insert({
    stock_item_id: item.stock_item_id,
    type: "ajustement",
    quantity: delta,
    reason: parsed.data.reason,
    created_by: employee.id,
    stock_location_id: item.stock_location_id,
    receipt_item_id: item.id,
    quantity_before: current,
    quantity_after: updated,
    reversed_from_id: originalMovement?.id ?? null,
  });

  if (moveError) return { success: false, message: "Impossible d'enregistrer la correction." };

  await supabase.from("stock_items").update({ quantity_on_hand: updated }).eq("id", item.stock_item_id);
  await supabase
    .from("stock_receipt_items")
    .update({ quantity_received: parsed.data.newQuantity })
    .eq("id", item.id);

  revalidatePath("/dashboard/stock");
  revalidatePath("/dashboard/stock/mouvements");
  return { success: true, message: "Correction enregistrée." };
}
