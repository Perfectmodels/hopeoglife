import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/Card";
import { ButtonLink } from "@/components/site/Button";
import { OrderRow } from "@/components/dashboard/OrderRow";
import { orderStatuses } from "@/lib/statuses";

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

const PAGE_SIZE = 25;

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const employee = await requireRole("/dashboard/commandes");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status?.trim() ?? "";
  const query = params.q?.trim() ?? "";

  const supabase = createAdminClient();
  let ordersQuery = supabase
    .from("orders")
    .select(
      "id, order_number, source, status, total_amount, created_at, table_id, dining_tables ( label ), payments ( amount )",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) ordersQuery = ordersQuery.eq("status", status);
  if (query) ordersQuery = ordersQuery.ilike("order_number", `%${query}%`);

  const [{ data: orders, count }, { data: tables }] = await Promise.all([
    ordersQuery
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      .returns<OrderRowData[]>(),
    supabase.from("dining_tables").select("id, label").order("label", { ascending: true }),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    next.set("page", String(nextPage));
    return `/dashboard/commandes?${next.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Commandes"
        description="Suivez et encaissez les commandes en cours."
        action={
          <ButtonLink href="/dashboard/commandes/nouvelle">Nouvelle commande</ButtonLink>
        }
      />

      <form className="mb-4 grid gap-2 rounded-2xl border border-border-subtle bg-background-elevated p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="N° de commande…"
          className="min-h-11 min-w-0 rounded-xl border border-border-subtle bg-background px-3 text-sm text-foreground outline-none focus:border-gold"
        />
        <select
          name="status"
          defaultValue={status}
          className="min-h-11 min-w-0 rounded-xl border border-border-subtle bg-background px-3 text-sm text-foreground outline-none focus:border-gold"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(orderStatuses).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-11 rounded-xl border border-gold/50 px-5 text-sm text-gold hover:bg-gold/10"
        >
          Filtrer
        </button>
      </form>

      {orders && orders.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border-subtle">
            <table className="table-responsive w-full text-left text-sm">
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
                  <OrderRow key={o.id} order={o} tables={tables ?? []} role={employee.role} />
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-full border border-border-subtle px-4 py-2 text-xs text-muted hover:border-gold hover:text-gold"
                >
                  Précédent
                </Link>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted">
                Page {page} / {totalPages} · {count ?? 0} commandes
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-full border border-border-subtle px-4 py-2 text-xs text-muted hover:border-gold hover:text-gold"
                >
                  Suivant
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState message="Aucune commande pour le moment." />
      )}
    </div>
  );
}
