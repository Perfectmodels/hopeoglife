"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

export async function getOpenCashSession() {
  const employee = await getCurrentEmployee();
  if (!employee) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_amount, cashier_id")
    .eq("cashier_id", employee.id)
    .eq("status", "ouverte")
    .maybeSingle();

  return data;
}

export async function openCashSession(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const openingAmount = Number(formData.get("openingAmount") ?? 0);
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("cashier_id", employee.id)
    .eq("status", "ouverte")
    .maybeSingle();

  if (existing) {
    return { success: false, message: "Une session de caisse est déjà ouverte." };
  }

  const { error } = await supabase.from("cash_sessions").insert({
    cashier_id: employee.id,
    opening_amount: openingAmount,
    status: "ouverte",
  });

  if (error) {
    return { success: false, message: "Impossible d'ouvrir la session de caisse." };
  }

  revalidatePath("/dashboard/caisse");
  return { success: true, message: "Session de caisse ouverte." };
}

export async function closeCashSession(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const sessionId = String(formData.get("sessionId") ?? "");
  const closingAmount = Number(formData.get("closingAmount") ?? 0);
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, opening_amount")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { success: false, message: "Session introuvable." };

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("type, amount")
    .eq("cash_session_id", sessionId);

  const net = (movements ?? []).reduce((sum, m) => {
    if (m.type === "entree" || m.type === "vente") return sum + Number(m.amount);
    if (m.type === "sortie") return sum - Number(m.amount);
    return sum + Number(m.amount);
  }, 0);

  const expectedAmount = Number(session.opening_amount) + net;
  const variance = closingAmount - expectedAmount;

  const { error } = await supabase
    .from("cash_sessions")
    .update({
      closed_at: new Date().toISOString(),
      closing_amount: closingAmount,
      expected_amount: expectedAmount,
      variance,
      status: "cloturee",
    })
    .eq("id", sessionId);

  if (error) {
    return { success: false, message: "Impossible de clôturer la session." };
  }

  revalidatePath("/dashboard/caisse");
  return {
    success: true,
    message: `Session clôturée. Écart : ${variance >= 0 ? "+" : ""}${variance.toLocaleString("fr-FR")} XAF.`,
  };
}

export async function addCashMovement(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const sessionId = String(formData.get("sessionId") ?? "");
  const type = String(formData.get("type") ?? "entree");
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "");

  if (!["entree", "sortie", "ajustement"].includes(type) || amount <= 0) {
    return { success: false, message: "Mouvement invalide." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("cash_movements").insert({
    cash_session_id: sessionId,
    type,
    amount,
    reason: reason || null,
  });

  if (error) {
    return { success: false, message: "Impossible d'enregistrer le mouvement." };
  }

  revalidatePath("/dashboard/caisse");
  return { success: true, message: "Mouvement enregistré." };
}
