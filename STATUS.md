# Nieuwsgierneus — projectstatus

Handoff voor Cursor en Claude. Bijwerken aan het einde van een sessie.

## Sessie

| Veld | Waarde |
|------|--------|
| Laatst bijgewerkt | 5 oktober 2026 |
| Remote | https://github.com/MK123456789879/Nieuwsgierneus |
| Branch | `main` |
| Firebase site-id | `nieuwsgierneus` |
| Git in deze repo | `MK123456789879` / `MK123456789879@users.noreply.github.com` |

## Waar staan we?

Eerste echte `build:events` is gedraaid. `public/events.json` heeft geen `sample` meer.

Report: WvdW 1035 gevonden, 854 voorgefilterd op postcode buiten 4600–6499, 167 gehouden. Curated 8 gevonden en 8 gehouden. Totaal 175. Alle 167 WvdW-items hebben coördinaten in Limburg of Noord-Brabant. 164 van de 167 hebben een beschrijving (max. 220 tekens).

Lokaal, met "Toon afgelopen" aan: de groep "Weekend van de Wetenschap 2026" toont 106 activiteiten binnen 50 km van Weert, klapt open, en de kaartclusters tellen op tot diezelfde 106.

De handmatige Action van 5 okt (gestart op `9d62140`) haalde nog met de oude parser op en botste bij `git pull --rebase` op `a13a354`. Die push is niet gelukt; `main` bleef de goede set. De workflow pakt nu eerst de laatste `main` en lost een conflict in alleen `events.json` en `data/cache` op. Firebase-secret is gezet (`HAS_FIREBASE` was true); deploy liep niet omdat de job eerder stopte.

## Adapter

Beschrijving komt uit de alinea's onder de titel, niet uit de meta-description. Organisatie is de regel ná "Naam organisatie" (niet de fotocredit "Credits:"). Postcodes zonder letters (`5041 Tilburg`) worden ook gelezen.

## Eerstvolgende

Workflow opnieuw handmatig starten. Die bouwt dan vanaf de laatste `main` en deployt als het secret blijft staan.
