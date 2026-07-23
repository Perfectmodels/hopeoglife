import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { NewStockItemForm, StockMovementForm } from "@/components/dashboard/StockForms";

export const metadata = { title: "Stock" };

export default async function StockPage() {
  await requireRole("/dashboard/stock");

  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select("id, name, unit, category, quantity_on_hand, low_stock_threshold")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader title="Stock" description="Suivez les niveaux de stock et enregistrez les mouvements." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          {items && items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="py-2 pr-4">Produit</th>
                    <th className="py-2 pr-4">Catégorie</th>
                    <th className="py-2 pr-4">Quantité</th>
                    <th className="py-2 pr-4">Seuil</th>
                    <th className="py-2 pr-4">État</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {items.map((item) => {
                    const low = Number(item.quantity_on_hand) <= Number(item.low_stock_threshold);
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-4 text-champagne">{item.name}</td>
                        <td className="py-3 pr-4 text-muted">{item.category || "—"}</td>
                        <td className="py-3 pr-4 text-muted">
                          {item.quantity_on_hand} {item.unit}
                        </td>
                        <td className="py-3 pr-4 text-muted">
                          {item.low_stock_threshold} {item.unit}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge
                            label={low ? "Stock faible" : "OK"}
                            tone={low ? "danger" : "success"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="Aucun produit de stock enregistré." />
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="mb-4 font-display text-base text-champagne">Mouvement de stock</p>
            {items && items.length > 0 ? (
              <StockMovementForm items={items.map((i) => ({ id: i.id, name: i.name }))} />
            ) : (
              <p className="text-sm text-muted">Ajoutez un produit avant d&apos;enregistrer un mouvement.</p>
            )}
          </Card>
          <Card>
            <p className="mb-4 font-display text-base text-champagne">Nouveau produit</p>
            <NewStockItemForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
