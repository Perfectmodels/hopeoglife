import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffOrderBuilder } from "@/components/dashboard/StaffOrderBuilder";

export const metadata = { title: "Nouvelle commande" };

type ItemRow = {
  id: string;
  name: string;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  internal_reference: string | null;
  barcode: string | null;
  destination: "cuisine" | "bar" | "lounge" | null;
  is_available: boolean;
  is_sellable: boolean;
  sort_order: number;
};
type CategoryRow = { id: string; name: string; kind: string; menu_items: ItemRow[] };

export default async function NouvelleCommandePage() {
  await requireRole("/dashboard/commandes");

  const supabase = createAdminClient();

  const [{ data: categories }, { data: tables }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select(
        "id, name, kind, menu_items ( id, name, price, promotional_price, image_url, internal_reference, barcode, destination, is_available, is_sellable, sort_order )"
      )
      .order("sort_order", { ascending: true })
      .returns<CategoryRow[]>(),
    supabase
      .from("dining_tables")
      .select("id, label")
      .neq("status", "indisponible")
      .order("label", { ascending: true }),
  ]);

  const build = (kind: string) =>
    (categories ?? [])
      .filter((c) => c.kind === kind)
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: (c.menu_items ?? [])
          .filter((i) => i.is_available && i.is_sellable)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((i) => ({
            id: i.id,
            name: i.name,
            price:
              i.promotional_price !== null && Number(i.promotional_price) > 0
                ? Number(i.promotional_price)
                : Number(i.price),
            regularPrice:
              i.promotional_price !== null && Number(i.promotional_price) > 0
                ? Number(i.price)
                : undefined,
            imageUrl: i.image_url,
            reference: i.internal_reference,
            barcode: i.barcode,
            destination:
              i.destination === "cuisine" || i.destination === "bar"
                ? i.destination
                : c.kind === "restaurant"
                  ? "cuisine"
                  : "bar",
          })),
      }))
      .filter((c) => c.items.length > 0);

  return (
    <div>
      <PageHeader title="Nouvelle commande" description="Sélectionnez les articles à envoyer en cuisine ou au bar." />
      <StaffOrderBuilder
        restaurantMenu={build("restaurant")}
        barMenu={build("bar")}
        tables={tables ?? []}
      />
    </div>
  );
}
