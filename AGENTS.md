# Nieuwsgierneus

Gezinsagenda met uitjes voor nieuwsgierige kinderen in Limburg en Noord-Brabant. Thuisbasis is Weert. Dit is geen La Plume Media-tool: de internal toolkit niet toepassen.

Lees bij sessie-start `STATUS.md`. Werk `STATUS.md` bij aan het einde van een sessie, niet na elke kleine wijziging.

## Stack

- Statische site in `public/` (`index.html` + `events.json`)
- Node 20, ES modules, dependency `cheerio`
- Firebase Hosting, site-id `nieuwsgierneus` (`firebase.json` → `hosting.site`, project in `.firebaserc`)
- GitHub Actions: `.github/workflows/update-events.yml` (elke nacht, of handmatig). Push naar `main` deployt zonder bronnen op te halen.

## Remote

`origin` = https://github.com/MK123456789879/Nieuwsgierneus.git — branch `main`.

## Bronnen

Adapters in `scripts/adapters/` geven items terug en horen geregistreerd te staan in `ADAPTERS` in `scripts/build-events.mjs`.

Minimale velden: `id`, `title`, `url`, `start` (`YYYY-MM-DD`), `cat` (`wet` | `design` | `boek` | `licht` | `kunst`), plus `address` / `postcode` / `city` voor de kaart. Optioneel: `end`, `time`, `place`, `age`, `price`, `tags`, `why`, `group`, `calm`.

Filter na geocoderen: provincies Limburg en Noord-Brabant (`scripts/lib/util.mjs`).

## Scripts

```bash
npm install
npm run test:wvdw      # 5 WvdW-activiteiten, schrijft niets weg
npm run build:events   # volledige run → public/events.json
npm run dev            # http://localhost:3000
```

## Niet doen

- De La Plume-toolkit, tokens of `lpm-`-componenten gebruiken.
- `data/curated.json` of de site-copy wijzigen zonder dat daarom gevraagd is.
- Secrets committen (Firebase service account hoort als GitHub-secret `FIREBASE_SERVICE_ACCOUNT`).
