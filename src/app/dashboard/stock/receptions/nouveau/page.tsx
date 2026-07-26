import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReceiptBuilder } from "@/components/dashboard/ReceiptBuilder";

export const metadata = { title: "Nouvelle réception" };

export default async function NouvelleReceptionPage() {
  await requireRole("/dashboard/stock/receptions");

  const supabase = createAdminClient();
  const [{ data: stockItems }, { data: suppliers }, { data: locations }] = await Promise.all([
    supabase.from("stock_items").select("id, name, unit").order("name", { ascending: true }),
    supabase.from("suppliers").select("id, name").order("name", { ascending: true }),
    supabase.from("stock_locations").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="Nouvelle réception"
        description="Ajoutez les produits reçus puis enregistrez en brouillon ou validez directement."
      />
      <ReceiptBuilder
        mode="edit"
        stockItems={stockItems ?? []}
        suppliers={suppliers ?? []}
        locations={locations ?? []}
      />
    </div>
  );
}
