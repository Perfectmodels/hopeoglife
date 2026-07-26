import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoBarMenu, demoRestaurantMenu, type DemoMenuCategory } from "@/lib/demo-data";

type MenuItemRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  allergens: string[] | null;
  is_daily_special: boolean;
  is_available: boolean;
  sort_order: number;
};

type MenuCategoryRow = {
  id: string;
  name: string;
  menu_items: MenuItemRow[];
};

export async function getMenuByKind(kind: "restaurant" | "bar"): Promise<DemoMenuCategory[]> {
  const fallback = kind === "restaurant" ? demoRestaurantMenu : demoBarMenu;

  if (!isSupabaseConfigured) {
    return fallback;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("menu_categories")
      .select(
        "id, name, menu_items ( id, name, description, price, image_url, allergens, is_daily_special, is_available, sort_order )"
      )
      .eq("kind", kind)
      .order("sort_order", { ascending: true })
      .returns<MenuCategoryRow[]>();

    if (error || !data || data.length === 0) {
      return fallback;
    }

    const categories = data
      .map((category) => ({
        id: category.id,
        name: category.name,
        items: (category.menu_items ?? [])
          .filter((item) => item.is_available)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? "",
            price: item.price,
            imageUrl: item.image_url ?? undefined,
            allergens: item.allergens ?? undefined,
            isDailySpecial: item.is_daily_special,
          })),
      }))
      .filter((category) => category.items.length > 0);

    return categories.length > 0 ? categories : fallback;
  } catch {
    return fallback;
  }
}
