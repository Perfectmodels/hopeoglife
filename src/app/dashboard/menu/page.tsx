import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CatalogManager } from "@/components/dashboard/CatalogManager";

export const metadata = { title: "Gestion du menu" };

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_sellable: boolean;
  is_daily_special: boolean;
};
type Category = { id: string; name: string; kind: string; menu_items: Item[] };

export default async function MenuAdminPage() {
  await requireRole("/dashboard/menu");

  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("menu_categories")
    .select(
      "id, name, kind, menu_items ( id, name, description, price, image_url, is_available, is_sellable, is_daily_special )"
    )
    .order("sort_order", { ascending: true })
    .returns<Category[]>();

  const visibleCategories = (categories ?? [])
    .map((category) => ({
      ...category,
      menu_items:
        category.kind === "bar"
          ? (category.menu_items ?? []).filter((item) => item.is_sellable)
          : category.menu_items ?? [],
    }))
    .filter((category) => category.kind !== "bar" || category.menu_items.length > 0);

  return (
    <div>
      <PageHeader title="Gestion du menu" description="Ajoutez, tarifez et activez les produits du restaurant et du bar." />
      <CatalogManager categories={visibleCategories} />
    </div>
  );
}
