"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionResult } from "./types";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().trim().email("Adresse e-mail invalide"),
  phone: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  message: z.string().trim().min(5, "Votre message est trop court"),
});

export async function sendContactMessage(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
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
      message: "Message enregistré (mode démo — Supabase non connecté).",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
      status: "nouveau",
    });

    if (error) {
      return {
        success: false,
        message: "Une erreur est survenue lors de l'envoi. Merci de réessayer.",
      };
    }

    return {
      success: true,
      message: "Votre message a bien été envoyé. Nous vous répondrons dans les meilleurs délais.",
    };
  } catch {
    return {
      success: false,
      message: "Une erreur est survenue. Merci de réessayer ou de nous contacter par téléphone.",
    };
  }
}
