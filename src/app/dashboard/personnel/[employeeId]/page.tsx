import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState, StatTile } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { roleLabels } from "@/lib/dashboard-nav";
import { orderStatuses, activityActionLabels } from "@/lib/statuses";
import { formatXAF } from "@/lib/utils";
import type { EmployeeRole } from "@/lib/auth/session";

export const metadata = { title: "Fiche employé" };

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  dining_tables: { label: string } | null;
};

type ActivityLogRow = {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
};

type AttendanceRow = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  clock_in_distance_m: number;
  clock_out_distance_m: number | null;
  status: string;
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  await requireRole("/dashboard/personnel");
  const { employeeId } = await params;

  const admin = createAdminClient();

  const { data: employee } = await admin
    .from("employees")
    .select("id, first_name, last_name, email, phone, role, active, hired_at")
    .eq("id", employeeId)
    .maybeSingle();

  if (!employee) notFound();

  const [{ data: orders }, { data: logs }, { data: attendance }] = await Promise.all([
    admin
      .from("orders")
      .select("id, order_number, status, total_amount, created_at, dining_tables ( label )")
      .eq("server_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<OrderRow[]>(),
    admin
      .from("activity_logs")
      .select("id, action, entity_type, created_at")
      .eq("actor_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<ActivityLogRow[]>(),
    admin
      .from("attendance")
      .select("id, clock_in, clock_out, clock_in_distance_m, clock_out_distance_m, status")
      .eq("employee_id", employeeId)
      .order("clock_in", { ascending: false })
      .limit(30)
      .returns<AttendanceRow[]>(),
  ]);

  const activeOrders = (orders ?? []).filter((o) => o.status !== "annulee");
  const totalSales = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const avgTicket = activeOrders.length > 0 ? totalSales / activeOrders.length : 0;

  return (
    <div>
      <Link
        href="/dashboard/personnel"
        className="mb-4 flex w-fit items-center gap-2 text-xs text-muted transition-colors hover:text-gold"
      >
        <ArrowLeft size={14} /> Retour au personnel
      </Link>

      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        description={`${roleLabels[employee.role as EmployeeRole]}${employee.email ? ` — ${employee.email}` : ""}${
          employee.phone ? ` — ${employee.phone}` : ""
        }`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Chiffre d'affaires généré" value={formatXAF(totalSales)} />
        <StatTile label="Commandes prises" value={String(activeOrders.length)} />
        <StatTile label="Panier moyen" value={formatXAF(Math.round(avgTicket))} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Commandes récentes</p>
          {orders && orders.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-champagne">{o.order_number}</p>
                    <p className="text-xs text-muted">
                      {o.dining_tables?.label ?? "—"} ·{" "}
                      {new Date(o.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gold">{formatXAF(Number(o.total_amount))}</span>
                    <StatusBadge
                      label={orderStatuses[o.status]?.label ?? o.status}
                      tone={orderStatuses[o.status]?.tone ?? "neutral"}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune commande enregistrée." />
          )}
        </Card>

        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Journal d&apos;activité</p>
          {logs && logs.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3">
                  <span className="text-champagne">
                    {activityActionLabels[log.action] ?? log.action}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Aucune action enregistrée." />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <p className="mb-4 font-display text-lg text-champagne">Pointage</p>
          {attendance && attendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-responsive w-full text-left text-sm lg:min-w-[560px]">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-4">Arrivée</th>
                    <th className="py-2 pr-4">Départ</th>
                    <th className="py-2 pr-4">Durée</th>
                    <th className="py-2 pr-4">Distance à l&apos;arrivée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {attendance.map((a) => {
                    const clockInDate = new Date(a.clock_in);
                    const clockOutDate = a.clock_out ? new Date(a.clock_out) : null;
                    const durationMin = clockOutDate
                      ? Math.round((clockOutDate.getTime() - clockInDate.getTime()) / 60000)
                      : null;
                    return (
                      <tr key={a.id}>
                        <td className="py-3 pr-4 text-champagne" data-label="Arrivée">
                          {clockInDate.toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 pr-4 text-muted" data-label="Départ">
                          {clockOutDate
                            ? clockOutDate.toLocaleString("fr-FR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "En cours"}
                        </td>
                        <td className="py-3 pr-4 text-muted" data-label="Durée">
                          {durationMin !== null
                            ? `${Math.floor(durationMin / 60)}h${String(durationMin % 60).padStart(2, "0")}`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted" data-label="Distance à l'arrivée">
                          {Math.round(Number(a.clock_in_distance_m))} m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucun pointage enregistré." />
          )}
        </Card>
      </div>
    </div>
  );
}
