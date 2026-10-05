// Handmatig toegevoegde losse evenementen (data/curated.json).
import { readJSON } from "../lib/util.mjs";
export async function fetchCurated() {
  const list = await readJSON("data/curated.json", []);
  return list.map(e => ({ source: "curated", ...e }));
}
