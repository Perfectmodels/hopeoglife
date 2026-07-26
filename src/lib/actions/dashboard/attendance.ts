"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import { distanceFromRestaurant, MAX_CLOCK_DISTANCE_METERS } from "@/lib/attendance";
import type { ActionResult } from "@/lib/actions/types";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type AttendanceStatus = {
  open: boolean;
  clockIn?: string;
};

export async function getMyAttendanceStatus(): Promise<AttendanceStatus> {
  const employee = await getCurrentEmployee();
  if (!employee) return { open: false };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("attendance")
    .select("clock_in")
    .eq("employee_id", employee.id)
    .eq("status", "ouvert")
    .maybeSingle();

  return data ? { open: true, clockIn: data.clock_in } : { open: false };
}

export async function clockIn(lat: number, lng: number): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const parsed = coordsSchema.safeParse({ lat, lng });
  if (!parsed.success) return { success: false, message: "Position invalide." };

  const distance = distanceFromRestaurant(parsed.data.lat, parsed.data.lng);
  if (distance > MAX_CLOCK_DISTANCE_METERS) {
    return {
      success: false,
      message: `Vous êtes trop loin du restaurant pour pointer (${Math.round(distance)} m).`,
    };
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("employee_id", employee.id)
    .eq("status", "ouvert")
    .maybeSingle();

  if (existing) {
    return { success: false, message: "Vous êtes déjà pointé." };
  }

  const { error } = await supabase.from("attendance").insert({
    employee_id: employee.id,
    clock_in_lat: parsed.data.lat,
    clock_in_lng: parsed.data.lng,
    clock_in_distance_m: distance,
    status: "ouvert",
  });

  if (error) {
    return { success: false, message: "Impossible d'enregistrer le pointage." };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Arrivée pointée." };
}

export async function clockOut(lat: number, lng: number): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const parsed = coordsSchema.safeParse({ lat, lng });
  if (!parsed.success) return { success: false, message: "Position invalide." };

  const distance = distanceFromRestaurant(parsed.data.lat, parsed.data.lng);
  if (distance > MAX_CLOCK_DISTANCE_METERS) {
    return {
      success: false,
      message: `Vous êtes trop loin du restaurant pour pointer (${Math.round(distance)} m).`,
    };
  }

  const supabase = createAdminClient();
  const { data: open } = await supabase
    .from("attendance")
    .select("id")
    .eq("employee_id", employee.id)
    .eq("status", "ouvert")
    .maybeSingle();

  if (!open) {
    return { success: false, message: "Aucun pointage en cours." };
  }

  const { error } = await supabase
    .from("attendance")
    .update({
      clock_out: new Date().toISOString(),
      clock_out_lat: parsed.data.lat,
      clock_out_lng: parsed.data.lng,
      clock_out_distance_m: distance,
      status: "ferme",
    })
    .eq("id", open.id);

  if (error) {
    return { success: false, message: "Impossible d'enregistrer le départ." };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Départ pointé." };
}
