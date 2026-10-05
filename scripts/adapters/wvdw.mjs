// Adapter: Weekend van de Wetenschap
// Strategie:
//  1. Verzamel alle activiteit-URL's van dit jaar (overzichtspagina, met sitemap als fallback)
//  2. Haal alleen NIEUWE detailpagina's op (cache per slug) → ±1000 requests één keer, daarna een handvol per nacht
//  3. Parse het vaste blok op elke pagina: Locatie, Datum en tijd, type, thema, leeftijd, prijs
import * as cheerio from "cheerio";
import { get, readJSON, writeJSON } from "../lib/util.mjs";

const BASE = "https://weekendvandewetenschap.nl";
const GROUP = "Weekend van de Wetenschap";

// Vaste woordenlijsten van hun eigen filterpagina. Door hierop te matchen
// maakt het niet uit hoe de HTML precies is opgebouwd.
const TYPES = ["Demonstratie","Lezing","Open dag","Overige","Proefjes","Rondleiding","Show","Spel","Sterren kijken","Tentoonstelling","Workshop"];
const THEMES = ["Verhalen & Talen","Lijf & Brein","Dieren & Natuur","Proefjes & Getallen","Ruimte & Sterren","Uitvindingen & Techniek"];
const AGES = { "Kinderen 8 - 14 jaar": "8–14", "Jongeren 14 - 18 jaar": "14–18", "Alle leeftijden": "Alle leeftijden" };
const PRICES = ["Gratis met aanmelding","Gratis","Betaalde toegang"];
const ACCESS = ["Rolstoeltoegankelijk","Prikkelarme momenten/ruimtes beschikbaar","Hulphond welkom","Objecten kunnen aangeraakt worden"];
const LABELS = ["Locatie","Datum en tijd","Naam organisatie","Hotspot","Soort activiteit","Thema","Doelgroep","Voor wie","Toegangsprijs","Prijs","Toegankelijkheid","Website","Social media","Open in Google maps","Ga naar de"];
const WEEKDAYS = ["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"];
const MONTHS = { januari:1,februari:2,maart:3,april:4,mei:5,juni:6,juli:7,augustus:8,september:9,oktober:10,november:11,december:12 };

async function collectUrls(year) {
  const re = new RegExp(`/activiteiten/${year}/([^/?#]+)/?$`);
  const urls = new Set();

  const listing = await get(`${BASE}/activiteiten/${year}/`);
  if (listing) {
    const $ = cheerio.load(listing);
    $("a[href]").each((_, a) => {
      const href = new URL($(a).attr("href"), BASE).href;
      if (re.test(href)) urls.add(href.replace(/\/?$/, "/"));
    });
  }
  console.log(`  overzichtspagina: ${urls.size} links`);

  // Wordt de lijst met JavaScript geladen? Dan staan de links in de sitemap.
  if (urls.size < 50) {
    for (const idx of ["/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap.xml"]) {
      const xml = await get(BASE + idx);
      if (!xml) continue;
      const subs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
      for (const sub of subs.filter(s => s.endsWith(".xml"))) {
        const subXml = await get(sub);
        for (const m of (subXml || "").matchAll(/<loc>([^<]+)<\/loc>/g))
          if (re.test(m[1])) urls.add(m[1].replace(/\/?$/, "/"));
      }
      for (const s of subs) if (re.test(s)) urls.add(s.replace(/\/?$/, "/"));
      if (urls.size) { console.log(`  sitemap ${idx}: ${urls.size} links`); break; }
    }
  }
  return [...urls];
}

/** HTML → regels tekst, met een regelovergang na elk blok-element */
function toLines(html) {
  const $ = cheerio.load(html);
  $("script,style,noscript,nav,header,footer,form,svg").remove();
  const root = $("main").length ? $("main") : $("body");
  const spaced = (root.html() || "").replace(/<\/?(br|p|div|li|h\d|dd|dt|section|article|span|a|time|address)[^>]*>/gi, m => m + "\n");
  return cheerio.load(spaced).text().split("\n").map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function parseDetail(html, url) {
  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim();
  let lines = toLines(html);
  const stop = lines.findIndex(l => /^Gerelateerde activiteiten/i.test(l));
  if (stop > 0) lines = lines.slice(0, stop);

  const iLoc = lines.findIndex(l => /^Locatie$/i.test(l));
  const iDate = lines.findIndex(l => /^Datum en tijd$/i.test(l));

  // Locatie: alles tussen "Locatie" en "Datum en tijd", zonder de kaart-link
  const locLines = (iLoc >= 0 ? lines.slice(iLoc + 1, iDate > iLoc ? iDate : iLoc + 4) : [])
    .filter(l => !/^Open in Google maps$/i.test(l));
  const locText = locLines.join(" ");
  const pcLine = locLines.findIndex(l => /\d{4}\s?[A-Z]{2}/.test(l));
  const pc = (pcLine >= 0 ? locLines[pcLine] : locText).match(/(\d{4})\s?([A-Z]{2})\s+([A-Za-zÀ-ÿ' -]+)/);
  const postcode = pc ? `${pc[1]} ${pc[2]}` : null;
  const city = pc ? pc[3].replace(/\s*Open in Google maps\s*/ig, "").trim() : null;
  // Straat = de regel vóór de postcode (of hetzelfde stuk tekst ervóór als alles op één regel staat)
  let street = null;
  if (pcLine > 0) street = locLines[pcLine - 1];
  else if (pcLine === 0) street = locLines[0].split(/\d{4}\s?[A-Z]{2}/)[0].match(/[^,]*\d+[a-zA-Z]?\s*$/)?.[0]?.trim() || null;
  if (street && !/\d/.test(street)) street = null;

  // Datums: "Zaterdag, 03 oktober, 2026 Van 10:00 tot 17:00"
  const dateText = lines.slice(Math.max(iDate, 0), Math.max(iDate, 0) + 8).join(" ");
  const slots = [...dateText.matchAll(/(\d{1,2})\s+([a-z]+),?\s+(\d{4})\s+van\s+(\d{1,2}:\d{2})\s+tot\s+(\d{1,2}:\d{2})/gi)]
    .filter(m => MONTHS[m[2].toLowerCase()])
    .map(m => ({
      date: `${m[3]}-${String(MONTHS[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`,
      from: m[4], to: m[5]
    }));

  const has = list => list.filter(v => lines.some(l => l.includes(v)));
  // "Gratis" zit ook in "Gratis met aanmelding": langste match wint
  const price = PRICES.find(p => lines.some(l => l.includes(p))) || null;
  const ageKey = Object.keys(AGES).find(k => lines.some(l => l.startsWith(k)));
  const hotspot = lines.find(l => /^Hotspot\s/.test(l))?.replace(/^Hotspot\s/, "") || null;

  // Organisatie: eerste regel na het datumblok die geen bekende waarde of label is
  const known = new Set([...TYPES, ...THEMES, ...PRICES, ...ACCESS, ...LABELS]);
  const labelRe = new RegExp(`^(${[...LABELS, ...WEEKDAYS].map(s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");
  const afterDate = lines.slice(Math.max(iDate, 0) + 1).filter(l =>
    !/\d{4}\s+van\s+\d/i.test(l) && !/^Van \d/i.test(l) && !/\d{4}$/.test(l) && !labelRe.test(l) &&
    ![...known].some(k => l.includes(k)) && !Object.keys(AGES).some(k => l.startsWith(k)));
  const org = afterDate[0] || null;

  return {
    title, url, org, hotspot,
    venue: locText || null, street, postcode, city,
    slots,
    types: has(TYPES), themes: has(THEMES),
    age: ageKey ? AGES[ageKey] : null,
    price, access: has(ACCESS),
    description: $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || null,
  };
}

export async function fetchWvdw({ year = new Date().getFullYear(), sample = 0, refresh = false } = {}) {
  const cacheFile = `data/cache/wvdw-${year}.json`;
  const cache = refresh ? {} : await readJSON(cacheFile, {});
  let urls = await collectUrls(year);
  if (!urls.length) { console.warn("  ⚠ geen activiteiten gevonden; is de site veranderd?"); return []; }
  if (sample) urls = urls.slice(0, sample);

  const todo = urls.filter(u => !cache[u]);
  console.log(`  ${urls.length} activiteiten, ${todo.length} nieuw op te halen`);
  let n = 0;
  for (const u of todo) {
    const html = await get(u);
    if (html) cache[u] = parseDetail(html, u);
    if (++n % 50 === 0) { console.log(`  … ${n}/${todo.length}`); await writeJSON(cacheFile, cache); }
  }
  await writeJSON(cacheFile, cache);

  // Alleen URL's die nu nog op de site staan (geannuleerde activiteiten vallen zo weg)
  return urls.map(u => cache[u]).filter(Boolean).filter(a => a.slots.length).map(a => {
    const dates = a.slots.map(s => s.date).sort();
    const times = [...new Set(a.slots.map(s => `${s.from}–${s.to}`))].join(", ");
    return {
      id: "wvdw-" + a.url.split("/").filter(Boolean).pop(),
      source: "wvdw", group: `${GROUP} ${year}`,
      title: a.title, url: a.url,
      start: dates[0], end: dates.at(-1), time: times,
      place: [a.org, a.city].filter(Boolean).join(", "),
      venue: a.venue, address: a.street ? `${a.street} ${a.city}` : null, postcode: a.postcode, city: a.city,
      cat: "wet", tags: [...a.themes, ...a.types],
      age: a.age, price: a.price, calm: a.access.some(x => x.startsWith("Prikkelarm")),
      why: a.description,
    };
  });
}
