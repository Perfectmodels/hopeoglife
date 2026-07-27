"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ActionResult } from "./types";

const cartItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
});

const orderSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  phone: z.string().trim().min(6, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
  pickupDate: z.string().min(1, "La date de retrait est requise"),
  pickupTime: z.string().min(1, "L'heure de retrait est requise"),
  notes: z.string().trim().optional(),
  cart: z.array(cartItemSchema).min(1, "Votre panier est vide"),
});

function generateOrderNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes()
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMD-${stamp}-${random}`;
}

export async function createOnlineOrder(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  let cartRaw: unknown;
  try {
    cartRaw = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { success: false, message: "Panier invalide." };
  }

  const parsed = orderSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    pickupDate: formData.get("pickupDate"),
    pickupTime: formData.get("pickupTime"),
    notes: formData.get("notes"),
    cart: cartRaw,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;
  const orderNumber = generateOrderNumber();

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: `Commande ${orderNumber} enregistrée (mode démo — Supabase non connecté). Paiement à régler sur place au retrait.`,
    };
  }

  try {
    const supabase = createAdminClient();
    const productIds = [...new Set(data.cart.map((item) => item.menuItemId))];
    const { data: products, error: productsError } = await supabase
      .from("menu_items")
      .select(
        "id, name, price, promotional_price, destination, is_available, is_sellable, menu_categories ( kind )"
      )
      .in("id", productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return {
        success: false,
        message: "Un ou plusieurs produits ne sont plus disponibles.",
      };
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const canonicalCart = data.cart.map((item) => {
      const product = productById.get(item.menuItemId)!;
      const category = Array.isArray(product.menu_categories)
        ? product.menu_categories[0]
        : product.menu_categories;
      const promotionalPrice = Number(product.promotional_price);
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: promotionalPrice > 0 ? promotionalPrice : Number(product.price),
        destination:
          product.destination === "cuisine" || product.destination === "bar"
            ? product.destination
            : category?.kind === "restaurant"
              ? ("cuisine" as const)
              : ("bar" as const),
        available: product.is_available && product.is_sellable,
      };
    });

    if (canonicalCart.some((item) => !item.available)) {
      return {
        success: false,
        message: "Un produit du panier n’est plus disponible à la vente.",
      };
    }

    const totalAmount = canonicalCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let customerId: string | null = null;
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email || null,
        })
        .select("id")
        .single();
      customerId = newCustomer?.id ?? null;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        source: "site_web",
        status: "confirmee",
        notes: [
          data.notes || null,
          `Retrait souhaité : ${data.pickupDate} à ${data.pickupTime}`,
        ]
          .filter(Boolean)
          .join(" — "),
        total_amount: totalAmount,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement de la commande.",
      };
    }

    const orderItems = canonicalCart.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      unit_price: item.price,
      destination: item.destination,
      status: "recu",
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return {
        success: false,
        message: "Une erreur est survenue lors de l'enregistrement des articles.",
      };
    }

    return {
      success: true,
      message: `Commande ${orderNumber} confirmée. Retrait prévu le ${data.pickupDate} à ${data.pickupTime}. Paiement à régler sur place.`,
    };
  } catch {
    return {
      success: false,
      message: "Une erreur est survenue. Merci de réessayer ou de nous contacter par téléphone.",
    };
  }
}
