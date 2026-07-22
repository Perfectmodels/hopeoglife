"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

const ROLES = ["admin", "manager", "caissier", "serveur", "cuisine", "bar", "stock"] as const;

const profileSchema = z.object({
  userId: z.string().uuid("UID Supabase invalide (format UUID attendu)"),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
  role: z.enum(ROLES),
  hiredAt: z.string().optional(),
});

export async function createEmployeeProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    return { success: false, message: "Non autorisé." };
  }

  const parsed = profileSchema.safeParse({
    userId: formData.get("userId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    role: formData.get("role"),
    hiredAt: formData.get("hiredAt"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("employees").insert({
    id: parsed.data.userId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    role: parsed.data.role,
    hired_at: parsed.data.hiredAt || null,
  });

  if (error) {
    return {
      success: false,
      message:
        "Impossible de créer le profil. Vérifiez que ce compte a bien été créé au préalable dans Supabase Authentication et que l'UID est correct.",
    };
  }

  revalidatePath("/dashboard/personnel");
  return { success: true, message: "Profil du membre du personnel créé." };
}

export async function updateEmployeeRole(id: string, role: string) {
  if (!ROLES.includes(role as (typeof ROLES)[number])) throw new Error("Rôle invalide");
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    throw new Error("Non autorisé");
  }

  const supabase = await createClient();
  await supabase.from("employees").update({ role }).eq("id", id);
  revalidatePath("/dashboard/personnel");
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    throw new Error("Non autorisé");
  }

  const supabase = await createClient();
  await supabase.from("employees").update({ active }).eq("id", id);
  revalidatePath("/dashboard/personnel");
}
