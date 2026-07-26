import { mkdirSync, writeFileSync } from "node:fs";

const UA = "HopeOfLifeWebsite/1.0 (contact@hopeoflife-gabon.com) node-fetch";

const images = [
  { id: "hero-restaurant", query: "luxury restaurant interior evening" },
  { id: "hero-bar", query: "luxury bar lounge interior dimly lit" },
  { id: "hero-terrace", query: "restaurant terrace outdoor lounge evening" },
  { id: "hero-cocktail", query: "cocktail bar counter golden lighting" },
  { id: "hero-gallery-1", query: "fine dining table setting candlelight" },
  { id: "hero-gallery-2", query: "lounge sofa interior luxury hotel" },
  { id: "hero-gallery-3", query: "restaurant kitchen chef plating" },
  { id: "hero-event", query: "live music lounge bar performance" },
];

mkdirSync("public/hero", { recursive: true });

async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1920&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`search failed ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  if (pages.length === 0) return null;
  pages.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
  const page = pages[0];
  const info = page.imageinfo?.[0];
  if (!info) return null;
  return {
    title: page.title,
    thumburl: info.thumburl,
    descriptionurl: info.descriptionurl,
    artist: (info.extmetadata?.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() || "Wikimedia Commons",
    licenseShortName: info.extmetadata?.LicenseShortName?.value || "CC",
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
  for (const img of images) {
    process.stdout.write(`[${img.id}] searching "${img.query}"... `);
    try {
      const result = await searchCommons(img.query);
      if (!result || !result.thumburl) {
        console.log("NO RESULT");
        continue;
      }
      const ext = result.thumburl.split(".").pop()?.split("?")[0] || "jpg";
      const destPath = `public/hero/${img.id}.${ext}`;
      const size = await download(result.thumburl, destPath);
      console.log(`OK (${(size / 1024).toFixed(0)} KB) — ${result.title}`);
      credits.push({
        id: img.id,
        fileName: `${img.id}.${ext}`,
        title: result.title,
        artist: result.artist,
        license: result.licenseShortName,
        sourceUrl: result.descriptionurl,
      });
    } catch (e) {
      console.log("ERROR", e.message);
    }
  }
  writeFileSync("scripts-ambiance-credits.json", JSON.stringify(credits, null, 2));
  console.log("DONE");
}

main();

