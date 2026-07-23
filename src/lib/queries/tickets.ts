import { createAdminClient } from "@/lib/supabase/admin";
import type { Ticket } from "@/components/dashboard/KitchenBoard";

type OrderItemRow = {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  modifiers: string[] | null;
  priority: string;
  menu_items: { name: string } | null;
  orders: {
    id: string;
    order_number: string;
    created_at: string;
    customer_name: string | null;
    dining_tables: { label: string } | null;
  } | null;
};

export async function getTickets(destination: "cuisine" | "bar"): Promise<Ticket[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("order_items")
    .select(
      "id, quantity, notes, status, modifiers, priority, menu_items ( name ), orders ( id, order_number, created_at, customer_name, dining_tables ( label ) )"
    )
    .eq("destination", destination)
    .neq("status", "servi")
    .order("created_at", { ascending: true })
    .returns<OrderItemRow[]>();

  const byOrder = new Map<string, Ticket>();

  for (const row of data ?? []) {
    const order = row.orders;
    if (!order) continue;

    const existing = byOrder.get(order.id);
    const item = {
      id: row.id,
      name: row.menu_items?.name ?? "Article",
      quantity: row.quantity,
      notes: row.notes,
      status: row.status,
      modifiers: row.modifiers ?? [],
      priority: row.priority,
    };

    if (existing) {
      existing.items.push(item);
    } else {
      byOrder.set(order.id, {
        orderId: order.id,
        orderNumber: order.order_number,
        tableLabel: order.dining_tables?.label ?? null,
        customerName: order.customer_name,
        createdAt: order.created_at,
        items: [item],
      });
    }
  }

  return Array.from(byOrder.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
