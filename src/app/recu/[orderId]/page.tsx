import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/auth/guard";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { paymentMethodLabels } from "@/lib/statuses";
import { siteConfig } from "@/lib/site-config";
import { formatXAF } from "@/lib/utils";

export const metadata = { title: "Reçu" };

type ReceiptOrder = {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  discount_amount: number;
  status: string;
  customer_name: string | null;
  service_type: string;
  dining_tables: { label: string } | null;
  employees: { first_name: string; last_name: string } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    modifiers: string[] | null;
    menu_items: { name: string } | null;
  }[];
  payments: { method: string; amount: number; tip_amount: number; created_at: string }[];
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  sur_place: "Sur place",
  a_emporter: "À emporter",
  livraison: "Livraison",
};

export default async function RecuPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireEmployee();
  const { orderId } = await params;

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, total_amount, discount_amount, status, customer_name, service_type, dining_tables ( label ), employees ( first_name, last_name ), order_items ( id, quantity, unit_price, notes, modifiers, menu_items ( name ) ), payments ( method, amount, tip_amount, created_at )"
    )
    .eq("id", orderId)
    .maybeSingle()
    .returns<ReceiptOrder>();

  if (!order) notFound();

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0
  );
  const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTips = order.payments.reduce((sum, p) => sum + Number(p.tip_amount ?? 0), 0);
  const remaining = Number(order.total_amount) - totalPaid;

  return (
    <div className="min-h-screen bg-neutral-200 py-10 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-sm space-y-4 px-4 print:max-w-none print:px-0">
        <Link
          href="/dashboard/commandes"
          className="print:hidden flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Retour aux commandes
        </Link>

        <div className="rounded-lg bg-white p-6 font-mono text-xs text-black shadow-lg print:rounded-none print:p-0 print:shadow-none">
          <div className="text-center">
            <p className="font-display text-base font-semibold">{siteConfig.name}</p>
            <p>{siteConfig.tagline}</p>
            <p>{siteConfig.address}</p>
            <p>{siteConfig.phone}</p>
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          <p>Commande #{order.order_number}</p>
          <p>
            {new Date(order.created_at).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            {order.dining_tables ? ` — Table ${order.dining_tables.label}` : ""}
          </p>
          <p>{SERVICE_TYPE_LABELS[order.service_type] ?? order.service_type}</p>
          {order.customer_name ? <p>Client : {order.customer_name}</p> : null}
          {order.employees ? (
            <p>
              Servi par {order.employees.first_name} {order.employees.last_name}
            </p>
          ) : null}

          <div className="my-3 border-t border-dashed border-black" />

          <div className="space-y-1">
            {order.order_items.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between gap-2">
                  <span>
                    {item.quantity}x {item.menu_items?.name ?? "Article"}
                  </span>
                  <span className="shrink-0">
                    {formatXAF(Number(item.unit_price) * item.quantity)}
                  </span>
                </div>
                {item.modifiers && item.modifiers.length > 0 ? (
                  <p className="pl-4 text-[10px] text-neutral-600">{item.modifiers.join(", ")}</p>
                ) : null}
                {item.notes ? <p className="pl-4 text-[10px] text-neutral-600">{item.notes}</p> : null}
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-black" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatXAF(subtotal)}</span>
            </div>
            {Number(order.discount_amount) > 0 ? (
              <div className="flex justify-between">
                <span>Remise</span>
                <span>-{formatXAF(Number(order.discount_amount))}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm font-semibold">
              <span>TOTAL</span>
              <span>{formatXAF(Number(order.total_amount))}</span>
            </div>
          </div>

          {order.payments.length > 0 ? (
            <>
              <div className="my-3 border-t border-dashed border-black" />
              <div className="space-y-1">
                {order.payments.map((payment, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{paymentMethodLabels[payment.method] ?? payment.method}</span>
                    <span>{formatXAF(Number(payment.amount))}</span>
                  </div>
                ))}
                {totalTips > 0 ? (
                  <div className="flex justify-between">
                    <span>Pourboire</span>
                    <span>{formatXAF(totalTips)}</span>
                  </div>
                ) : null}
                {remaining > 0 ? (
                  <div className="flex justify-between font-semibold">
                    <span>Solde restant</span>
                    <span>{formatXAF(remaining)}</span>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="my-3 border-t border-dashed border-black" />

          <p className="text-center">Merci de votre visite !</p>
        </div>

        <PrintButton />
      </div>
    </div>
  );
}
