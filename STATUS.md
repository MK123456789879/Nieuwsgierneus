# Nieuwsgierneus — projectstatus

Handoff voor Cursor en Claude. Bijwerken aan het einde van een sessie.

## Sessie

| Veld | Waarde |
|------|--------|
| Laatst bijgewerkt | 5 oktober 2026 |
| Remote | https://github.com/MK123456789879/Nieuwsgierneus |
| Branch | `main` (nog geen commits, remote is leeg) |
| Firebase site-id | `nieuwsgierneus` |

## Waar staan we?

Zip uitgepakt in de projectroot en gekoppeld aan de lege GitHub-repo. De site in `public/index.html` is een lijst plus Leaflet-kaart (periode, categorie, straal vanaf Weert of eigen locatie, sterren, prikkelarm). Acht handmatige uitjes staan in `data/curated.json`. De WvdW-adapter (`scripts/adapters/wvdw.mjs`) en hulpen in `scripts/lib/util.mjs` zijn aanwezig.

## Wat ontbreekt

Deze bestanden uit de zip zijn leeg (0 bytes):

- `scripts/build-events.mjs` — pipeline waar `npm run build:events` en de nachtelijke Action op leunen
- `scripts/lib/geocode.mjs` — PDOK Locatieserver
- `public/events.json` — de site fetcht dit bestand; nu geen geldige JSON

`data/cache/` is leeg. Er is nog niet gedeployed. GitHub CLI voor `martenk123` heeft een ongeldige token; pushen moet met account `MK123456789879`.

## Eerstvolgende

`build-events.mjs` en `geocode.mjs` aanvullen, daarna een lokale `build:events` tot `public/events.json` klopt.
