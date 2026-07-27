import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/dashboard/Card";
import { NewStockItemForm, StockMovementForm } from "@/components/dashboard/StockForms";
import { ScanStockButton } from "@/components/dashboard/ScanStockButton";
import { StockItemsTable } from "@/components/dashboard/StockItemsTable";

export const metadata = { title: "Stock" };

export default async function StockPage() {
  await requireRole("/dashboard/stock");

  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select("id, name, unit, category, quantity_on_hand, low_stock_threshold, image_url")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Suivez les niveaux de stock et enregistrez les mouvements."
        action={<ScanStockButton />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <StockItemsTable items={items ?? []} />
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
