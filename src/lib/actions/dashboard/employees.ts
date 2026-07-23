"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import { hashPin, verifyPin } from "@/lib/auth/pin";
import type { ActionResult } from "@/lib/actions/types";

const ROLES = ["admin", "manager", "caissier", "serveur", "cuisine", "bar", "stock"] as const;
const pinSchema = z.string().trim().regex(/^\d{4,6}$/, "Le code PIN doit contenir 4 à 6 chiffres");

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.union([z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"), z.literal("")]).optional(),
  role: z.enum(ROLES),
  hiredAt: z.string().optional(),
  pin: pinSchema,
});

function generateRandomPassword() {
  return randomBytes(24).toString("base64url");
}

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
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const adminClient = createAdminClient();
  const hasOfficeAccess = Boolean(data.password);
  const password = data.password || generateRandomPassword();

  const { data: created, error: createUserError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password,
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

  const { error: profileError } = await adminClient.from("employees").insert({
    id: created.user.id,
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone || null,
    email: data.email,
    role: data.role,
    hired_at: data.hiredAt || null,
    pin_hash: hashPin(data.pin),
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    return {
      success: false,
      message:
        profileError.code === "23505"
          ? "Ce code PIN est déjà utilisé par un autre employé."
          : "Impossible de créer le profil du membre du personnel.",
    };
  }

  revalidatePath("/dashboard/personnel");
  return {
    success: true,
    message: hasOfficeAccess
      ? `Compte créé pour ${data.firstName} ${data.lastName}. Connexion au quotidien par PIN, accès e-mail/mot de passe disponible pour le back-office.`
      : `Compte créé pour ${data.firstName} ${data.lastName}. Connexion par code PIN uniquement.`,
  };
}

export async function updateEmployeeRole(id: string, role: string) {
  if (!ROLES.includes(role as (typeof ROLES)[number])) throw new Error("Rôle invalide");
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    throw new Error("Non autorisé");
  }

  const supabase = createAdminClient();
  await supabase.from("employees").update({ role }).eq("id", id);
  revalidatePath("/dashboard/personnel");
}

export async function toggleEmployeeActive(id: string, active: boolean) {
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    throw new Error("Non autorisé");
  }

  const supabase = createAdminClient();
  await supabase.from("employees").update({ active }).eq("id", id);
  revalidatePath("/dashboard/personnel");
}

export async function setEmployeePin(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee || (employee.role !== "admin" && employee.role !== "manager")) {
    return { success: false, message: "Non autorisé." };
  }

  const id = String(formData.get("employeeId") ?? "");
  const parsed = pinSchema.safeParse(formData.get("pin"));

  if (!id || !parsed.success) {
    return { success: false, message: parsed.error?.issues[0]?.message ?? "Code PIN invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("employees")
    .update({ pin_hash: hashPin(parsed.data) })
    .eq("id", id);

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "Ce code PIN est déjà utilisé par un autre employé."
          : "Impossible d'enregistrer le code PIN.",
    };
  }

  revalidatePath("/dashboard/personnel");
  return { success: true, message: "Code PIN enregistré." };
}

export async function setMyPin(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const parsed = pinSchema.safeParse(formData.get("pin"));
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Code PIN invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("employees")
    .update({ pin_hash: hashPin(parsed.data) })
    .eq("id", employee.id);

  if (error) {
    return {
      success: false,
      message:
        error.code === "23505"
          ? "Ce code PIN est déjà utilisé par un autre employé."
          : "Impossible d'enregistrer le code PIN.",
    };
  }

  revalidatePath("/dashboard/compte");
  return { success: true, message: "Code PIN mis à jour." };
}

export type PinIdentifyResult =
  | { success: true; employee: { id: string; firstName: string; lastName: string } }
  | { success: false; message: string };

export async function identifyByPin(pin: string): Promise<PinIdentifyResult> {
  const requester = await getCurrentEmployee();
  if (!requester) return { success: false, message: "Non autorisé." };

  if (!/^\d{4,6}$/.test(pin)) {
    return { success: false, message: "Code PIN invalide." };
  }

  const supabase = createAdminClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, pin_hash")
    .eq("active", true)
    .not("pin_hash", "is", null);

  const match = (employees ?? []).find((e) => e.pin_hash && verifyPin(pin, e.pin_hash));

  if (!match) {
    return { success: false, message: "Code PIN non reconnu." };
  }

  return {
    success: true,
    employee: { id: match.id, firstName: match.first_name, lastName: match.last_name },
  };
}
