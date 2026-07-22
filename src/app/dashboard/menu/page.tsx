import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, EmptyState } from "@/components/dashboard/Card";
import { MenuItemRow } from "@/components/dashboard/MenuItemRow";
import { NewCategoryForm, NewItemForm } from "@/components/dashboard/MenuForms";

export const metadata = { title: "Gestion du menu" };

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_daily_special: boolean;
};
type Category = { id: string; name: string; kind: string; menu_items: Item[] };

export default async function MenuAdminPage() {
  await requireRole("/dashboard/menu");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("menu_categories")
    .select(
      "id, name, kind, menu_items ( id, name, description, price, image_url, is_available, is_daily_special )"
    )
    .order("sort_order", { ascending: true })
    .returns<Category[]>();

  const allCategories = (categories ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      <PageHeader title="Gestion du menu" description="Ajoutez, tarifez et activez les produits du restaurant et du bar." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <Card key={category.id}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-lg text-gold-soft">{category.name}</p>
                  <span className="text-xs uppercase tracking-widest text-muted">
                    {category.kind === "restaurant" ? "Restaurant" : "Bar"}
                  </span>
                </div>
                {category.menu_items && category.menu_items.length > 0 ? (
                  <div>
                    {category.menu_items.map((item) => (
                      <MenuItemRow key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Aucun produit dans cette catégorie.</p>
                )}
              </Card>
            ))
          ) : (
            <EmptyState message="Aucune catégorie. Créez-en une pour commencer." />
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <p className="mb-4 font-display text-base text-champagne">Nouvelle catégorie</p>
            <NewCategoryForm />
          </Card>
          {allCategories.length > 0 ? (
            <Card>
              <p className="mb-4 font-display text-base text-champagne">Nouveau produit</p>
              <NewItemForm categories={allCategories} />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
