# Nieuwsgierneus

Uitjes voor nieuwsgierige kinderen in Limburg en Brabant.

Gezinsagenda met uitjes voor nieuwsgierige kinderen. Elke nacht worden de bronnen opgehaald,
gegeocodeerd en gefilterd op Limburg en Noord-Brabant. De site toont ze op een lijst en een kaart, met een straal vanaf Weert of je huidige locatie.

## Structuur
```
scripts/build-events.mjs     pipeline: bronnen → geocoderen → filteren → public/events.json
scripts/adapters/wvdw.mjs    Weekend van de Wetenschap (losse activiteiten)
scripts/adapters/curated.mjs handmatige losse evenementen uit data/curated.json
scripts/lib/geocode.mjs      PDOK Locatieserver (gratis, geeft ook provincie)
data/cache/                  cache van detailpagina's en geocodes (wordt mee gecommit)
public/                      de site (statisch): index.html + events.json
.github/workflows/           nachtelijke run
```

## Lokaal
```
npm install
npm run test:wvdw        # 5 WvdW-activiteiten ophalen en tonen, schrijft niets weg
npm run build:events     # volledige run → public/events.json (eerste keer ±15 min)
npm run dev              # site op http://localhost:3000
```

## Online zetten (Firebase Hosting)
Gratis Spark-plan is genoeg: Firebase serveert alleen de statische site, het ophalen gebeurt in GitHub Actions.

1. Maak een Firebase-project aan (console.firebase.google.com) en zet het project-ID in `.firebaserc` (nu `nieuwsgierneus`; is dat bezet, kies bijv. `nieuwsgierneus-gezin`).
2. Lokaal eenmalig: `npm i -g firebase-tools`, `firebase login`, `firebase deploy --only hosting`.
3. Koppel GitHub voor automatische deploys: `firebase init hosting:github`.
   Dat maakt een service account aan en zet het als secret in je repo.
   Hernoem dat secret naar `FIREBASE_SERVICE_ACCOUNT` (of pas de naam in de workflow aan),
   en zet onder Settings → Secrets and variables → Actions → Variables: `FIREBASE_PROJECT_ID`.
   Laat de workflow-bestanden die `firebase init` aanmaakt weg; `update-events.yml` doet het al.
4. Actions → "Nieuwsgierneus bijwerken en deployen" → Run workflow. Daarna elke nacht automatisch.
   Een push naar `main` (bijv. nieuwe items in `data/curated.json`) deployt direct, zonder op te halen.

Lokaal testen met Firebase: `firebase serve --only hosting` of `firebase emulators:start`.

## Nieuwe bron toevoegen
Maak `scripts/adapters/<naam>.mjs` die een array items teruggeeft en registreer hem in `ADAPTERS`
in `build-events.mjs`. Minimale velden per item:
`id, title, url, start (YYYY-MM-DD), cat (wet|design|boek|licht|kunst)` plus `address`/`postcode`/`city` voor de kaart.
Optioneel: `end, time, place, age, price, tags[], why, group, calm`.
Items met `group` worden op de site gebundeld (zoals alle WvdW-activiteiten).
