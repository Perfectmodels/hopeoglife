import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile, Card, EmptyState } from "@/components/dashboard/Card";
import { formatXAF } from "@/lib/utils";

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const today = now.toISOString().slice(0, 10);
  return { start, end, today };
}

export default async function DashboardHomePage() {
  const supabase = createAdminClient();
  const { start, end, today } = todayRange();

  const [
    { count: reservationsToday },
    { count: ordersInProgress },
    { data: paidOrdersToday },
    { count: lowStockCount },
    { count: tablesOccupied },
    { count: tablesTotal },
    { data: recentReservations },
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", today),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmee", "transmise", "en_preparation", "partiellement_prete", "prete", "servie", "en_attente_paiement"]),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "payee")
      .gte("updated_at", start)
      .lt("updated_at", end),
    supabase
      .from("stock_items")
      .select("id, quantity_on_hand, low_stock_threshold", { count: "exact", head: true })
      .lte("quantity_on_hand", 0),
    supabase
      .from("dining_tables")
      .select("id", { count: "exact", head: true })
      .neq("status", "libre"),
    supabase.from("dining_tables").select("id", { count: "exact", head: true }),
    supabase
      .from("reservations")
      .select("id, first_name, last_name, party_size, reservation_time, status")
      .eq("reservation_date", today)
      .order("reservation_time", { ascending: true })
      .limit(6),
  ]);

  const revenueToday = (paidOrdersToday ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount ?? 0),
    0
  );

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`Vue d'ensemble du ${new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Réservations aujourd'hui" value={String(reservationsToday ?? 0)} />
        <StatTile label="Commandes en cours" value={String(ordersInProgress ?? 0)} />
        <StatTile label="Chiffre d'affaires du jour" value={formatXAF(revenueToday)} />
        <StatTile
          label="Tables occupées"
          value={`${tablesOccupied ?? 0} / ${tablesTotal ?? 0}`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg text-champagne">Réservations du jour</p>
            <Link href="/dashboard/reservations" className="text-xs text-gold hover:underline">
              Tout voir
            </Link>
          </div>
          {recentReservations && recentReservations.length > 0 ? (
            <ul className="space-y-3">
              {recentReservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-champagne">
                    {r.first_name} {r.last_name}
                  </span>
                  <span className="text-muted">
                    {r.reservation_time?.slice(0, 5)} · {r.party_size} pers.
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune réservation aujourd'hui." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Alertes</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">Produits en rupture de stock</span>
              <span className={lowStockCount ? "text-red-400" : "text-muted"}>
                {lowStockCount ?? 0}
              </span>
            </li>
          </ul>
          {(lowStockCount ?? 0) > 0 ? (
            <Link
              href="/dashboard/stock"
              className="mt-4 inline-block text-xs text-gold hover:underline"
            >
              Voir le stock →
            </Link>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
