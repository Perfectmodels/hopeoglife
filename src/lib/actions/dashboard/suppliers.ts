"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import { canAdministerStock } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/actions/types";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createSupplier(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canAdministerStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").insert({
    name: parsed.data.name,
    contact_name: parsed.data.contactName || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { success: false, message: "Impossible de créer le fournisseur." };
  }

  revalidatePath("/dashboard/fournisseurs");
  return { success: true, message: "Fournisseur ajouté." };
}

export async function updateSupplier(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || !canAdministerStock(employee.role)) {
    return { success: false, message: "Non autorisé." };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { success: false, message: "Fournisseur introuvable." };
  }

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contactName || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: "Impossible de mettre à jour le fournisseur." };
  }

  revalidatePath("/dashboard/fournisseurs");
  return { success: true, message: "Fournisseur mis à jour." };
}
