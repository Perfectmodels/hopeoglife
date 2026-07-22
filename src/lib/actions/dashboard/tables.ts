"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/session";

const TABLE_STATUSES = [
  "libre",
  "reservee",
  "occupee",
  "commande_en_cours",
  "commande_prete",
  "paiement_demande",
  "a_nettoyer",
  "indisponible",
] as const;

export async function updateTableStatus(id: string, status: string) {
  if (!TABLE_STATUSES.includes(status as (typeof TABLE_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }

  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");

  const supabase = await createClient();
  await supabase.from("dining_tables").update({ status }).eq("id", id);

  revalidatePath("/dashboard/salle");
  revalidatePath("/dashboard");
}
