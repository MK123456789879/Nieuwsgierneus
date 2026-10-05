# Nieuwsgierneus — projectstatus

Handoff voor Cursor en Claude. Bijwerken aan het einde van een sessie.

## Sessie

| Veld | Waarde |
|------|--------|
| Laatst bijgewerkt | 5 oktober 2026 |
| Remote | https://github.com/MK123456789879/Nieuwsgierneus |
| Branch | `main` |
| Firebase site-id | `nieuwsgierneus` |

## Waar staan we?

`scripts/build-events.mjs`, `scripts/lib/geocode.mjs` en `public/events.json` zijn hersteld (waren 0 bytes in commit c2b8840). `public/events.json` is geldige voorbeelddata (`"sample": true`, 26 items) tot de eerste echte run. `data/cache/.gitkeep` houdt de cachemap in git.

`npm run test:wvdw` haalde 1035 links op en bewaarde 2 van 5 activiteiten (de andere drie liggen buiten Limburg en Noord-Brabant: Middelburg, Utrecht). De twee overgebleven items hebben titel, postcode `1234 AB`, plaats, datum, tijd, organisatie, lat/lng, leeftijd en prijs.

De site draait lokaal: lijst (6 uitjes binnen 50 km van Weert), kaarttegels, markers en straalcirkel. Geen fouten van de pagina zelf. `data/curated.json` en de siteteksten zijn niet gewijzigd. Nog niet gedeployed en nog geen volledige `build:events`.

## Adapter

`scripts/adapters/wvdw.mjs` sloeg de labels "Naam organisatie" en "Open in Google maps" op als organisatie en plaats. Die regels worden nu overgeslagen; de stad komt van de postcoderegel.

## Eerstvolgende

1. `npm run build:events` lokaal tot `public/events.json` de echte activiteiten bevat.
2. Secret `FIREBASE_SERVICE_ACCOUNT` en variabele `FIREBASE_PROJECT_ID` in de repo zetten, workflow handmatig starten.
