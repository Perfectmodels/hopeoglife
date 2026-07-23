import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/Card";
import { ButtonLink } from "@/components/site/Button";
import { OrderRow } from "@/components/dashboard/OrderRow";

export const metadata = { title: "Commandes" };

type OrderRowData = {
  id: string;
  order_number: string;
  source: string;
  status: string;
  total_amount: number;
  created_at: string;
  table_id: string | null;
  dining_tables: { label: string } | null;
  payments: { amount: number }[];
};

export default async function CommandesPage() {
  await requireRole("/dashboard/commandes");

  const supabase = createAdminClient();
  const [{ data: orders }, { data: tables }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, source, status, total_amount, created_at, table_id, dining_tables ( label ), payments ( amount )"
      )
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<OrderRowData[]>(),
    supabase.from("dining_tables").select("id, label").order("label", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="Commandes"
        description="Suivez et encaissez les commandes en cours."
        action={
          <ButtonLink href="/dashboard/commandes/nouvelle">Nouvelle commande</ButtonLink>
        }
      />

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-border-subtle">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-background-elevated text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">N°</th>
                <th className="px-4 py-3">Origine</th>
                <th className="px-4 py-3">Heure</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Paiement</th>
                <th className="px-4 py-3">Table</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {orders.map((o) => (
                <OrderRow key={o.id} order={o} tables={tables ?? []} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="Aucune commande pour le moment." />
      )}
    </div>
  );
}
