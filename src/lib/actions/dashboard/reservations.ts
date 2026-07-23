"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";

const RESERVATION_STATUSES = [
  "en_attente",
  "confirmee",
  "arrivee",
  "installee",
  "terminee",
  "annulee",
  "absence",
] as const;

export async function updateReservationStatus(id: string, status: string) {
  if (!RESERVATION_STATUSES.includes(status as (typeof RESERVATION_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }

  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("reservations")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("reservations").update({ status }).eq("id", id);

  await supabase.from("activity_logs").insert({
    actor_id: employee.id,
    action: "reservation.status_update",
    entity_type: "reservation",
    entity_id: id,
    old_values: previous ? { status: previous.status } : null,
    new_values: { status },
  });

  revalidatePath("/dashboard/reservations");
  revalidatePath("/dashboard");
}

export async function assignReservationTable(id: string, tableId: string | null) {
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");

  const supabase = createAdminClient();
  await supabase
    .from("reservations")
    .update({ table_id: tableId })
    .eq("id", id);

  revalidatePath("/dashboard/reservations");
  revalidatePath("/dashboard/salle");
}
