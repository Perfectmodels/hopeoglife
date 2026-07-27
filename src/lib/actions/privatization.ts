"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionResult } from "./types";

const privatizationSchema = z.object({
  occasion: z.enum([
    "anniversaire",
    "mariage",
    "diner_prive",
    "conference",
    "soiree_entreprise",
    "lancement_produit",
    "reception",
    "shooting",
    "ceremonie",
    "autre",
  ]),
  requestedDate: z.string().min(1, "La date est requise"),
  requestedTime: z.string().optional(),
  partySize: z.coerce.number().int().min(1, "Au moins 1 personne").max(1000),
  desiredAreas: z.string().trim().optional(),
  budgetIndicatif: z.string().trim().optional(),
  menuSouhaite: z.string().trim().optional(),
  boissonsSouhaitees: z.string().trim().optional(),
  equipements: z.string().trim().optional(),
  animations: z.string().trim().optional(),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().min(6, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
});

export async function createPrivatizationRequest(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = privatizationSchema.safeParse({
    occasion: formData.get("occasion"),
    requestedDate: formData.get("requestedDate"),
    requestedTime: formData.get("requestedTime"),
    partySize: formData.get("partySize"),
    desiredAreas: formData.get("desiredAreas"),
    budgetIndicatif: formData.get("budgetIndicatif"),
    menuSouhaite: formData.get("menuSouhaite"),
    boissonsSouhaitees: formData.get("boissonsSouhaitees"),
    equipements: formData.get("equipements"),
    animations: formData.get("animations"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
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
    const { error } = await supabase.from("privatization_requests").insert({
      occasion: data.occasion,
      requested_date: data.requestedDate,
      requested_time: data.requestedTime || null,
      party_size: data.partySize,
      desired_areas: data.desiredAreas || null,
      budget_indicatif: data.budgetIndicatif || null,
      menu_souhaite: data.menuSouhaite || null,
      boissons_souhaitees: data.boissonsSouhaitees || null,
      equipements: data.equipements || null,
      animations: data.animations || null,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email || null,
      status: "nouvelle",
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
        "Votre demande de privatisation a bien été envoyée. Notre équipe étudiera votre demande et reviendra vers vous avec un devis.",
    };
  } catch {
    return {
      success: false,
      message: "Une erreur est survenue. Merci de réessayer ou de nous contacter par téléphone.",
    };
  }
}
