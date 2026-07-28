import fs from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const file of [".env", ".env.local"]) {
  const content = await fs.readFile(file, "utf8").catch(() => "");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Configuration Supabase serveur manquante.");

const catalog = JSON.parse(await fs.readFile("data/product-catalog.json", "utf8"));
const supabase = createClient(url, key, { auth: { persistSession: false } });

const menuCategories = catalog.categories.filter((category) => category.kind !== "stock");
const { data: existingCategories, error: categoryReadError } = await supabase
  .from("menu_categories")
  .select("id,name,kind");
if (categoryReadError) throw categoryReadError;

const categoryIds = new Map(
  existingCategories.map((category) => [`${category.kind}:${category.name}`, category.id])
);
for (const category of menuCategories) {
  const keyName = `${category.kind}:${category.name}`;
  if (categoryIds.has(keyName)) continue;
  const { data, error } = await supabase
    .from("menu_categories")
    .insert({ name: category.name, kind: category.kind, sort_order: category.number })
    .select("id")
    .single();
  if (error) throw error;
  categoryIds.set(keyName, data.id);
}

const { data: existingMenuItems, error: itemReadError } = await supabase
  .from("menu_items")
  .select("id,name,category_id,internal_reference");
if (itemReadError) throw itemReadError;

const barCategoryIds = existingCategories
  .filter((category) => category.kind === "bar")
  .map((category) => category.id);
if (barCategoryIds.length > 0) {
  const { error: deactivateBarError } = await supabase
    .from("menu_items")
    .update({ is_available: false, is_sellable: false })
    .in("category_id", barCategoryIds)
    .not("internal_reference", "like", "HOL-BAR-REAL-%");
  if (deactivateBarError) throw deactivateBarError;
}

const existingMenuKeys = new Set(
  existingMenuItems.map((item) => `${item.category_id}:${item.name}`)
);

const menuRows = catalog.products
  .filter((product) => product.kind !== "stock")
  .map((product) => ({
    category_id: categoryIds.get(`${product.kind}:${product.category}`),
    name: product.name,
    description: product.description,
    price: product.salePrice,
    image_url: product.imagePath,
    internal_reference: product.internalReference,
    purchase_price: product.purchasePrice,
    promotional_price: product.promotionalPrice,
    quantity_available: product.quantityAvailable,
    minimum_stock: product.minimumStock,
    tax_rate: product.taxRate,
    is_sellable: product.sellable,
    destination: product.kind === "bar" ? "bar" : "cuisine",
    preparation_minutes: product.kind === "restaurant" ? 25 : 5,
    is_available: product.active,
    is_daily_special: false,
    sort_order: product.sortOrder,
  }))
  .filter((row) => !existingMenuKeys.has(`${row.category_id}:${row.name}`));

for (let index = 0; index < menuRows.length; index += 100) {
  const { error } = await supabase.from("menu_items").insert(menuRows.slice(index, index + 100));
  if (error) throw error;
}

const { data: existingStock, error: stockReadError } = await supabase.from("stock_items").select("name,category");
if (stockReadError) throw stockReadError;
const existingStockKeys = new Set(existingStock.map((item) => `${item.category}:${item.name}`));

const stockRows = catalog.products
  .filter((product) => product.kind === "stock")
  .map((product) => ({
    name: product.name,
    unit: product.unit,
    category: product.category,
    subcategory: product.category,
    internal_reference: product.internalReference,
    quantity_on_hand: product.quantityAvailable,
    low_stock_threshold: product.minimumStock,
    purchase_price: product.purchasePrice,
    sale_price: product.salePrice,
    promotional_price: product.promotionalPrice,
    tax_rate: product.taxRate,
    destination: product.destination,
    is_sellable: product.sellable,
    expiration_tracked: false,
    active: product.active,
    image_url: product.imagePath,
  }))
  .filter((row) => !existingStockKeys.has(`${row.category}:${row.name}`));

for (let index = 0; index < stockRows.length; index += 100) {
  const { error } = await supabase.from("stock_items").insert(stockRows.slice(index, index + 100));
  if (error) throw error;
}

console.log(`Import terminé : ${menuRows.length} articles menu, ${stockRows.length} articles de stock.`);
