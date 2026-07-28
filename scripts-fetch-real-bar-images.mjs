import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcesPath = path.join(root, "data", "product-image-sources.json");
const outputDir = path.join(root, "public", "products", "bar");
const creditsPath = path.join(root, "data", "product-image-credits.json");
const sources = JSON.parse(await fs.readFile(sourcesPath, "utf8"));
const previousCredits = await fs.readFile(creditsPath, "utf8").then(JSON.parse).catch(() => ({}));
const credits = { ...previousCredits };
const entries = Object.entries(sources);
const refresh = process.env.REFRESH_REAL_BAR_IMAGES === "1";
const targetedSlugs = new Set(
  (process.env.REAL_BAR_SLUGS ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
);
const failures = [];
let cursor = 0;
let completed = 0;
let processed = 0;

await fs.mkdir(outputDir, { recursive: true });

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#039;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x2F;", "/");
}

function imageFromHtml(html, pageUrl) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const property =
      tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase() ?? "";
    if (!["og:image", "og:image:url", "twitter:image", "twitter:image:src"].includes(property)) {
      continue;
    }
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (content) return new URL(decodeHtml(content), pageUrl).toString();
  }

  const imageLink = html.match(
    /<link\b[^>]*rel\s*=\s*["']image_src["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i
  )?.[1];
  if (imageLink) return new URL(decodeHtml(imageLink), pageUrl).toString();

  const jsonImage = html.match(/"image"\s*:\s*(?:\[\s*)?"(https?:\\?\/\\?\/[^"]+)"/i)?.[1];
  if (jsonImage) return decodeHtml(jsonImage.replaceAll("\\/", "/"));
  return null;
}

async function fetchBuffer(url, referer) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; HopeOfLifeCatalog/1.0; +https://hopeoglife.vercel.app)",
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      ...(referer ? { Referer: referer } : {}),
    },
    signal: AbortSignal.timeout(22000),
  });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error(`type ${contentType || "inconnu"}`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > 14_000_000) throw new Error("image trop volumineuse");
  return Buffer.from(await response.arrayBuffer());
}

async function resolveImage(sourceUrl) {
  const pageResponse = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; HopeOfLifeCatalog/1.0; +https://hopeoglife.vercel.app)",
      Accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
    },
    signal: AbortSignal.timeout(22000),
  });
  if (!pageResponse.ok) throw new Error(`page HTTP ${pageResponse.status}`);
  const contentType = pageResponse.headers.get("content-type") ?? "";
  const pageBuffer = Buffer.from(await pageResponse.arrayBuffer());
  const isDecodableImage = await sharp(pageBuffer)
    .metadata()
    .then(({ width, height, format }) => Boolean((width && height) || format === "svg"))
    .catch(() => false);
  if (contentType.startsWith("image/") || isDecodableImage) {
    return {
      imageUrl: pageResponse.url,
      buffer: pageBuffer,
    };
  }
  const html = pageBuffer.toString("utf8");
  const imageUrl = imageFromHtml(html, pageResponse.url);
  if (!imageUrl) throw new Error("aucune image sociale trouvée");
  return { imageUrl, buffer: await fetchBuffer(imageUrl, pageResponse.url) };
}

async function worker() {
  while (cursor < entries.length) {
    const [slug, source] = entries[cursor++];
    if (targetedSlugs.size > 0 && !targetedSlugs.has(slug)) continue;

    const destination = path.join(outputDir, `${slug}.webp`);
    if (!refresh) {
      const exists = await fs.access(destination).then(() => true).catch(() => false);
      if (exists) {
        const isValid = await sharp(destination)
          .metadata()
          .then(({ width, height }) => Boolean(width && height))
          .catch(() => false);
        if (isValid) {
          completed += 1;
          continue;
        }
      }
    }

    processed += 1;
    try {
      if (!source.sourceUrl) throw new Error("source absente");
      const resolved = await resolveImage(source.sourceUrl);
      const isCocktail = source.category === "Cocktails";
      await sharp(resolved.buffer)
        .rotate()
        .resize(720, isCocktail ? 540 : 720, {
          fit: isCocktail ? "cover" : "contain",
          position: "centre",
          background: "#080809",
          withoutEnlargement: false,
        })
        .webp({ quality: 82 })
        .toFile(destination);
      credits[slug] = {
        title: source.sourceTitle,
        source: source.sourceUrl,
        image: resolved.imageUrl,
        license: "Source product page",
      };
      completed += 1;
      if (completed % 20 === 0) console.log(`${completed} visuels prêts`);
    } catch (error) {
      failures.push({ slug, name: source.name, source: source.sourceUrl, error: String(error) });
    }
  }
}

await Promise.all(Array.from({ length: 6 }, () => worker()));
await fs.writeFile(creditsPath, `${JSON.stringify(credits, null, 2)}\n`, "utf8");
await fs.writeFile(
  path.join(root, "data", "product-image-failures.json"),
  `${JSON.stringify(failures, null, 2)}\n`,
  "utf8"
);

const requested = targetedSlugs.size > 0 ? targetedSlugs.size : entries.length;
console.log(
  `${completed}/${requested} visuels disponibles (${processed} traités); ${failures.length} échecs.`
);
