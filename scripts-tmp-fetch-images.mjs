import { mkdirSync, writeFileSync } from "node:fs";

const UA = "HopeOfLifeWebsite/1.0 (contact@hopeoflife-gabon.com) node-fetch";

const items = [
  { id: "e1", query: "fish tartare plate" },
  { id: "e2", query: "cream vegetable soup bowl" },
  { id: "p1", query: "beef steak plate restaurant" },
  { id: "p2", query: "grilled chicken plated dish" },
  { id: "g1", query: "grilled shrimp skewer" },
  { id: "d1", query: "chocolate lava cake dessert" },
  { id: "c1", query: "orange cocktail glass garnish" },
  { id: "c2", query: "gold cocktail champagne glass" },
  { id: "v1", query: "champagne glass pouring" },
  { id: "v2", query: "red wine glass" },
  { id: "m1", query: "cucumber mint mocktail glass" },
];

mkdirSync("public/menu", { recursive: true });

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`search failed ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  if (pages.length === 0) return null;
  // prefer the highest-indexed relevance (Commons returns 'index' — lower is more relevant)
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  const page = pages[0];
  const info = page.imageinfo?.[0];
  if (!info) return null;
  return {
    title: page.title,
    thumburl: info.thumburl,
    descriptionurl: info.descriptionurl,
    artist: (info.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim(),
    licenseShortName: info.extmetadata?.LicenseShortName?.value ?? "",
    imageDescription: (info.extmetadata?.ImageDescription?.value ?? "").replace(/<[^>]+>/g, "").trim(),
  };
}

async function download(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buf);
  return buf.length;
}

async function main() {
  const credits = [];
  for (const item of items) {
    process.stdout.write(`[${item.id}] searching "${item.query}"... `);
    try {
      const result = await searchCommons(item.query);
      if (!result || !result.thumburl) {
        console.log("NO RESULT");
        continue;
      }
      const destPath = `public/menu/${item.id}.jpg`;
      const size = await download(result.thumburl, destPath);
      console.log(`OK (${(size / 1024).toFixed(0)} KB) — ${result.title}`);
      credits.push({
        id: item.id,
        title: result.title,
        artist: result.artist || "Wikimedia Commons",
        license: result.licenseShortName || "CC",
        sourceUrl: result.descriptionurl,
      });
    } catch (e) {
      console.log("ERROR", e.message);
    }
  }
  writeFileSync("scripts-tmp-credits.json", JSON.stringify(credits, null, 2));
  console.log("DONE");
}

main();
