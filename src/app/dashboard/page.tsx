import Link from "next/link";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile, Card, EmptyState } from "@/components/dashboard/Card";
import { paymentMethodLabels } from "@/lib/statuses";
import { formatXAF, cn } from "@/lib/utils";

const LATE_ORDER_MINUTES = 30;
const CASH_VARIANCE_ALERT = 2000;

function dateRange(daysAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDelta(current: number, previous: number): { text: string; tone: "positive" | "negative" | "neutral" } {
  if (previous === 0) {
    if (current === 0) return { text: "Stable vs hier", tone: "neutral" };
    return { text: "Nouveau vs hier", tone: "positive" };
  }
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (pct === 0) return { text: "Stable vs hier", tone: "neutral" };
  const sign = pct > 0 ? "+" : "";
  return {
    text: `${sign}${pct.toLocaleString("fr-FR")} % vs hier`,
    tone: pct > 0 ? "positive" : "negative",
  };
}

type Alert = { level: "critique" | "important" | "info"; message: string; href?: string };

const alertStyles: Record<Alert["level"], { icon: typeof OctagonAlert; className: string }> = {
  critique: { icon: OctagonAlert, className: "border-red-500/30 bg-red-500/5 text-red-300" },
  important: { icon: AlertTriangle, className: "border-amber-500/30 bg-amber-500/5 text-amber-300" },
  info: { icon: Info, className: "border-sky-500/30 bg-sky-500/5 text-sky-300" },
};

export default async function DashboardHomePage() {
  const supabase = createAdminClient();
  const today = dateRange(0);
  const yesterday = dateRange(1);
  const todayISO = today.start.slice(0, 10);

  const [
    { count: reservationsToday },
    { count: ordersInProgress },
    { data: paidOrdersToday },
    { data: paidOrdersYesterday },
    { data: ordersCreatedToday },
    { count: ordersCreatedYesterdayCount },
    { data: stockItems },
    { count: tablesOccupied },
    { count: tablesTotal },
    { data: recentReservations },
    { data: unconfirmedReservations },
    { data: onDuty },
    { data: openCashSessions },
    { data: closedCashSessionsToday },
    { data: paymentsToday },
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", todayISO),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["confirmee", "transmise", "en_preparation", "partiellement_prete", "prete", "servie", "en_attente_paiement"]),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "payee")
      .gte("updated_at", today.start)
      .lt("updated_at", today.end),
    supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "payee")
      .gte("updated_at", yesterday.start)
      .lt("updated_at", yesterday.end),
    supabase
      .from("orders")
      .select("id, status, service_type, total_amount, created_at")
      .gte("created_at", today.start)
      .lt("created_at", today.end),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterday.start)
      .lt("created_at", yesterday.end),
    supabase.from("stock_items").select("id, name, quantity_on_hand, low_stock_threshold"),
    supabase
      .from("dining_tables")
      .select("id", { count: "exact", head: true })
      .neq("status", "libre"),
    supabase.from("dining_tables").select("id", { count: "exact", head: true }),
    supabase
      .from("reservations")
      .select("id, first_name, last_name, party_size, reservation_time, status")
      .eq("reservation_date", todayISO)
      .order("reservation_time", { ascending: true })
      .limit(6),
    supabase
      .from("reservations")
      .select("id, first_name, last_name, party_size")
      .eq("reservation_date", todayISO)
      .eq("status", "en_attente"),
    supabase
      .from("attendance")
      .select("id, clock_in, employees ( first_name, last_name )")
      .eq("status", "ouvert")
      .order("clock_in", { ascending: true }),
    supabase.from("cash_sessions").select("id, opening_amount").eq("status", "ouverte"),
    supabase
      .from("cash_sessions")
      .select("id, variance")
      .eq("status", "cloturee")
      .gte("closed_at", today.start)
      .lt("closed_at", today.end),
    supabase
      .from("payments")
      .select("amount, tip_amount, method")
      .gte("created_at", today.start)
      .lt("created_at", today.end),
  ]);

  const activeOrdersToday = (ordersCreatedToday ?? []).filter((o) => o.status !== "annulee");
  const cancelledOrdersToday = (ordersCreatedToday ?? []).filter((o) => o.status === "annulee");
  const lateOrders = (ordersCreatedToday ?? []).filter(
    (o) =>
      ["confirmee", "transmise", "en_preparation", "partiellement_prete"].includes(o.status) &&
      Date.now() - new Date(o.created_at).getTime() > LATE_ORDER_MINUTES * 60000
  );

  const revenueToday = (paidOrdersToday ?? []).reduce((sum, o) => sum + Number(o.total_amount), 0);
  const revenueYesterday = (paidOrdersYesterday ?? []).reduce(
    (sum, o) => sum + Number(o.total_amount),
    0
  );
  const ticketMoyenToday =
    (paidOrdersToday ?? []).length > 0 ? revenueToday / (paidOrdersToday ?? []).length : 0;
  const ticketMoyenYesterday =
    (paidOrdersYesterday ?? []).length > 0
      ? revenueYesterday / (paidOrdersYesterday ?? []).length
      : 0;

  const revenueDelta = formatDelta(revenueToday, revenueYesterday);
  const ordersDelta = formatDelta(activeOrdersToday.length, ordersCreatedYesterdayCount ?? 0);
  const ticketDelta = formatDelta(ticketMoyenToday, ticketMoyenYesterday);

  const bySerivceType = new Map<string, number>();
  for (const o of activeOrdersToday) {
    bySerivceType.set(o.service_type, (bySerivceType.get(o.service_type) ?? 0) + Number(o.total_amount));
  }
  const serviceTypeLabels: Record<string, string> = {
    sur_place: "Sur place",
    a_emporter: "À emporter",
    livraison: "Livraison",
  };

  const orderIdsToday = activeOrdersToday.map((o) => o.id);
  const { data: orderItemsToday } = orderIdsToday.length
    ? await supabase.from("order_items").select("quantity, unit_price, destination").in("order_id", orderIdsToday)
    : { data: [] as { quantity: number; unit_price: number; destination: string }[] };

  const byDestination = { cuisine: 0, bar: 0 } as Record<string, number>;
  for (const item of orderItemsToday ?? []) {
    byDestination[item.destination] =
      (byDestination[item.destination] ?? 0) + Number(item.unit_price) * item.quantity;
  }

  const outOfStock = (stockItems ?? []).filter((s) => Number(s.quantity_on_hand) <= 0);
  const lowStock = (stockItems ?? []).filter(
    (s) => Number(s.quantity_on_hand) > 0 && Number(s.quantity_on_hand) <= Number(s.low_stock_threshold)
  );

  const cashVarianceToday = (closedCashSessionsToday ?? []).reduce(
    (sum, s) => sum + Number(s.variance ?? 0),
    0
  );
  const bigVarianceSessions = (closedCashSessionsToday ?? []).filter(
    (s) => Math.abs(Number(s.variance ?? 0)) >= CASH_VARIANCE_ALERT
  );
  const cashOnHand = (openCashSessions ?? []).reduce((sum, s) => sum + Number(s.opening_amount), 0);
  const paymentsByMethod = new Map<string, number>();
  let tipsToday = 0;
  for (const p of paymentsToday ?? []) {
    paymentsByMethod.set(p.method, (paymentsByMethod.get(p.method) ?? 0) + Number(p.amount));
    tipsToday += Number(p.tip_amount ?? 0);
  }
  const cashPayments = paymentsByMethod.get("especes") ?? 0;
  const electronicPayments = [...paymentsByMethod.entries()]
    .filter(([method]) => method !== "especes")
    .reduce((sum, [, amount]) => sum + amount, 0);

  const alerts: Alert[] = [];
  for (const item of outOfStock) {
    alerts.push({ level: "critique", message: `Rupture de stock : ${item.name}`, href: "/dashboard/stock" });
  }
  for (const s of bigVarianceSessions) {
    alerts.push({
      level: "critique",
      message: `Écart de caisse important : ${formatXAF(Number(s.variance))}`,
      href: "/dashboard/caisse",
    });
  }
  for (const o of lateOrders) {
    alerts.push({ level: "important", message: `Commande en retard (#${o.id.slice(0, 8)})`, href: "/dashboard/commandes" });
  }
  for (const item of lowStock) {
    alerts.push({ level: "important", message: `Stock faible : ${item.name}`, href: "/dashboard/stock" });
  }
  if ((unconfirmedReservations ?? []).length > 0) {
    alerts.push({
      level: "info",
      message: `${unconfirmedReservations!.length} réservation(s) non confirmée(s) aujourd'hui`,
      href: "/dashboard/reservations",
    });
  }
  const levelOrder: Record<Alert["level"], number> = { critique: 0, important: 1, info: 2 };
  alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

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
        <StatTile
          label="Chiffre d'affaires du jour"
          value={formatXAF(revenueToday)}
          hint={revenueDelta.text}
          hintTone={revenueDelta.tone}
        />
        <StatTile
          label="Commandes du jour"
          value={String(activeOrdersToday.length)}
          hint={ordersDelta.text}
          hintTone={ordersDelta.tone}
        />
        <StatTile
          label="Ticket moyen"
          value={formatXAF(Math.round(ticketMoyenToday))}
          hint={ticketDelta.text}
          hintTone={ticketDelta.tone}
        />
        <StatTile label="Tables occupées" value={`${tablesOccupied ?? 0} / ${tablesTotal ?? 0}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Alertes prioritaires</p>
          {alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.map((alert, i) => {
                const style = alertStyles[alert.level];
                const Icon = style.icon;
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-2.5 text-xs",
                      style.className
                    )}
                  >
                    <Icon size={14} className="mt-0.5 shrink-0" />
                    <span>{alert.message}</span>
                  </div>
                );
                return (
                  <li key={i}>
                    {alert.href ? <Link href={alert.href}>{content}</Link> : content}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="Aucune alerte pour le moment." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Répartition du chiffre d&apos;affaires</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Restaurant</span>
              <span className="text-gold">{formatXAF(byDestination.cuisine ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Bar</span>
              <span className="text-gold">{formatXAF(byDestination.bar ?? 0)}</span>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-border-subtle/70 pt-4 text-sm">
            {Object.entries(serviceTypeLabels).map(([key, label]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted">{label}</span>
                <span className="text-champagne">{formatXAF(bySerivceType.get(key) ?? 0)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Résumé de caisse</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Sessions ouvertes</span>
              <span className="text-champagne">{openCashSessions?.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fonds de caisse en cours</span>
              <span className="text-champagne">{formatXAF(cashOnHand)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Encaissé en espèces</span>
              <span className="text-gold">{formatXAF(cashPayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Encaissé électronique</span>
              <span className="text-gold">{formatXAF(electronicPayments)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Pourboires</span>
              <span className="text-champagne">{formatXAF(tipsToday)}</span>
            </div>
            <div className="flex justify-between border-t border-border-subtle/70 pt-2">
              <span className="text-muted">Écart de caisse (sessions clôturées)</span>
              <span className={cashVarianceToday !== 0 ? "text-red-400" : "text-emerald-400"}>
                {cashVarianceToday >= 0 ? "+" : ""}
                {formatXAF(cashVarianceToday)}
              </span>
            </div>
          </div>
          {paymentsByMethod.size > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...paymentsByMethod.entries()].map(([method, amount]) => (
                <span
                  key={method}
                  className="rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-muted"
                >
                  {paymentMethodLabels[method] ?? method} · {formatXAF(amount)}
                </span>
              ))}
            </div>
          ) : null}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Personnel en service</p>
          {onDuty && onDuty.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {onDuty.map((a) => {
                const emp = a.employees as unknown as { first_name: string; last_name: string } | null;
                return (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-champagne">
                      {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                    </span>
                    <span className="text-xs text-muted">
                      depuis{" "}
                      {new Date(a.clock_in).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="Personne n'a encore pointé." />
          )}
        </Card>

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
          <p className="mb-4 font-display text-lg text-champagne">Commandes du jour</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">En cours</span>
              <span className="text-champagne">{ordersInProgress ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">En retard (+{LATE_ORDER_MINUTES} min)</span>
              <span className={lateOrders.length > 0 ? "text-red-400" : "text-champagne"}>
                {lateOrders.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Annulées aujourd&apos;hui</span>
              <span className="text-champagne">{cancelledOrdersToday.length}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
