"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

async function requireStaff() {
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");
  return employee;
}

const MAX_IMAGE_SIZE_MB = 5;

export async function uploadMenuImage(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  await requireStaff();

  const file = formData.get("file");
  const pathPrefix = String(formData.get("pathPrefix") ?? "menu");

  if (!(file instanceof File)) {
    return { success: false, message: "Aucun fichier reçu." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, message: "Le fichier doit être une image." };
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return { success: false, message: `L'image doit faire moins de ${MAX_IMAGE_SIZE_MB} Mo.` };
  }

  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pathPrefix}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("menu-images")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) {
    return { success: false, message: "Échec de l'envoi. Réessayez." };
  }

  const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  kind: z.enum(["restaurant", "bar"]),
});

export async function createCategory(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireStaff();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_categories").insert(parsed.data);
  if (error) return { success: false, message: "Impossible de créer la catégorie." };

  revalidatePath("/dashboard/menu");
  return { success: true, message: "Catégorie créée." };
}

export async function deleteCategory(id: string) {
  await requireStaff();
  const supabase = createAdminClient();
  await supabase.from("menu_categories").delete().eq("id", id);
  revalidatePath("/dashboard/menu");
}

const itemSchema = z.object({
  categoryId: z.string().min(1, "Catégorie requise"),
  name: z.string().trim().min(1, "Le nom est requis"),
  description: z.string().trim().optional(),
  price: z.coerce.number().nonnegative(),
  imageUrl: z.string().trim().optional(),
  isDailySpecial: z.coerce.boolean().optional(),
});

export async function createMenuItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await requireStaff();
  const parsed = itemSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl"),
    isDailySpecial: formData.get("isDailySpecial") === "on",
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_items").insert({
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price,
    image_url: parsed.data.imageUrl || null,
    is_daily_special: parsed.data.isDailySpecial ?? false,
  });
  if (error) return { success: false, message: "Impossible de créer le produit." };

  revalidatePath("/dashboard/menu");
  return { success: true, message: "Produit ajouté." };
}

export async function updateMenuItemPrice(id: string, price: number) {
  await requireStaff();
  const supabase = createAdminClient();
  await supabase.from("menu_items").update({ price }).eq("id", id);
  revalidatePath("/dashboard/menu");
}

export async function updateMenuItemImage(id: string, imageUrl: string) {
  await requireStaff();
  const supabase = createAdminClient();
  await supabase.from("menu_items").update({ image_url: imageUrl }).eq("id", id);
  revalidatePath("/dashboard/menu");
  revalidatePath("/menu");
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean) {
  await requireStaff();
  const supabase = createAdminClient();
  await supabase.from("menu_items").update({ is_available: isAvailable }).eq("id", id);
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(id: string) {
  await requireStaff();
  const supabase = createAdminClient();
  await supabase.from("menu_items").delete().eq("id", id);
  revalidatePath("/dashboard/menu");
}
