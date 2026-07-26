import { requireRole } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";

export const metadata = { title: "Lots et expirations" };

const WARNING_WINDOW_DAYS = 14;

export default async function LotsPage() {
  await requireRole("/dashboard/stock/lots");

  const supabase = createAdminClient();
  const { data: batches } = await supabase
    .from("product_batches")
    .select("id, batch_number, quantity, expiration_date, manufacturing_date, stock_items(name, unit), suppliers(name)")
    .order("expiration_date", { ascending: true, nullsFirst: false })
    .limit(200);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <PageHeader
        title="Lots et expirations"
        description="Suivi des lots reçus et alerte des dates de péremption proches."
      />

      <Card>
        {batches && batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2 pr-4">Produit</th>
                  <th className="py-2 pr-4">N° de lot</th>
                  <th className="py-2 pr-4">Quantité</th>
                  <th className="py-2 pr-4">Fournisseur</th>
                  <th className="py-2 pr-4">Fabrication</th>
                  <th className="py-2 pr-4">Expiration</th>
                  <th className="py-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {batches.map((b) => {
                  const item = b.stock_items as unknown as { name: string; unit: string } | null;
                  const supplier = b.suppliers as unknown as { name: string } | null;
                  const expiration = b.expiration_date ? new Date(b.expiration_date) : null;
                  const daysLeft = expiration
                    ? Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    : null;
                  const expired = daysLeft !== null && daysLeft < 0;
                  const soon = daysLeft !== null && daysLeft >= 0 && daysLeft <= WARNING_WINDOW_DAYS;

                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        expired && "bg-red-500/5",
                        soon && !expired && "bg-amber-500/5"
                      )}
                    >
                      <td className="py-3 pr-4 text-champagne">{item?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted">{b.batch_number}</td>
                      <td className="py-3 pr-4 text-muted">
                        {b.quantity} {item?.unit ?? ""}
                      </td>
                      <td className="py-3 pr-4 text-muted">{supplier?.name || "—"}</td>
                      <td className="py-3 pr-4 text-muted">
                        {b.manufacturing_date
                          ? new Date(b.manufacturing_date).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted">
                        {expiration ? expiration.toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {expired ? (
                          <StatusBadge label="Expiré" tone="danger" />
                        ) : soon ? (
                          <StatusBadge label={`${daysLeft} j restants`} tone="warning" />
                        ) : (
                          <StatusBadge label="OK" tone="success" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Aucun lot enregistré." />
        )}
      </Card>
    </div>
  );
}
