"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionResult } from "./types";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MINUTES = 15;

async function getSiteOrigin() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

const signInSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: "Supabase n'est pas encore connecté. Renseignez .env.local pour activer la connexion.",
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data: failedCount } = await supabase.rpc("count_recent_failed_logins", {
    p_email: email,
    p_minutes: LOCKOUT_WINDOW_MINUTES,
  });

  if (typeof failedCount === "number" && failedCount >= MAX_FAILED_ATTEMPTS) {
    return {
      success: false,
      message: `Trop de tentatives échouées. Réessayez dans ${LOCKOUT_WINDOW_MINUTES} minutes ou réinitialisez votre mot de passe.`,
    };
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !authData.user) {
    await supabase.rpc("record_login_attempt", { p_email: email, p_success: false });
    return { success: false, message: "Identifiants incorrects." };
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!employee || !employee.active) {
    await supabase.rpc("record_login_attempt", { p_email: email, p_success: false });
    await supabase.auth.signOut();
    return {
      success: false,
      message: "Ce compte n'est pas autorisé à accéder à l'espace personnel.",
    };
  }

  await supabase.rpc("record_login_attempt", { p_email: email, p_success: true });
  await supabase.from("activity_logs").insert({
    actor_id: employee.id,
    action: "auth.login",
    entity_type: "employee",
    entity_id: employee.id,
  });

  redirect("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("activity_logs").insert({
        actor_id: user.id,
        action: "auth.logout",
        entity_type: "employee",
        entity_id: user.id,
      });
    }

    await supabase.auth.signOut();
  }
  redirect("/connexion");
}

const emailSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide"),
});

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "E-mail invalide." };
  }

  if (!isSupabaseConfigured) {
    return { success: false, message: "Supabase n'est pas encore connecté." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reinitialiser-mot-de-passe`,
  });

  return {
    success: true,
    message:
      "Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d'être envoyé.",
  };
}

const passwordSchema = z
  .object({
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function updatePassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  if (!isSupabaseConfigured) {
    return { success: false, message: "Supabase n'est pas encore connecté." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { success: false, message: "Impossible de mettre à jour le mot de passe." };
  }

  return { success: true, message: "Mot de passe mis à jour avec succès." };
}
