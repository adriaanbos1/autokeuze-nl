# Toegankelijkheid (WCAG 2.2 AA) — rapport

*Gecontroleerd op 5-11-2026 (Fase 5b), op http://localhost:3000.*

## Hoe getest
1. **Automatisch** met axe-core 4.10.3 (de gangbare open-source testmotor, ook gebruikt in Lighthouse). Regels: WCAG 2.0/2.1/2.2 A en AA, plus best practices.
   - Alle zes pagina's: Autokeuze (mét resultaten en alle uitklapblokken open), Kentekencheck, Modellen, Rekenpagina, Methodiek, Over.
   - Telefoonbreedte (375 px), licht en donker thema.
2. **Contrast met de hand nagerekend** voor alle kleurparen (axe kan contrast in scrollende tabellen niet altijd zelf bepalen):

| Kleur | Licht (op wit / grijs vlak) | Donker (op zwart / grijs vlak) | Eis |
|---|---|---|---|
| Gewone tekst | 17,4 / 16,0 | 15,3 / 13,5 | 4,5 |
| Grijze toelichting | 6,7 / 6,1 | 7,2 / 6,3 | 4,5 |
| Links en knoppen (blauw) | 6,8 / 6,3 | 8,3 / 7,3 | 4,5 |
| Groen / rood (plus / min) | 5,1 / 4,7 | 9,0 / 7,9 | 4,5 |
| Rand van invoervelden en keuzeknoppen | 4,5 | 5,6 | 3,0 |

3. **Met het toetsenbord** (Tab, Enter, spatie): alle knoppen, schuifjes, uitklapblokken en links bereikbaar; zichtbare focusrand.

## Uitkomst
**0 automatische fouten** op alle pagina's na de reparaties hieronder.

| Gevonden | WCAG | Reparatie |
|---|---|---|
| Links in de inhoudsopgave te dicht op elkaar | 2.5.8 Doelgrootte | meer regelafstand |
| Tabellen die opzij scrollen waren niet met het toetsenbord te bedienen | 2.1.1 Toetsenbord | tabel-container focusbaar, met naam |
| Randen van invoervelden te licht (1,4:1) | 1.4.11 Contrast niet-tekst | donkerder rand (4,5:1) |
| Modellenpagina breder dan een telefoonscherm | 1.4.10 Reflow | tekstcel mag weer afbreken |
| Na "Toon mijn top 3" bleef de focus op de knop | 2.4.3 Focusvolgorde / 4.1.3 | focus springt naar de resultaten |
| Geen manier om het menu over te slaan | 2.4.1 Blokken omzeilen | link "Naar de inhoud" (zichtbaar bij Tab) |
| Geen extra focusrand | 2.4.7 / 2.4.13 Focus zichtbaar | 3 px blauwe rand |
| Scrollanimatie altijd aan | 2.3.3 (AAA, extra) | uit bij "minder beweging" |

Al in orde: taal van de pagina (`lang="nl"`), labels bij alle velden, keuzeknoppen met `aria-pressed`, koppen in logische volgorde, tabellen met kolomkoppen.

## Niet automatisch te testen (open)
- **Echte schermlezer** (VoiceOver op iPhone/Mac): nog niet door een mens doorlopen. Advies: vóór de lancering één keer door iemand die er dagelijks mee werkt.
- **Begrijpelijke taal** (3.1.5 is AAA): teksten zijn in gewoon Nederlands geschreven, maar fiscale termen blijven lastig.
- **Zoom 400%**: de layout is mobiel-eerst; bij 320 px breedte geen horizontaal scrollen buiten de tabellen.

## Opnieuw testen
Zie `docs/checklist-regelupdate.md` (onderdeel "Bij elke grote wijziging"). Kort: `npm install`, `cp node_modules/axe-core/axe.min.js public/__axe.min.js`, start `npm run dev` en laat axe op elke pagina lopen. Het bestand `public/__axe.min.js` staat in `.gitignore` en gaat dus niet mee naar de live site.
