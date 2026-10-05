// Geocoding via PDOK Locatieserver (gratis, Nederlands, geen API-key).
// Geeft ook de provincie terug, zodat we exact op Limburg/Noord-Brabant kunnen filteren.
import { readJSON, writeJSON, sleep } from "./util.mjs";

const CACHE = "data/cache/geocode.json";
const API = "https://api.pdok.nl/bzk/locatieserver/search/v3_1/free";
let cache = null;

async function query(q, type) {
  const u = new URL(API);
  u.searchParams.set("q", q);
  u.searchParams.set("rows", "1");
  u.searchParams.set("fl", "centroide_ll,provincienaam,woonplaatsnaam,weergavenaam");
  if (type) u.searchParams.set("fq", `type:${type}`);
  await sleep(150);
  const res = await fetch(u);
  if (!res.ok) return null;
  const doc = (await res.json())?.response?.docs?.[0];
  if (!doc?.centroide_ll) return null;
  const [lng, lat] = doc.centroide_ll.replace(/POINT\(|\)/g, "").split(" ").map(Number);
  return { lat, lng, province: doc.provincienaam, city: doc.woonplaatsnaam };
}

/** address: vrije tekst; postcode: "5914 CB" (optioneel, fallback); city: fallback */
export async function geocode({ address, postcode, city }) {
  cache ??= await readJSON(CACHE, {});
  const key = [address, postcode, city].filter(Boolean).join(" | ");
  if (key in cache) return cache[key];

  let hit = null;
  if (address) hit = await query(address, "adres");
  if (!hit && postcode) hit = await query(postcode.replace(/\s/g, ""), "postcode");
  if (!hit && city) hit = await query(city, "woonplaats");
  cache[key] = hit; // ook misses cachen, anders proberen we elke nacht opnieuw
  return hit;
}

export const saveGeocodeCache = () => cache && writeJSON(CACHE, cache);
