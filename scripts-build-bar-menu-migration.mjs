import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "data", "bar-menu.json");
const imageSourcesPath = path.join(process.cwd(), "data", "product-image-sources.json");
const outputPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "013_real_bar_menu.sql"
);

const catalog = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const imageSources = JSON.parse(await fs.readFile(imageSourcesPath, "utf8").catch(() => "{}"));

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stableCatalogUuid(scope, index) {
  const prefix = scope === "category" ? "ba100000" : "ba200000";
  return `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

const categoryRows = catalog.categories.map((category, index) => {
  const id = stableCatalogUuid("category", index + 1);
  return `  (${sqlString(id)}::uuid, ${sqlString(category.name)}, 'bar', ${index + 1})`;
});

let itemIndex = 0;
const itemRows = catalog.categories.flatMap((category, categoryIndex) => {
  const categoryId = stableCatalogUuid("category", categoryIndex + 1);
  return category.items.map((item, sortOrder) => {
    itemIndex += 1;
    const id = stableCatalogUuid("item", itemIndex);
    const service = item.service ?? category.service;
    const description =
      item.description ??
      (service === "Bouteille"
        ? "Bouteille."
        : service === "Shot"
          ? "Shot."
          : "Servi au verre.");
    const reference = `HOL-BAR-REAL-${String(itemIndex).padStart(3, "0")}`;
    const slug = `bar-reel-${String(categoryIndex + 1).padStart(2, "0")}-${category.slug}-${String(
      sortOrder + 1
    ).padStart(2, "0")}-${slugify(item.name)}`;
    const imageUrl = imageSources[slug] ? `/products/bar/${slug}.webp` : null;

    return [
      "  (",
      `${sqlString(id)}::uuid, `,
      `${sqlString(categoryId)}::uuid, `,
      `${sqlString(item.name)}, `,
      `${sqlString(description)}, `,
      `${Number(item.price)}, ${sqlString(imageUrl)}, null, true, false, ${sortOrder}, `,
      `${sqlString(reference)}, null, null, null, 0, 0, 18, true, 'bar', 5`,
      ")",
    ].join("");
  });
});

const sql = `-- Hope Of Life — vraie carte boissons du bar
-- Généré depuis data/bar-menu.json. Les anciennes références du bar sont
-- conservées pour l'historique des commandes, mais retirées de la vente.

begin;

update public.menu_items
set
  is_available = false,
  is_sellable = false,
  updated_at = now()
where category_id in (
  select id
  from public.menu_categories
  where kind = 'bar'
);

insert into public.menu_categories (id, name, kind, sort_order)
values
${categoryRows.join(",\n")}
on conflict (id) do update
set
  name = excluded.name,
  kind = excluded.kind,
  sort_order = excluded.sort_order;

insert into public.menu_items (
  id,
  category_id,
  name,
  description,
  price,
  image_url,
  allergens,
  is_available,
  is_daily_special,
  sort_order,
  internal_reference,
  barcode,
  purchase_price,
  promotional_price,
  quantity_available,
  minimum_stock,
  tax_rate,
  is_sellable,
  destination,
  preparation_minutes
)
values
${itemRows.join(",\n")}
on conflict (id) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  allergens = excluded.allergens,
  is_available = excluded.is_available,
  is_daily_special = excluded.is_daily_special,
  sort_order = excluded.sort_order,
  internal_reference = excluded.internal_reference,
  barcode = excluded.barcode,
  purchase_price = excluded.purchase_price,
  promotional_price = excluded.promotional_price,
  quantity_available = excluded.quantity_available,
  minimum_stock = excluded.minimum_stock,
  tax_rate = excluded.tax_rate,
  is_sellable = excluded.is_sellable,
  destination = excluded.destination,
  preparation_minutes = excluded.preparation_minutes,
  updated_at = now();

commit;
`;

await fs.writeFile(outputPath, sql, "utf8");
console.log(
  `Migration générée : ${catalog.categories.length} catégories, ${itemIndex} produits.`
);
