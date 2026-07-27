"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionResult } from "./types";

const reservationSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().min(6, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
  partySize: z.coerce.number().int().min(1, "Au moins 1 personne").max(50),
  reservationDate: z.string().min(1, "La date est requise"),
  reservationTime: z.string().min(1, "L'heure est requise"),
  occasion: z.string().trim().optional(),
  specialRequests: z.string().trim().optional(),
});

export async function createReservation(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = reservationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    partySize: formData.get("partySize"),
    reservationDate: formData.get("reservationDate"),
    reservationTime: formData.get("reservationTime"),
    occasion: formData.get("occasion"),
    specialRequests: formData.get("specialRequests"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message:
        "Demande enregistrée (mode démo — Supabase non connecté). Elle sera bien transmise une fois la plateforme connectée.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("reservations").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email || null,
      party_size: data.partySize,
      reservation_date: data.reservationDate,
      reservation_time: data.reservationTime,
      occasion: data.occasion || null,
      special_requests: data.specialRequests || null,
      status: "en_attente",
    });

    if (error) {
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement. Merci de réessayer.",
      };
    }

    return {
      success: true,
      message:
        "Votre demande de réservation a bien été envoyée. Notre équipe vous confirmera très prochainement.",
    };
  } catch {
    return {
      success: false,
      message: "Une erreur est survenue. Merci de réessayer ou de nous contacter par téléphone.",
    };
  }
}
