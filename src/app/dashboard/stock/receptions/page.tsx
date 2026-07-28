import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatXAF } from "@/lib/utils";

export const metadata = { title: "Réceptions" };

const STATUS_LABELS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  brouillon: { label: "Brouillon", tone: "warning" },
  validee: { label: "Validée", tone: "success" },
  annulee: { label: "Annulée", tone: "danger" },
};

export default async function ReceptionsPage() {
  await requireRole("/dashboard/stock/receptions");

  const supabase = createAdminClient();
  const { data: receipts } = await supabase
    .from("stock_receipts")
    .select(
      "id, receipt_number, status, created_at, suppliers(name), stock_receipt_items(quantity_received, unit_cost)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Réceptions"
        description="Bons de réception créés par scan ou saisie manuelle."
        action={
          <Link
            href="/dashboard/stock/receptions/nouveau"
            className="flex items-center gap-2 rounded-lg border border-gold/50 px-4 py-2.5 text-xs uppercase tracking-widest text-gold transition-colors hover:bg-gold/10"
          >
            <PackagePlus size={16} /> Nouvelle réception
          </Link>
        }
      />

      <Card>
        {receipts && receipts.length > 0 ? (
          <div className="overflow-hidden">
            <table className="table-responsive w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-2 pr-4">N°</th>
                  <th className="py-2 pr-4">Fournisseur</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Articles</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {receipts.map((r) => {
                  const items = r.stock_receipt_items as { quantity_received: number; unit_cost: number | null }[];
                  const total = items.reduce((sum, i) => sum + (i.unit_cost ?? 0) * i.quantity_received, 0);
                  const supplier = r.suppliers as unknown as { name: string } | null;
                  const status = STATUS_LABELS[r.status] ?? STATUS_LABELS.brouillon;
                  return (
                    <tr key={r.id}>
                      <td className="py-3 pr-4" data-label="N°">
                        <Link href={`/dashboard/stock/receptions/${r.id}`} className="text-champagne hover:text-gold">
                          {r.receipt_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Fournisseur">{supplier?.name || "—"}</td>
                      <td className="py-3 pr-4 text-muted" data-label="Date">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 pr-4 text-muted" data-label="Articles">{items.length}</td>
                      <td className="py-3 pr-4 text-muted" data-label="Total">{formatXAF(total)}</td>
                      <td className="py-3 pr-4" data-label="Statut">
                        <StatusBadge label={status.label} tone={status.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Aucune réception enregistrée." />
        )}
      </Card>
    </div>
  );
}
