import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState, StatTile } from "@/components/dashboard/Card";
import { paymentMethodLabels } from "@/lib/statuses";
import { formatXAF } from "@/lib/utils";

export const metadata = { title: "Rapports" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  server_id: string | null;
  employees: { first_name: string; last_name: string } | null;
};

type OrderItemRow = {
  quantity: number;
  unit_price: number;
  destination: string;
  menu_items: { name: string } | null;
};

type PaymentRow = { amount: number; tip_amount: number; method: string };

export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole("/dashboard/rapports");

  const { from, to } = await searchParams;
  const fromDate = from || todayISO();
  const toDate = to || fromDate;

  const rangeStart = new Date(`${fromDate}T00:00:00`).toISOString();
  const rangeEnd = new Date(new Date(`${toDate}T00:00:00`).getTime() + 86400000).toISOString();

  const supabase = await createClient();

  const [{ data: orders }, { data: payments }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, total_amount, discount_amount, server_id, employees ( first_name, last_name )"
      )
      .gte("created_at", rangeStart)
      .lt("created_at", rangeEnd)
      .returns<OrderRow[]>(),
    supabase
      .from("payments")
      .select("amount, tip_amount, method")
      .gte("created_at", rangeStart)
      .lt("created_at", rangeEnd)
      .returns<PaymentRow[]>(),
  ]);

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: orderItems } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("quantity, unit_price, destination, menu_items ( name )")
        .in("order_id", orderIds)
        .returns<OrderItemRow[]>()
    : { data: [] as OrderItemRow[] };

  const activeOrders = (orders ?? []).filter((o) => o.status !== "annulee");
  const cancelledCount = (orders ?? []).filter((o) => o.status === "annulee").length;

  const revenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const tipsTotal = (payments ?? []).reduce((sum, p) => sum + Number(p.tip_amount ?? 0), 0);
  const discountsTotal = activeOrders.reduce((sum, o) => sum + Number(o.discount_amount), 0);
  const avgTicket = activeOrders.length > 0 ? revenue / activeOrders.length : 0;

  const byMethod = new Map<string, number>();
  for (const p of payments ?? []) {
    byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount));
  }

  const byDestination = { cuisine: 0, bar: 0 } as Record<string, number>;
  const byProduct = new Map<string, { quantity: number; total: number }>();
  for (const item of orderItems ?? []) {
    const lineTotal = Number(item.unit_price) * item.quantity;
    byDestination[item.destination] = (byDestination[item.destination] ?? 0) + lineTotal;
    const name = item.menu_items?.name ?? "Article";
    const existing = byProduct.get(name) ?? { quantity: 0, total: 0 };
    byProduct.set(name, { quantity: existing.quantity + item.quantity, total: existing.total + lineTotal });
  }
  const topProducts = Array.from(byProduct.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const byServer = new Map<string, { name: string; total: number }>();
  for (const o of activeOrders) {
    if (!o.server_id) continue;
    const name = o.employees ? `${o.employees.first_name} ${o.employees.last_name}` : "—";
    const existing = byServer.get(o.server_id) ?? { name, total: 0 };
    existing.total += Number(o.total_amount);
    byServer.set(o.server_id, existing);
  }
  const serverSales = Array.from(byServer.values()).sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader
        title="Rapports"
        description="Ventes, encaissements et performance sur une période donnée."
        action={
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="from"
              defaultValue={fromDate}
              className="rounded-lg border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
            <span className="text-xs text-muted">à</span>
            <input
              type="date"
              name="to"
              defaultValue={toDate}
              className="rounded-lg border border-border-subtle bg-background-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="rounded-lg border border-gold/50 px-4 py-2 text-sm text-gold hover:bg-gold/10"
            >
              Filtrer
            </button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Chiffre d'affaires encaissé" value={formatXAF(revenue)} />
        <StatTile label="Commandes" value={String(activeOrders.length)} />
        <StatTile label="Panier moyen" value={formatXAF(Math.round(avgTicket))} />
        <StatTile label="Pourboires" value={formatXAF(tipsTotal)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Ventes par moyen de paiement</p>
          {byMethod.size > 0 ? (
            <ul className="space-y-2 text-sm">
              {Array.from(byMethod.entries()).map(([method, amount]) => (
                <li key={method} className="flex justify-between">
                  <span className="text-muted">{paymentMethodLabels[method] ?? method}</span>
                  <span className="text-gold">{formatXAF(amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucun encaissement sur la période." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Restaurant vs Bar</p>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">Restaurant</span>
              <span className="text-gold">{formatXAF(byDestination.cuisine ?? 0)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Bar</span>
              <span className="text-gold">{formatXAF(byDestination.bar ?? 0)}</span>
            </li>
          </ul>
          <div className="mt-6 space-y-2 border-t border-border-subtle/70 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Remises accordées</span>
              <span>{formatXAF(discountsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Commandes annulées</span>
              <span className={cancelledCount > 0 ? "text-red-400" : ""}>{cancelledCount}</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Meilleures ventes</p>
          {topProducts.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {topProducts.map(([name, stats]) => (
                <li key={name} className="flex justify-between gap-3">
                  <span className="truncate text-muted">
                    {stats.quantity}× {name}
                  </span>
                  <span className="shrink-0 text-gold">{formatXAF(stats.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune vente sur la période." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Ventes par serveur</p>
          {serverSales.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {serverSales.map((s) => (
                <li key={s.name} className="flex justify-between">
                  <span className="text-muted">{s.name}</span>
                  <span className="text-gold">{formatXAF(s.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune commande attribuée sur la période." />
          )}
        </Card>
      </div>
    </div>
  );
}
