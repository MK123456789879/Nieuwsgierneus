import fs from "node:fs/promises";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const HOME = { name: "Weert", lat: 51.2517, lng: 5.7058 };
export const KEEP_PROVINCES = ["Limburg", "Noord-Brabant"];
export const KEEP_PAST_DAYS = 30; // afgelopen items nog 30 dagen bewaren (handig om te testen)

const UA = "nieuwsgierneus/1.0 (persoonlijk, niet-commercieel; 1 run per nacht)";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function get(url, { tries = 3, delay = 600 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      await sleep(delay); // rustig aan doen met andermans server
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "nl" } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.text();
    } catch (e) {
      if (i === tries - 1) { console.warn("  ✗", e.message); return null; }
      await sleep(1500 * (i + 1));
    }
  }
}

export async function readJSON(rel, fallback) {
  try { return JSON.parse(await fs.readFile(path.join(ROOT, rel), "utf8")); }
  catch { return fallback; }
}
export async function writeJSON(rel, data) {
  const p = path.join(ROOT, rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

export function km(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const slugify = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
