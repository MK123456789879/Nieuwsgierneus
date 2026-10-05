// Haalt alle bronnen op → geocodeert → filtert op Limburg/Brabant → schrijft public/events.json
//
//   node scripts/build-events.mjs                  volledige run
//   node scripts/build-events.mjs --only wvdw --sample 5   testen: 5 WvdW-activiteiten, print resultaat
//   node scripts/build-events.mjs --refresh        cache negeren, alles opnieuw ophalen
import { fetchWvdw } from "./adapters/wvdw.mjs";
import { fetchCurated } from "./adapters/curated.mjs";
import { geocode, saveGeocodeCache } from "./lib/geocode.mjs";
import { HOME, KEEP_PROVINCES, KEEP_PAST_DAYS, km, writeJSON } from "./lib/util.mjs";

const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] ?? true) : null; };
const only = arg("--only");
const sample = Number(arg("--sample") || 0);
const refresh = args.includes("--refresh");

// Nieuwe bron? Schrijf een adapter die een lijst items teruggeeft en zet hem hier.
const ADAPTERS = {
  curated: () => fetchCurated(),
  wvdw: () => fetchWvdw({ sample, refresh }),
};

const today = new Date(); today.setHours(0, 0, 0, 0);
const cutoff = new Date(today - KEEP_PAST_DAYS * 864e5).toISOString().slice(0, 10);

const report = {};
let all = [];
for (const [name, run] of Object.entries(ADAPTERS)) {
  if (only && only !== name) continue;
  console.log(`▶ ${name}`);
  try {
    const items = await run();
    report[name] = { found: items.length };
    all.push(...items);
  } catch (e) {
    // Eén kapotte bron mag de rest niet tegenhouden
    console.error(`  ✗ ${name} faalde:`, e.message);
    report[name] = { error: e.message };
  }
}

const out = [];
const seen = new Set();
for (const ev of all) {
  if ((ev.end || ev.start) < cutoff) continue;                       // te lang geleden
  const dupKey = `${ev.title.toLowerCase()}|${ev.start}|${ev.city || ""}`;
  if (seen.has(dupKey)) continue; seen.add(dupKey);                    // dubbelingen

  // Postcode buiten Limburg/Brabant niet geocoderen. Zonder postcode (curated) wél.
  // PDOK blijft daarna het definitieve provinciefilter.
  const pcNum = Number(String(ev.postcode || "").match(/\d{4}/)?.[0]);
  if (Number.isInteger(pcNum) && (pcNum < 4600 || pcNum > 6499)) {
    if (report[ev.source]) report[ev.source].prefilter = (report[ev.source].prefilter || 0) + 1;
    continue;
  }

  if (!(ev.address || ev.postcode || ev.city)) {
    if (ev.source !== "curated") continue;                         // geen locatie = niet bruikbaar
  } else {
    const g = await geocode(ev);
    if (g) {
      if (!KEEP_PROVINCES.includes(g.province)) continue;              // buiten Limburg/Brabant
      Object.assign(ev, { lat: +g.lat.toFixed(5), lng: +g.lng.toFixed(5), province: g.province });
      ev.km = Math.round(km(HOME, ev));
    } else if (ev.source !== "curated") {
      continue;                                                       // geen locatie = niet bruikbaar
    }
  }
  out.push(ev);
  if (report[ev.source]) report[ev.source].kept = (report[ev.source].kept || 0) + 1;
}
await saveGeocodeCache();

out.sort((a, b) => a.start.localeCompare(b.start));
console.log("\nResultaat:", report, `\n→ ${out.length} items`);

if (sample) {
  console.log(JSON.stringify(out.slice(0, sample + 3), null, 2));
  console.log("\n(sample-modus: events.json niet overschreven)");
} else {
  await writeJSON("public/events.json", { generated: new Date().toISOString(), home: HOME, report, events: out });
}
