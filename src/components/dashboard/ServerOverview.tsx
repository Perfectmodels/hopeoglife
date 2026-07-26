import Link from "next/link";
import { PackageX } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatTile, Card, EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ButtonLink } from "@/components/site/Button";
import { orderStatuses } from "@/lib/statuses";
import { formatXAF } from "@/lib/utils";
import type { CurrentEmployee } from "@/lib/auth/session";

const ACTIVE_STATUSES = [
  "confirmee",
  "transmise",
  "en_preparation",
  "partiellement_prete",
  "prete",
  "servie",
  "en_attente_paiement",
];

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export async function ServerOverview({ employee }: { employee: CurrentEmployee }) {
  const supabase = createAdminClient();
  const { start, end } = todayRange();

  const [{ data: myOrdersToday }, { data: myPaymentsToday }, { data: myShift }, { data: unavailableItems }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, status, table_id, total_amount, created_at, dining_tables ( label )")
        .eq("server_id", employee.id)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("amount, tip_amount")
        .eq("received_by", employee.id)
        .gte("created_at", start)
        .lt("created_at", end),
      supabase
        .from("attendance")
        .select("clock_in")
        .eq("employee_id", employee.id)
        .eq("status", "ouvert")
        .maybeSingle(),
      supabase.from("menu_items").select("id, name").eq("is_available", false).limit(20),
    ]);

  const orders = myOrdersToday ?? [];
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const readyOrders = orders.filter((o) => o.status === "prete");
  const billRequested = orders.filter((o) => o.status === "en_attente_paiement");
  const paidOrders = orders.filter((o) => o.status === "payee");
  const occupiedTables = new Set(activeOrders.map((o) => o.table_id).filter(Boolean));
  const servedTables = new Set(paidOrders.map((o) => o.table_id).filter(Boolean));

  const mySales = (myPaymentsToday ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const myTips = (myPaymentsToday ?? []).reduce((sum, p) => sum + Number(p.tip_amount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title={`Bonsoir, ${employee.firstName}`}
        description={
          myShift
            ? `Service commencé à ${new Date(myShift.clock_in).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Pointez votre arrivée pour démarrer votre service."
        }
        action={<ButtonLink href="/dashboard/commandes/nouvelle">Nouvelle commande</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tables occupées (moi)" value={String(occupiedTables.size)} />
        <StatTile label="Commandes en cours" value={String(activeOrders.length)} />
        <StatTile label="Commandes prêtes" value={String(readyOrders.length)} />
        <StatTile label="Additions demandées" value={String(billRequested.length)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-display text-lg text-champagne">Mes ventes du jour</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Total encaissé par moi</span>
              <span className="text-gold">{formatXAF(mySales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Pourboires</span>
              <span className="text-champagne">{formatXAF(myTips)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tables servies</span>
              <span className="text-champagne">{servedTables.size}</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="mb-4 flex items-center gap-2 font-display text-lg text-champagne">
            <PackageX size={18} className="text-red-400" /> Produits indisponibles
          </p>
          {unavailableItems && unavailableItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {unavailableItems.map((item) => (
                <span
                  key={item.id}
                  className="rounded-full border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-xs text-red-300"
                >
                  {item.name}
                </span>
              ))}
            </div>
          ) : (
            <EmptyState message="Tous les produits sont disponibles." />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg text-champagne">Mes commandes en cours</p>
            <Link href="/dashboard/commandes" className="text-xs text-gold hover:underline">
              Toutes les commandes
            </Link>
          </div>
          {activeOrders.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {activeOrders.map((o) => {
                const table = o.dining_tables as unknown as { label: string } | null;
                const elapsedMin = Math.max(
                  0,
                  Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000)
                );
                return (
                  <li key={o.id} className="flex items-center justify-between gap-3">
                    <span className="text-champagne">{table?.label ?? "À emporter"}</span>
                    <span className="text-xs text-muted">{elapsedMin} min</span>
                    <span className="text-gold">{formatXAF(Number(o.total_amount))}</span>
                    <StatusBadge
                      label={orderStatuses[o.status]?.label ?? o.status}
                      tone={orderStatuses[o.status]?.tone ?? "neutral"}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState message="Aucune commande en cours." />
          )}
        </Card>
      </div>
    </div>
  );
}
