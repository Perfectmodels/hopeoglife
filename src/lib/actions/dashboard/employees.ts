"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

const ROLES = ["admin", "manager", "caissier", "serveur", "cuisine", "bar", "stock"] as const;

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
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
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    hiredAt: formData.get("hiredAt"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const adminClient = createAdminClient();

  const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { first_name: data.firstName, last_name: data.lastName },
  });

  if (createUserError || !created.user) {
    return {
      success: false,
      message:
        createUserError?.message === "User already registered"
          ? "Un compte existe déjà avec cet e-mail."
          : "Impossible de créer le compte utilisateur.",
    };
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase.from("employees").insert({
    id: created.user.id,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    email: data.email,
    role: data.role,
    hired_at: data.hiredAt || null,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return { success: false, message: "Impossible de créer le profil du membre du personnel." };
  }

  revalidatePath("/dashboard/personnel");
  return { success: true, message: `Compte créé pour ${data.firstName} ${data.lastName}.` };
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
