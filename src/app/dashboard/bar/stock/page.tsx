import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { canAdministerStock } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, StatTile } from "@/components/dashboard/Card";
import { StockMovementForm } from "@/components/dashboard/StockForms";
import { BarStockTable, type BarStockItem } from "@/components/dashboard/BarStockTable";
import { AttachStockCard, type UnlinkedMenuItem } from "@/components/dashboard/AttachStockCard";

export const metadata = { title: "Stock du bar" };

type LinkedMenuItem = { id: string; name: string; price: number; is_available: boolean };

type StockItemRow = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  quantity_on_hand: number;
  low_stock_threshold: number;
  sale_price: number | null;
  image_url: string | null;
  menu_items: LinkedMenuItem[] | LinkedMenuItem | null;
};

type MenuItemRow = {
  id: string;
  name: string;
  price: number;
  destination: string | null;
  menu_categories: { kind: string; name: string }[] | { kind: string; name: string } | null;
};

// L'embed PostgREST renvoie un objet ou un tableau selon la cardinalité détectée :
// on absorbe les deux, comme le fait déjà la prise de commande (`createStaffOrder`).
function firstOf<T>(value: T[] | T | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function BarStockPage() {
  const employee = await requireRole("/dashboard/bar/stock");
  const canAdminister = canAdministerStock(employee.role);

  const supabase = createAdminClient();
  const { data: stockRows } = await supabase
    .from("stock_items")
    .select(
      "id, name, unit, category, quantity_on_hand, low_stock_threshold, sale_price, image_url, menu_items ( id, name, price, is_available )"
    )
    .eq("destination", "bar")
    .order("name", { ascending: true })
    .returns<StockItemRow[]>();

  const items: BarStockItem[] = (stockRows ?? []).map((row) => {
    const linked = firstOf(row.menu_items);
    return {
      id: row.id,
      name: row.name,
      unit: row.unit,
      category: row.category,
      quantity_on_hand: Number(row.quantity_on_hand),
      low_stock_threshold: Number(row.low_stock_threshold),
      sale_price: row.sale_price === null ? null : Number(row.sale_price),
      image_url: row.image_url,
      menuItem: linked
        ? {
            id: linked.id,
            name: linked.name,
            price: Number(linked.price),
            isAvailable: linked.is_available,
          }
        : null,
    };
  });

  const lowStockCount = items.filter(
    (item) => item.quantity_on_hand <= item.low_stock_threshold
  ).length;

  // Fiches bar encore rattachées à aucun produit du menu : candidates à la liaison.
  const availableStockItems = items
    .filter((item) => !item.menuItem)
    .map((item) => ({ id: item.id, name: item.name, unit: item.unit }));

  let unlinkedMenuItems: UnlinkedMenuItem[] = [];

  if (canAdminister) {
    const { data: menuRows } = await supabase
      .from("menu_items")
      .select("id, name, price, destination, menu_categories ( kind, name )")
      .is("stock_item_id", null)
      .order("name", { ascending: true })
      .returns<MenuItemRow[]>();

    // Même résolution que `createStaffOrder` : `destination` fait autorité,
    // sinon on retombe sur le type de la catégorie.
    unlinkedMenuItems = (menuRows ?? [])
      .filter((row) => {
        const category = firstOf(row.menu_categories);
        return (
          row.destination === "bar" ||
          (row.destination !== "cuisine" && category?.kind === "bar")
        );
      })
      .map((row) => ({
        id: row.id,
        name: row.name,
        price: Number(row.price),
        categoryName: firstOf(row.menu_categories)?.name ?? null,
      }));
  }

  return (
    <div>
      <PageHeader
        title="Stock du bar"
        description="Prix et quantités des boissons, et enregistrement des mouvements."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Boissons suivies" value={String(items.length)} />
        <StatTile
          label="Stock faible"
          value={String(lowStockCount)}
          hint={lowStockCount > 0 ? "À réapprovisionner" : "Aucune alerte"}
          hintTone={lowStockCount > 0 ? "negative" : "positive"}
        />
        <StatTile
          label="Non reliées au menu"
          value={String(availableStockItems.length)}
          hint={
            items.length === 0
              ? undefined
              : availableStockItems.length > 0
                ? "Sans prix de vente rattaché"
                : "Tout est relié"
          }
          hintTone={availableStockItems.length > 0 ? "neutral" : "positive"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <BarStockTable items={items} />
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="mb-4 font-display text-base text-champagne">Mouvement de stock</p>
            {items.length > 0 ? (
              <StockMovementForm items={items.map((i) => ({ id: i.id, name: i.name }))} />
            ) : (
              <p className="text-sm text-muted">
                Aucune boisson en stock. Créez d&apos;abord une fiche produit.
              </p>
            )}
          </Card>

          {canAdminister && unlinkedMenuItems.length > 0 ? (
            <Card>
              <AttachStockCard
                menuItems={unlinkedMenuItems}
                availableStockItems={availableStockItems}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
