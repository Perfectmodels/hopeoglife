import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.join(process.cwd(), "data", "product-catalog-source.md");
const outputPath = path.join(process.cwd(), "data", "product-catalog.json");

const menuBasePrices = {
  1: 1500, 2: 1500, 3: 2500, 4: 3500, 5: 2500, 6: 1500, 7: 2500, 8: 2000,
  9: 25000, 10: 25000, 11: 25000, 12: 75000, 13: 25000, 14: 65000, 15: 75000,
  16: 55000, 17: 55000, 18: 55000, 19: 55000, 20: 4500, 21: 6000, 22: 8000,
  23: 4500, 24: 3000, 25: 2500, 26: 10000, 27: 6000, 28: 9000, 29: 9000,
  30: 18000, 31: 19000, 32: 15000, 33: 21000, 34: 14000, 35: 14000, 36: 14000,
  37: 8500, 38: 10500, 39: 8000, 40: 13000, 41: 3000, 42: 1500, 43: 7500,
  44: 11000, 45: 7000, 46: 5500, 47: 22000, 48: 25000, 49: 85000, 50: 2500,
};

const stockPurchasePrices = {
  51: 5500, 52: 8000, 53: 1800, 54: 2200, 55: 1800,
  56: 3000, 57: 2500, 58: 3500, 59: 300, 60: 2500,
};

const premiumBottlePrices = new Map([
  ["johnnie walker red label", 45000],
  ["johnnie walker black label", 75000],
  ["johnnie walker gold label", 125000],
  ["johnnie walker blue label", 350000],
  ["chivas regal 12 ans", 75000],
  ["chivas regal 18 ans", 150000],
  ["jack daniel’s", 60000],
  ["jameson", 55000],
  ["glenfiddich", 90000],
  ["glenlivet", 90000],
  ["macallan", 180000],
  ["hennessy vs", 65000],
  ["hennessy vsop", 100000],
  ["hennessy xo", 280000],
  ["rémy martin vsop", 95000],
  ["rémy martin xo", 250000],
  ["grey goose", 75000],
  ["belvedere", 75000],
  ["cîroc", 70000],
  ["dom pérignon", 280000],
  ["ruinart blanc de blancs", 150000],
  ["ruinart rosé", 150000],
  ["moët & chandon brut", 85000],
  ["moët & chandon rosé", 100000],
  ["veuve clicquot", 95000],
  ["bollinger", 110000],
]);

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function roundPrice(value) {
  return Math.max(500, Math.round(value / 500) * 500);
}

function estimateMenuPrice(categoryNumber, name) {
  const normalized = name.toLowerCase();
  const knownPrice = premiumBottlePrices.get(normalized);
  if (knownPrice) return knownPrice;

  let price = menuBasePrices[categoryNumber] ?? 5000;

  if (/au verre|shot|une boule/.test(normalized)) price *= 0.22;
  if (/deux boules/.test(normalized)) price *= 0.65;
  if (/trois boules/.test(normalized)) price *= 0.9;
  if (/en bouteille/.test(normalized)) price *= categoryNumber >= 14 && categoryNumber <= 20 ? 1.25 : 1;
  if (/premium|prestige|vip|xxl/.test(normalized)) price *= 1.65;
  if (/plateau de 6/.test(normalized)) price *= 5;
  if (/plateau de 12/.test(normalized)) price *= 9;
  if (/plateau|planche|à partager|famille|groupe|entreprise/.test(normalized)) price *= 1.55;
  if (/menu complet|buffet à volonté|brunch/.test(normalized)) price *= 1.4;
  if (/couple/.test(normalized)) price *= 1.8;
  if (/anniversaire|événement/.test(normalized)) price *= 2;
  if (/demi-poulet/.test(normalized)) price *= 0.72;
  if (/gambas|langouste|fruits de mer|saumon|côte de bœuf|entrecôte|agneau/.test(normalized)) {
    price *= 1.28;
  }
  if (/supplément|recharge|embout|changement de goût/.test(normalized)) price *= 0.55;
  if (/33 cl/.test(normalized)) price *= 0.85;
  if (/50 cl/.test(normalized)) price *= 1.1;
  if (/75 cl|1 l/.test(normalized)) price *= 1.65;
  if (/1,5 l/.test(normalized)) price *= 1.9;

  return roundPrice(price);
}

function inferUnit(categoryNumber, name) {
  const normalized = name.toLowerCase();
  if (/33 cl|50 cl|75 cl|1 l|1,5 l|bouteille|champagne|vin|whisky|vodka|rhum|gin|tequila/.test(normalized)) {
    return "bouteille";
  }
  if (categoryNumber === 51 || categoryNumber === 52) return "kg";
  if (categoryNumber === 53 || categoryNumber === 54) return "kg";
  if (categoryNumber === 55 || categoryNumber === 56) return "unité";
  return "unité";
}

function descriptionFor(kind, categoryName, name) {
  if (kind === "stock") return `${name} — référence de stock interne Hope Of Life.`;
  if (/cocktail|mojito|colada|margarita|spritz|martini|daiquiri|mocktail|virgin/i.test(name)) {
    return "Préparé à la commande par notre équipe bar, servi dans une verrerie adaptée.";
  }
  if (kind === "bar") return `${name}, sélectionné pour la carte bar et lounge Hope Of Life.`;
  return `${name}, préparé à la commande par la cuisine Hope Of Life.`;
}

const source = await fs.readFile(sourcePath, "utf8");
const catalogEnd = source.indexOf("# Informations à enregistrer");
const catalogText = catalogEnd >= 0 ? source.slice(0, catalogEnd) : source;
const sectionPattern = /^##\s+(\d+)\.\s+(.+)$/gm;
const matches = [...catalogText.matchAll(sectionPattern)];
const products = [];
const categories = [];

for (let index = 0; index < matches.length; index += 1) {
  const match = matches[index];
  const number = Number(match[1]);
  const categoryName = match[2].trim();
  const start = match.index + match[0].length;
  const end = matches[index + 1]?.index ?? catalogText.length;
  const items = [...catalogText.slice(start, end).matchAll(/^\*\s+(.+)$/gm)].map((item) => item[1].trim());
  const kind = number <= 26 || number === 49 ? "bar" : number <= 50 ? "restaurant" : "stock";
  const categorySlug = `${String(number).padStart(2, "0")}-${slugify(categoryName)}`;

  categories.push({ number, name: categoryName, slug: categorySlug, kind });

  items.forEach((name, itemIndex) => {
    const slug = `${categorySlug}-${String(itemIndex + 1).padStart(2, "0")}-${slugify(name)}`;
    const salePrice = kind === "stock" ? null : estimateMenuPrice(number, name);
    const purchasePrice =
      kind === "stock"
        ? roundPrice(stockPurchasePrices[number] ?? 1000)
        : roundPrice((salePrice ?? 0) * (number <= 26 || number === 49 ? 0.38 : 0.32));

    products.push({
      slug,
      name,
      categoryNumber: number,
      category: categoryName,
      kind,
      description: descriptionFor(kind, categoryName, name),
      imagePath: `/products/catalog/${slug}.webp`,
      internalReference: `HOL-${kind.toUpperCase()}-${String(number).padStart(2, "0")}-${String(itemIndex + 1).padStart(3, "0")}`,
      unit: inferUnit(number, name),
      purchasePrice,
      salePrice,
      promotionalPrice: null,
      quantityAvailable: 0,
      minimumStock: 5,
      taxRate: 18,
      active: true,
      sellable: kind !== "stock",
      destination: kind === "bar" ? "bar" : kind === "restaurant" ? "cuisine" : "reserve",
      sortOrder: itemIndex,
    });
  });
}

await fs.writeFile(outputPath, `${JSON.stringify({ categories, products }, null, 2)}\n`, "utf8");
console.log(`Catalogue généré : ${products.length} produits dans ${categories.length} catégories.`);
