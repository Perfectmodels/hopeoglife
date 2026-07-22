import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StaffOrderBuilder } from "@/components/dashboard/StaffOrderBuilder";

export const metadata = { title: "Nouvelle commande" };

type ItemRow = { id: string; name: string; price: number };
type CategoryRow = { id: string; name: string; kind: string; menu_items: ItemRow[] };

export default async function NouvelleCommandePage() {
  await requireRole("/dashboard/commandes");

  const supabase = await createClient();

  const [{ data: categories }, { data: tables }] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("id, name, kind, menu_items ( id, name, price, is_available )")
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
          .filter((i: ItemRow & { is_available?: boolean }) => i.is_available !== false)
          .map((i) => ({ id: i.id, name: i.name, price: i.price })),
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
