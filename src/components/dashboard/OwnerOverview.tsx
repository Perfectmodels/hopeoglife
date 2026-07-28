import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  ClipboardList,
  Clock3,
  Info,
  OctagonAlert,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState, StatTile } from "@/components/dashboard/Card";
import { DashboardFloorPlan, type FloorArea } from "@/components/dashboard/DashboardFloorPlan";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { orderStatuses, paymentMethodLabels } from "@/lib/statuses";
import { cn, formatXAF } from "@/lib/utils";

const LATE_ORDER_MINUTES = 30;
const CASH_VARIANCE_ALERT = 2000;
const GABON_UTC_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE_ORDER_STATUSES = [
  "confirmee",
  "transmise",
  "en_preparation",
  "partiellement_prete",
  "prete",
  "servie",
  "en_attente_paiement",
];
const OCCUPIED_TABLE_STATUSES = new Set([
  "reservee",
  "occupee",
  "commande_en_cours",
  "commande_prete",
  "paiement_demande",
]);

function operationalRange(daysAgo: number) {
  const now = new Date();
  const localNow = new Date(now.getTime() + GABON_UTC_OFFSET_MS);
  let startMs =
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 5) -
    GABON_UTC_OFFSET_MS;

  if (now.getTime() < startMs) startMs -= DAY_MS;
  startMs -= daysAgo * DAY_MS;

  const start = new Date(startMs);
  const end = new Date(startMs + DAY_MS);
  const localServiceDate = new Date(startMs + GABON_UTC_OFFSET_MS).toISOString().slice(0, 10);
  return { start: start.toISOString(), end: end.toISOString(), localServiceDate };
}

function formatDelta(
  current: number,
  previous: number
): { text: string; tone: "positive" | "negative" | "neutral" } {
  if (previous === 0) {
    if (current === 0) return { text: "Stable vs service précédent", tone: "neutral" };
    return { text: "Nouveau vs service précédent", tone: "positive" };
  }

  const percentage = Math.round(((current - previous) / previous) * 1000) / 10;
  if (percentage === 0) return { text: "Stable vs service précédent", tone: "neutral" };
  return {
    text: `${percentage > 0 ? "+" : ""}${percentage.toLocaleString("fr-FR")} % vs précédent`,
    tone: percentage > 0 ? "positive" : "negative",
  };
}

function localHour(iso: string) {
  return (new Date(iso).getUTCHours() + 1) % 24;
}

function buildRevenuePoints(rows: { total_amount: number | string; updated_at: string }[]) {
  const slots = [
    { hour: 12, label: "12h" },
    { hour: 14, label: "14h" },
    { hour: 16, label: "16h" },
    { hour: 18, label: "18h" },
    { hour: 20, label: "20h" },
    { hour: 22, label: "22h" },
    { hour: 24, label: "00h" },
    { hour: 26, label: "02h" },
  ];
  const totals = slots.map(() => 0);

  for (const row of rows) {
    const hour = localHour(row.updated_at);
    const adjustedHour = hour < 5 ? hour + 24 : hour;
    let slotIndex = -1;
    for (let index = slots.length - 1; index >= 0; index -= 1) {
      if (adjustedHour >= slots[index].hour) {
        slotIndex = index;
        break;
      }
    }
    if (slotIndex >= 0) totals[slotIndex] += Number(row.total_amount);
  }

  return slots.map((slot, index) => ({ label: slot.label, value: totals[index] }));
}

function elapsedMinutes(createdAt: string) {
  return Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
}

type DashboardAlert = {
  level: "critique" | "important" | "info";
  message: string;
  href?: string;
};

const alertStyles: Record<
  DashboardAlert["level"],
  { icon: typeof OctagonAlert; className: string }
> = {
  critique: {
    icon: OctagonAlert,
    className: "border-red-500/30 bg-red-500/[0.06] text-red-300",
  },
  important: {
    icon: AlertTriangle,
    className: "border-amber-500/30 bg-amber-500/[0.06] text-amber-200",
  },
  info: {
    icon: Info,
    className: "border-sky-500/30 bg-sky-500/[0.06] text-sky-200",
  },
};

export async function OwnerOverview() {
  const supabase = createAdminClient();
  const today = operationalRange(0);
  const yesterday = operationalRange(1);
  const todayISO = today.localServiceDate;

  const [
    { count: reservationsToday },
    { count: ordersInProgress },
    { data: paidOrdersToday },
    { data: paidOrdersYesterday },
    { data: ordersCreatedToday },
    { count: ordersCreatedYesterdayCount },
    { data: stockItems },
    { data: diningAreas },
    { data: recentReservations },
    { data: unconfirmedReservations },
    { data: onDuty },
    { data: openCashSessions },
    { data: closedCashSessionsToday },
    { data: paymentsToday },
    { data: liveOrders },
  ] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("reservation_date", todayISO),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_ORDER_STATUSES),
    supabase
      .from("orders")
      .select("total_amount, updated_at")
      .eq("status", "payee")
      .gte("updated_at", today.start)
      .lt("updated_at", today.end),
    supabase
      .from("orders")
      .select("total_amount, updated_at")
      .eq("status", "payee")
      .gte("updated_at", yesterday.start)
      .lt("updated_at", yesterday.end),
    supabase
      .from("orders")
      .select(
        "id, status, service_type, total_amount, created_at, order_items ( quantity, unit_price, destination )"
      )
      .gte("created_at", today.start)
      .lt("created_at", today.end),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterday.start)
      .lt("created_at", yesterday.end),
    supabase.from("stock_items").select("id, name, quantity_on_hand, low_stock_threshold"),
    supabase
      .from("dining_areas")
      .select(
        "id, name, is_vip, sort_order, dining_tables ( id, label, capacity, status, pos_x, pos_y )"
      )
      .order("sort_order", { ascending: true }),
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
    supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, created_at, table_id, service_type, dining_tables ( label )"
      )
      .in("status", ACTIVE_ORDER_STATUSES)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const paidToday = paidOrdersToday ?? [];
  const paidYesterday = paidOrdersYesterday ?? [];
  const ordersToday = ordersCreatedToday ?? [];
  const activeOrdersToday = ordersToday.filter((order) => order.status !== "annulee");
  const cancelledOrdersToday = ordersToday.filter((order) => order.status === "annulee");
  const lateOrders = (liveOrders ?? []).filter(
    (order) =>
      ["confirmee", "transmise", "en_preparation", "partiellement_prete"].includes(order.status) &&
      elapsedMinutes(order.created_at) > LATE_ORDER_MINUTES
  );

  const revenueToday = paidToday.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const revenueYesterday = paidYesterday.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0
  );
  const averageTicketToday = paidToday.length > 0 ? revenueToday / paidToday.length : 0;
  const revenueDelta = formatDelta(revenueToday, revenueYesterday);
  const ordersDelta = formatDelta(activeOrdersToday.length, ordersCreatedYesterdayCount ?? 0);

  const outOfStock = (stockItems ?? []).filter((item) => Number(item.quantity_on_hand) <= 0);
  const lowStock = (stockItems ?? []).filter(
    (item) =>
      Number(item.quantity_on_hand) > 0 &&
      Number(item.quantity_on_hand) <= Number(item.low_stock_threshold)
  );

  const floorAreas: FloorArea[] = (diningAreas ?? []).map((area) => {
    const tables = (area.dining_tables ?? []) as {
      id: string;
      label: string;
      capacity: number;
      status: string;
    }[];
    const activeOrdersByTable = new Map<string, { amount: number; openedMinutes: number }>();
    for (const order of liveOrders ?? []) {
      if (!order.table_id) continue;
      const current = activeOrdersByTable.get(order.table_id);
      activeOrdersByTable.set(order.table_id, {
        amount: (current?.amount ?? 0) + Number(order.total_amount),
        openedMinutes: Math.max(current?.openedMinutes ?? 0, elapsedMinutes(order.created_at)),
      });
    }
    return {
      id: area.id,
      name: area.name,
      isVip: Boolean(area.is_vip),
      tables: tables.map((table) => {
        const activity = activeOrdersByTable.get(table.id);
        return {
          id: table.id,
          label: table.label,
          capacity: table.capacity,
          status: table.status,
          orderAmount: activity?.amount,
          openedMinutes: activity?.openedMinutes,
        };
      }),
    };
  });
  const allTables = floorAreas.flatMap((area) => area.tables);
  const occupiedTableCount = allTables.filter((table) =>
    OCCUPIED_TABLE_STATUSES.has(table.status)
  ).length;
  const occupancyRate =
    allTables.length > 0 ? Math.round((occupiedTableCount / allTables.length) * 100) : 0;

  const byDestination: Record<string, number> = { cuisine: 0, bar: 0 };
  const byServiceType = new Map<string, number>();
  for (const order of activeOrdersToday) {
    byServiceType.set(
      order.service_type,
      (byServiceType.get(order.service_type) ?? 0) + Number(order.total_amount)
    );
    const items = (order.order_items ?? []) as {
      quantity: number;
      unit_price: number;
      destination: string;
    }[];
    for (const item of items) {
      byDestination[item.destination] =
        (byDestination[item.destination] ?? 0) + Number(item.unit_price) * item.quantity;
    }
  }

  const cashVarianceToday = (closedCashSessionsToday ?? []).reduce(
    (sum, session) => sum + Number(session.variance ?? 0),
    0
  );
  const bigVarianceSessions = (closedCashSessionsToday ?? []).filter(
    (session) => Math.abs(Number(session.variance ?? 0)) >= CASH_VARIANCE_ALERT
  );
  const cashOnHand = (openCashSessions ?? []).reduce(
    (sum, session) => sum + Number(session.opening_amount),
    0
  );
  const paymentsByMethod = new Map<string, number>();
  let tipsToday = 0;
  for (const payment of paymentsToday ?? []) {
    paymentsByMethod.set(
      payment.method,
      (paymentsByMethod.get(payment.method) ?? 0) + Number(payment.amount)
    );
    tipsToday += Number(payment.tip_amount ?? 0);
  }
  const cashPayments = paymentsByMethod.get("especes") ?? 0;
  const electronicPayments = [...paymentsByMethod.entries()]
    .filter(([method]) => method !== "especes")
    .reduce((sum, [, amount]) => sum + amount, 0);

  const alerts: DashboardAlert[] = [];
  for (const item of outOfStock) {
    alerts.push({
      level: "critique",
      message: `Rupture de stock : ${item.name}`,
      href: "/dashboard/stock",
    });
  }
  for (const session of bigVarianceSessions) {
    alerts.push({
      level: "critique",
      message: `Écart de caisse important : ${formatXAF(Number(session.variance))}`,
      href: "/dashboard/caisse",
    });
  }
  for (const order of lateOrders) {
    alerts.push({
      level: "important",
      message: `Commande en retard : ${order.order_number}`,
      href: "/dashboard/commandes",
    });
  }
  for (const item of lowStock) {
    alerts.push({
      level: "important",
      message: `Stock faible : ${item.name}`,
      href: "/dashboard/stock",
    });
  }
  if ((unconfirmedReservations ?? []).length > 0) {
    alerts.push({
      level: "info",
      message: `${unconfirmedReservations!.length} réservation(s) à confirmer aujourd'hui`,
      href: "/dashboard/reservations",
    });
  }
  const alertPriority: Record<DashboardAlert["level"], number> = {
    critique: 0,
    important: 1,
    info: 2,
  };
  alerts.sort((a, b) => alertPriority[a.level] - alertPriority[b.level]);

  const revenuePoints = buildRevenuePoints(paidToday);
  const serviceTypeLabels: Record<string, string> = {
    sur_place: "Sur place",
    a_emporter: "À emporter",
    livraison: "Livraison",
  };

  return (
    <div>
      <PageHeader
        title="Vue d’ensemble"
        description={new Date().toLocaleDateString("fr-FR", {
          timeZone: "Africa/Libreville",
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
        action={
          <Link
            href="/dashboard/commandes/nouvelle"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-[#16120a] transition-colors hover:bg-gold-soft"
          >
            Nouvelle commande <ArrowUpRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="CA du service"
          value={formatXAF(revenueToday)}
          hint={revenueDelta.text}
          hintTone={revenueDelta.tone}
          icon={Banknote}
        />
        <StatTile
          label="Commandes"
          value={String(activeOrdersToday.length)}
          hint={ordersDelta.text}
          hintTone={ordersDelta.tone}
          icon={ClipboardList}
        />
        <StatTile
          label="Tables occupées"
          value={`${occupiedTableCount} / ${allTables.length}`}
          hint={`${occupancyRate} % d'occupation`}
          icon={UsersRound}
        />
        <StatTile
          label="Alertes stock"
          value={String(outOfStock.length + lowStock.length)}
          hint={`${outOfStock.length} critique${outOfStock.length > 1 ? "s" : ""}`}
          hintTone={outOfStock.length > 0 ? "negative" : "neutral"}
          icon={TriangleAlert}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.62fr)_minmax(21rem,0.88fr)]">
        <Card className="min-w-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Chiffre d’affaires</h2>
              <p className="mt-1 text-xs text-muted">Service 12h–04h · encaissements confirmés</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gold-soft">{formatXAF(revenueToday)}</p>
              <p className="text-[0.68rem] text-muted">
                Ticket moyen {formatXAF(Math.round(averageTicketToday))}
              </p>
            </div>
          </div>
          <div className="overflow-hidden px-2 pb-2 pt-3 sm:px-4">
            <RevenueChart points={revenuePoints} />
          </div>
          <div className="grid border-t border-border-subtle sm:grid-cols-3">
            <div className="px-5 py-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted">Restaurant</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatXAF(byDestination.cuisine ?? 0)}
              </p>
            </div>
            <div className="border-border-subtle px-5 py-3 sm:border-l">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted">Bar</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatXAF(byDestination.bar ?? 0)}
              </p>
            </div>
            <div className="border-border-subtle px-5 py-3 sm:border-l">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted">Sur place</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatXAF(byServiceType.get("sur_place") ?? 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Commandes en direct</h2>
              <p className="mt-1 text-xs text-muted">{ordersInProgress ?? 0} en cours</p>
            </div>
            <span className="rounded-full border border-gold/35 bg-gold/[0.08] px-2.5 py-1 text-xs font-bold text-gold">
              {liveOrders?.length ?? 0}
            </span>
          </div>
          {liveOrders && liveOrders.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {liveOrders.map((order) => {
                const table = order.dining_tables as unknown as { label: string } | null;
                const status = orderStatuses[order.status] ?? {
                  label: order.status,
                  tone: "neutral" as const,
                };
                return (
                  <li key={order.id}>
                    <Link
                      href="/dashboard/commandes"
                      className="group grid grid-cols-[1fr_auto] gap-3 px-5 py-3.5 transition-colors hover:bg-surface-raised"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {order.order_number}
                          </span>
                          <span className="text-xs text-muted">
                            {table?.label ??
                              (order.service_type === "livraison"
                                ? "Livraison"
                                : order.service_type === "a_emporter"
                                  ? "À emporter"
                                  : "Comptoir")}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge label={status.label} tone={status.tone} />
                          <span
                            className={cn(
                              "flex items-center gap-1 text-[0.68rem]",
                              elapsedMinutes(order.created_at) > LATE_ORDER_MINUTES
                                ? "text-red-300"
                                : "text-muted"
                            )}
                          >
                            <Clock3 size={11} /> {elapsedMinutes(order.created_at)} min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-right">
                        <span className="text-xs font-semibold text-gold-soft">
                          {formatXAF(Number(order.total_amount))}
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="text-muted transition-colors group-hover:text-gold"
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState message="Aucune commande en cours." />
            </div>
          )}
          <Link
            href="/dashboard/commandes"
            className="flex min-h-11 items-center justify-center border-t border-border-subtle text-xs font-semibold text-gold transition-colors hover:bg-gold/[0.05] hover:text-gold-soft"
          >
            Voir toutes les commandes
          </Link>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Plan de salle</h2>
            <p className="mt-1 text-xs text-muted">Occupation et activité des tables en temps réel</p>
          </div>
          <p className="text-xs text-muted">
            {occupiedTableCount} occupée{occupiedTableCount > 1 ? "s" : ""} ·{" "}
            {Math.max(0, allTables.length - occupiedTableCount)} disponible
            {allTables.length - occupiedTableCount > 1 ? "s" : ""}
          </p>
        </div>
        <DashboardFloorPlan areas={floorAreas} />
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Alertes prioritaires</h2>
            <span className="text-xs text-muted">{alerts.length}</span>
          </div>
          {alerts.length > 0 ? (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((alert) => {
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
                  <li key={`${alert.level}-${alert.message}`}>
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
          <h2 className="mb-4 text-sm font-semibold text-foreground">Résumé de caisse</h2>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sessions ouvertes</dt>
              <dd className="font-semibold text-foreground">{openCashSessions?.length ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Fonds en cours</dt>
              <dd className="font-semibold text-foreground">{formatXAF(cashOnHand)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Espèces</dt>
              <dd className="font-semibold text-gold-soft">{formatXAF(cashPayments)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Paiements électroniques</dt>
              <dd className="font-semibold text-gold-soft">{formatXAF(electronicPayments)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border-subtle pt-2.5">
              <dt className="text-muted">Écart clôturé</dt>
              <dd className={cashVarianceToday === 0 ? "text-emerald-400" : "text-red-300"}>
                {cashVarianceToday >= 0 ? "+" : ""}
                {formatXAF(cashVarianceToday)}
              </dd>
            </div>
          </dl>
          {paymentsByMethod.size > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...paymentsByMethod.entries()].map(([method, amount]) => (
                <span
                  key={method}
                  className="rounded-full border border-border-subtle px-2 py-1 text-[0.62rem] text-muted"
                >
                  {paymentMethodLabels[method] ?? method} · {formatXAF(amount)}
                </span>
              ))}
            </div>
          ) : null}
          {tipsToday > 0 ? (
            <p className="mt-3 text-[0.68rem] text-muted">Pourboires : {formatXAF(tipsToday)}</p>
          ) : null}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Personnel en service</h2>
            <Link href="/dashboard/personnel" className="text-xs text-gold hover:text-gold-soft">
              Gérer
            </Link>
          </div>
          {onDuty && onDuty.length > 0 ? (
            <ul className="space-y-3 text-xs">
              {onDuty.slice(0, 6).map((attendance) => {
                const employee = attendance.employees as unknown as {
                  first_name: string;
                  last_name: string;
                } | null;
                return (
                  <li key={attendance.id} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-foreground">
                      {employee ? `${employee.first_name} ${employee.last_name}` : "—"}
                    </span>
                    <span className="shrink-0 text-muted">
                      {new Date(attendance.clock_in).toLocaleTimeString("fr-FR", {
                        timeZone: "Africa/Libreville",
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
            <h2 className="text-sm font-semibold text-foreground">Réservations du jour</h2>
            <span className="text-xs text-muted">{reservationsToday ?? 0}</span>
          </div>
          {recentReservations && recentReservations.length > 0 ? (
            <ul className="space-y-3 text-xs">
              {recentReservations.map((reservation) => (
                <li key={reservation.id} className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium text-foreground">
                    {reservation.first_name} {reservation.last_name}
                  </span>
                  <span className="shrink-0 text-muted">
                    {reservation.reservation_time?.slice(0, 5)} · {reservation.party_size} pers.
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune réservation aujourd'hui." />
          )}
          <div className="mt-4 border-t border-border-subtle pt-3">
            <Link
              href="/dashboard/reservations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-gold-soft"
            >
              Calendrier des réservations <ArrowUpRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      <p className="mt-5 text-right text-[0.65rem] text-muted">
        {cancelledOrdersToday.length} commande(s) annulée(s) ·{" "}
        {formatXAF(byServiceType.get("a_emporter") ?? 0)} à emporter ·{" "}
        {formatXAF(byServiceType.get("livraison") ?? 0)} en livraison ·{" "}
        {serviceTypeLabels.sur_place} actif
      </p>
    </div>
  );
}
