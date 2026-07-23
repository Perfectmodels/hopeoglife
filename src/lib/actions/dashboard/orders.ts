"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentEmployee } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/actions/types";

const ORDER_STATUSES = [
  "brouillon",
  "confirmee",
  "transmise",
  "en_preparation",
  "partiellement_prete",
  "prete",
  "servie",
  "en_attente_paiement",
  "payee",
  "annulee",
  "remboursee",
] as const;

const ORDER_ITEM_STATUSES = ["recu", "en_preparation", "pret", "servi", "indisponible"] as const;

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

const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(50),
  destination: z.enum(["cuisine", "bar"]),
  notes: z.string().optional(),
  modifiers: z.array(z.string().trim().min(1)).optional(),
  priority: z.enum(["normale", "urgente"]).optional(),
});

const createOrderSchema = z.object({
  tableId: z.string().min(1).optional().or(z.literal("")),
  notes: z.string().optional(),
  customerName: z.string().trim().optional(),
  serviceType: z.enum(["sur_place", "a_emporter", "livraison"]).default("sur_place"),
  servedById: z.string().uuid().optional().or(z.literal("")),
  cart: z.array(cartItemSchema).min(1, "Le panier est vide"),
});

export async function createStaffOrder(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  let cartRaw: unknown;
  try {
    cartRaw = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { success: false, message: "Panier invalide." };
  }

  const parsed = createOrderSchema.safeParse({
    tableId: formData.get("tableId"),
    notes: formData.get("notes"),
    customerName: formData.get("customerName"),
    serviceType: formData.get("serviceType") || "sur_place",
    servedById: formData.get("servedById"),
    cart: cartRaw,
  });

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  let serverId = employee.id;
  if (data.servedById) {
    const { data: identified } = await supabase
      .from("employees")
      .select("id")
      .eq("id", data.servedById)
      .eq("active", true)
      .maybeSingle();
    if (identified) serverId = identified.id;
  }

  const totalAmount = data.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      server_id: serverId,
      table_id: data.tableId || null,
      source: "serveur",
      status: "transmise",
      notes: data.notes || null,
      customer_name: data.customerName || null,
      service_type: data.serviceType,
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { success: false, message: "Impossible de créer la commande." };
  }

  const orderItems = data.cart.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    unit_price: item.price,
    notes: item.notes || null,
    destination: item.destination,
    status: "recu",
    modifiers: item.modifiers ?? [],
    priority: item.priority ?? "normale",
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return { success: false, message: "Impossible d'enregistrer les articles." };
  }

  if (data.tableId) {
    await supabase
      .from("dining_tables")
      .update({ status: "commande_en_cours" })
      .eq("id", data.tableId);
  }

  revalidatePath("/dashboard/commandes");
  revalidatePath("/dashboard/cuisine");
  revalidatePath("/dashboard/bar");
  revalidatePath("/dashboard/salle");

  return { success: true, message: "Commande envoyée en cuisine/bar." };
}

export async function transferOrderTable(orderId: string, newTableId: string) {
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");
  if (!newTableId) throw new Error("Table invalide");

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, table_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) throw new Error("Commande introuvable");

  const previousTableId = order.table_id;
  const isOrderActive = !["payee", "annulee", "remboursee"].includes(order.status);

  await supabase.from("orders").update({ table_id: newTableId }).eq("id", orderId);

  if (isOrderActive) {
    await supabase.from("dining_tables").update({ status: "commande_en_cours" }).eq("id", newTableId);
  }
  if (previousTableId && previousTableId !== newTableId) {
    await supabase.from("dining_tables").update({ status: "a_nettoyer" }).eq("id", previousTableId);
  }

  await supabase.from("activity_logs").insert({
    actor_id: employee.id,
    action: "order.transfer_table",
    entity_type: "order",
    entity_id: orderId,
    old_values: { table_id: previousTableId },
    new_values: { table_id: newTableId },
  });

  revalidatePath("/dashboard/commandes");
  revalidatePath("/dashboard/salle");

  return { success: true };
}

export async function updateOrderStatus(id: string, status: string) {
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");

  const supabase = createAdminClient();
  await supabase.from("orders").update({ status }).eq("id", id);

  revalidatePath("/dashboard/commandes");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function updateOrderItemStatus(id: string, status: string) {
  if (!ORDER_ITEM_STATUSES.includes(status as (typeof ORDER_ITEM_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }
  const employee = await getCurrentEmployee();
  if (!employee) throw new Error("Non autorisé");

  const supabase = createAdminClient();
  await supabase.from("order_items").update({ status }).eq("id", id);

  revalidatePath("/dashboard/cuisine");
  revalidatePath("/dashboard/bar");
  revalidatePath("/dashboard/commandes");

  return { success: true };
}

export async function recordPayment(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const employee = await getCurrentEmployee();
  if (!employee) return { success: false, message: "Non autorisé." };

  const orderId = String(formData.get("orderId") ?? "");
  const method = String(formData.get("method") ?? "especes");
  const amount = Number(formData.get("amount") ?? 0);
  const tip = Number(formData.get("tip") ?? 0) || 0;

  if (!orderId || amount <= 0) {
    return { success: false, message: "Paiement invalide." };
  }

  const supabase = createAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select("table_id, total_amount, payments ( amount )")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return { success: false, message: "Commande introuvable." };

  const alreadyPaid = (order.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(order.total_amount) - alreadyPaid;

  if (remaining <= 0) {
    return { success: false, message: "Cette commande est déjà entièrement payée." };
  }
  if (amount > remaining) {
    return { success: false, message: `Le montant dépasse le solde restant (${remaining}).` };
  }

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id")
    .eq("cashier_id", employee.id)
    .eq("status", "ouverte")
    .maybeSingle();

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    cash_session_id: session?.id ?? null,
    method,
    amount,
    tip_amount: tip,
    received_by: employee.id,
  });

  if (paymentError) {
    return { success: false, message: "Impossible d'enregistrer le paiement." };
  }

  if (session) {
    await supabase.from("cash_movements").insert({
      cash_session_id: session.id,
      type: "vente",
      amount: amount + tip,
      reason: `Commande #${orderId.slice(0, 8)}`,
    });
  }

  const fullyPaid = amount >= remaining;

  await supabase
    .from("orders")
    .update({ status: fullyPaid ? "payee" : "en_attente_paiement" })
    .eq("id", orderId);

  if (fullyPaid && order.table_id) {
    await supabase.from("dining_tables").update({ status: "a_nettoyer" }).eq("id", order.table_id);
  }

  revalidatePath("/dashboard/commandes");
  revalidatePath("/dashboard/caisse");
  revalidatePath("/dashboard/salle");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: fullyPaid ? "Paiement enregistré, commande soldée." : "Paiement partiel enregistré.",
  };
}
