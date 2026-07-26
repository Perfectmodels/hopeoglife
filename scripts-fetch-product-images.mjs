import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const catalog = JSON.parse(
  await fs.readFile(path.join(process.cwd(), "data", "product-catalog.json"), "utf8")
);
const outputDir = path.join(process.cwd(), "public", "products", "catalog");
const creditsPath = path.join(process.cwd(), "data", "product-image-credits.json");
const signatureSource = path.join(
  process.cwd(),
  "public",
  "products",
  "generated",
  "cocktail-signature-du-lounge.png"
);
const restaurantFallback = path.join(
  process.cwd(),
  "public",
  "products",
  "generated",
  "restaurant-dish-fallback.png"
);
const stockFallback = path.join(
  process.cwd(),
  "public",
  "products",
  "generated",
  "stock-ingredients-fallback.png"
);

await fs.mkdir(outputDir, { recursive: true });

const fallbackTerms = {
  bar: "cocktail drink restaurant",
  restaurant: "restaurant food dish",
  stock: "food ingredient product",
};
const categorySearchTerms = {
  1: "soft drink bottles", 2: "mineral water bottles", 3: "fruit juice glass",
  4: "fresh fruit juice", 5: "energy drink cans", 6: "lager beer bottle",
  7: "imported beer bottles", 8: "cider malt drink bottle", 9: "red wine bottle glass",
  10: "white wine bottle glass", 11: "rose wine bottle glass", 12: "champagne bottle glass",
  13: "sparkling wine bottle", 14: "whisky bottle glass", 15: "cognac brandy bottle",
  16: "rum bottle glass", 17: "vodka bottle glass", 18: "gin bottle glass",
  19: "tequila bottle glass", 20: "liqueur aperitif bottle", 21: "classic cocktail glass",
  22: "luxury signature cocktail", 23: "alcohol free mocktail", 24: "liquor shot glasses",
  25: "coffee tea hot drinks", 26: "hookah shisha lounge", 27: "continental breakfast plate",
  28: "cold appetizer restaurant", 29: "hot appetizer restaurant", 30: "grilled meat fish plate",
  31: "beef meat restaurant dish", 32: "chicken restaurant dish", 33: "fish seafood restaurant dish",
  34: "Gabonese African food", 35: "West African food dish", 36: "pasta restaurant dish",
  37: "rice restaurant dish", 38: "gourmet burger fries", 39: "sandwich wrap plate",
  40: "pizza restaurant", 41: "restaurant side dish", 42: "restaurant sauce bowl",
  43: "children meal restaurant", 44: "vegetarian restaurant dish", 45: "restaurant dessert plate",
  46: "ice cream sorbet bowl", 47: "sharing platter restaurant", 48: "restaurant set menu",
  49: "premium bottle service lounge", 50: "restaurant extras side dish", 51: "raw meat butcher",
  52: "fresh fish seafood market", 53: "fresh vegetables", 54: "fresh tropical fruits",
  55: "dry pantry food ingredients", 56: "dairy products eggs", 57: "cocktail bar ingredients",
  58: "hookah supplies", 59: "food takeaway packaging", 60: "restaurant cleaning supplies",
};
const refreshImages = process.env.REFRESH_PRODUCT_IMAGES === "1";

function cleanSearch(value) {
  return value
    .replace(/\b(au verre|en bouteille|maison|premium|vip|xxl|supplément)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function commonsCandidates(search) {
  try {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: search,
      gsrnamespace: "6",
      gsrlimit: "8",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: "900",
      format: "json",
      origin: "*",
    });
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": "HopeOfLifeCatalog/1.0 (product image research)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return [];
    const json = await response.json();
    return Object.values(json.query?.pages ?? {})
      .map((page) => {
        const info = page.imageinfo?.[0];
        return {
          title: page.title,
          url: info?.thumburl || info?.url,
          sourceUrl: info?.descriptionurl,
          artist: info?.extmetadata?.Artist?.value ?? null,
          license: info?.extmetadata?.LicenseShortName?.value ?? null,
        };
      })
      .filter(
        (candidate) =>
          candidate.url &&
          /\.(jpe?g|png|webp)(\?|$)/i.test(candidate.url) &&
          !/\b(pdf|map|cover|poster|logo|label|menu|advert|book|document|drawing|painting|coat of arms)\b/i.test(
            candidate.title
          )
      );
  } catch {
    return [];
  }
}

async function downloadCandidate(candidate) {
  const response = await fetch(candidate.url, {
    headers: { "User-Agent": "HopeOfLifeCatalog/1.0 (product image research)" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return sharp(buffer)
    .rotate()
    .resize(720, 540, { fit: "cover", position: "centre" })
    .webp({ quality: 76 })
    .toBuffer();
}

const previousCredits = await fs
  .readFile(creditsPath, "utf8")
  .then(JSON.parse)
  .catch(() => ({}));
const credits = { ...previousCredits };
let cursor = 0;
let completed = 0;
let fallbackCount = 0;
const groupedProducts = Object.values(
  Object.groupBy(catalog.products, (product) => `${product.categoryNumber}:${product.category}`)
);

async function worker() {
  while (cursor < groupedProducts.length) {
    const products = groupedProducts[cursor++];
    const first = products[0];
    const existing = await Promise.all(
      products.map((product) =>
        fs
          .access(path.join(outputDir, `${product.slug}.webp`))
          .then(() => true)
          .catch(() => false)
      )
    );
    if (!refreshImages && existing.every(Boolean)) {
      completed += products.length;
      continue;
    }

    let candidates = await commonsCandidates(
      `${categorySearchTerms[first.categoryNumber] ?? cleanSearch(first.category)} filetype:bitmap`
    );
    if (candidates.length === 0) {
      candidates = await commonsCandidates(fallbackTerms[first.kind]);
      fallbackCount += 1;
    }

    const usable = [];
    for (const candidate of candidates) {
      try {
        usable.push({ candidate, buffer: await downloadCandidate(candidate) });
      } catch {
        // Essaie l'image suivante de la catégorie.
      }
    }

    if (usable.length === 0) {
      fallbackCount += 1;
      const fallback =
        first.kind === "bar"
          ? signatureSource
          : first.kind === "restaurant"
            ? restaurantFallback
            : stockFallback;
      const fallbackBuffer = await sharp(fallback)
        .resize(720, 540, { fit: "cover" })
        .webp({ quality: 78 })
        .toBuffer();
      for (const product of products) {
        await fs.writeFile(path.join(outputDir, `${product.slug}.webp`), fallbackBuffer);
        credits[product.slug] = {
          source: "AI-generated fallback",
          license: "Project asset",
        };
        completed += 1;
      }
      continue;
    }

    for (const product of products) {
      const destination = path.join(outputDir, `${product.slug}.webp`);
      if (product.name.toLowerCase() === "cocktail signature du lounge") {
        await sharp(signatureSource)
          .resize(720, 540, { fit: "cover" })
          .webp({ quality: 82 })
          .toFile(destination);
        credits[product.slug] = { source: "AI-generated", license: "Project asset" };
        completed += 1;
        continue;
      }

      const selected = usable[product.sortOrder % usable.length];
      await fs.writeFile(destination, selected.buffer);
      credits[product.slug] = {
        title: selected.candidate.title,
        source: selected.candidate.sourceUrl,
        artist: selected.candidate.artist,
        license: selected.candidate.license,
      };
      completed += 1;
      if (completed % 50 === 0) console.log(`${completed}/${catalog.products.length} images prêtes`);
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));

for (const product of catalog.products) {
  const destination = path.join(outputDir, `${product.slug}.webp`);
  let needsFallback = !credits[product.slug];
  try {
    await fs.access(destination);
  } catch {
    needsFallback = true;
  }
  if (needsFallback) {
    const fallback =
      product.kind === "bar"
        ? signatureSource
        : product.kind === "restaurant"
          ? restaurantFallback
          : stockFallback;
    await sharp(fallback)
      .resize(720, 540, { fit: "cover" })
      .webp({ quality: 78 })
      .toFile(destination);
    credits[product.slug] = {
      source: "AI-generated fallback",
      license: "Project asset",
    };
    completed += 1;
  }
}

await fs.writeFile(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, "utf8");
const finalImageCount = (await fs.readdir(outputDir)).filter((file) => file.endsWith(".webp")).length;
console.log(
  `Images prêtes : ${finalImageCount}/${catalog.products.length}; recherches de repli : ${fallbackCount}.`
);
