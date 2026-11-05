# Checklist regelupdate

*Hoe we de cijfers actueel houden. Alle fiscale en wettelijke waarden staan in `src/regels/regels-nl.ts`, eigen aannames in `src/regels/aannames.ts`. Nergens anders in de code staan belastingbedragen.*

## Wanneer

| Moment | Waarom | Wat |
|---|---|---|
| **Prinsjesdag** (3e dinsdag van september) | Belastingplan voor volgend jaar | alles met status "aangekondigd" toevoegen of bijwerken; nieuwe tabellen voor het nieuwe jaar klaarzetten |
| **December** | Eerste Kamer stemt over het Belastingplan | "aangekondigd" → "vastgesteld" of terugdraaien |
| **1 januari** | nieuwe tarieven gaan in | volledige check hieronder; `geldigVanaf` en peildatum bijwerken |
| **1 juli** | MRB-, BPM- en soms km-vergoedingswijzigingen halverwege het jaar | MRB, BPM, tijdelijke regelingen |
| **Elke maand (optioneel)** | brandstof- en stroomprijs | CBS-prijzen verversen (zie stap 4) |
| **Elk kwartaal** | nieuwe registraties en APK-data | datasets verversen (stap 5) |

## Stappen

### 1. Laat het register zeggen wat aandacht vraagt
```bash
npm run regelcheck
```
Het commando toont: regels met status "onzeker" of "aangekondigd", waarden met een peildatum ouder dan 12 maanden, wettelijke regels zonder link, en tabellen voor een eerder jaar (bijv. `box1.schijven2026` in 2027). Met `npm run regelcheck -- 6` wordt de grens 6 maanden.

### 2. Controleer per onderwerp bij de primaire bron
Altijd de bron van de overheid zelf (wet, Belastingdienst, Rijksoverheid). Een site van een leasemaatschappij of adviseur is alleen een tweede bron, en dan krijgt de regel de status "onzeker".

| Onderwerp | Configsleutel | Primaire bron |
|---|---|---|
| MRB-tarieven en opcenten | `mrb.*` | wetten.overheid.nl (Wet MRB 1994 art. 23, 24b; Provinciewet art. 222), rekenhulp Belastingdienst |
| BPM | `bpm.*` | wetten.overheid.nl (Wet BPM 1992), Belastingdienst |
| Bijtelling en pseudo-eindheffing | `bijtelling.*`, `pseudoEindheffing*` | Belastingdienst (auto van de zaak), Belastingplan |
| Inkomstenbelasting, heffingskortingen | `box1.*` | Belastingdienst tarieventabellen |
| Vpb, box 2, gebruikelijk loon | `vpb.*`, `box2.*`, `dga.*` | Belastingdienst, KVK |
| KIA | `kia.*` | Wet IB 2001 art. 3.41–3.45, Belastingdienst |
| Km-vergoeding, btw-correctie | `zakelijk.*` | Belastingdienst |
| ZE-zones | `zezone.*` | Rijksoverheid / opwegnaarzes.nl, Kamerbrieven |
| Maximale kredietvergoeding | `krediet.*` | Besluit kredietvergoeding |

Per gewijzigde regel:
1. `waarde` aanpassen. Bij een nieuw jaar komt er een nieuwe sleutel bij, bijvoorbeeld `schijven2027`; de oude blijft staan.
2. `bron` (met URL), `geldigVanaf`, `peildatum` (vandaag) en `status` bijwerken.
3. De uitleg in gewone taal in `docs/regels-nl.md` bijwerken.
4. De voorbeeldberekening in de tests bijwerken. Het nieuwe bedrag reken je eerst met de hand na, met de tabel van de Belastingdienst ernaast (zie `tests/inkomstenbelasting.test.ts`).

### 3. Nieuw belastingjaar in de code
Op een paar plaatsen staat het jaar in de functienaam (`box1Belasting2026`, `vpb2026`, `kia2026`). Voor een nieuw jaar:
- voeg de tabellen van het nieuwe jaar toe aan het config;
- laat de functie het jaar kiezen op basis van de startdatum van de berekening;
- houd de oude tests: die horen ongewijzigd te blijven slagen.

### 4. Energieprijzen (CBS)
- Pompprijzen: CBS-tabel 80416NED, gemiddelde van de laatste 30 dagen → `aannames.energie.pompprijs`.
- Stroomprijs thuis: CBS gemiddelde energietarieven → `aannames.energie.stroomThuisPerKwh`.
- Publiek laden en snelladen zijn eigen aannames: bekijk of ze nog passen bij de markt.

### 5. Datasets verversen (RDW, Euro NCAP)
Draai deze commando's in deze volgorde. Ze halen alleen openbare data op en duren samen ongeveer een uur.
```bash
node scripts/selecteer-modellen.ts 50
```
```bash
node scripts/selecteer-modellen.ts 20 --bestel
```
```bash
npx vite-node --config vitest.config.ts scripts/haal-specs.ts
```
```bash
npx vite-node --config vitest.config.ts scripts/haal-occasions.ts
```
```bash
node scripts/haal-apk.ts
```
```bash
node scripts/haal-ncap.ts
```
Voor de bestelauto's draai je daarna `haal-specs`, `haal-occasions` en `haal-apk` nog een keer, nu met `--bestel` erachter, bijvoorbeeld:
```bash
npx vite-node --config vitest.config.ts scripts/haal-specs.ts --bestel
```
Verandert de top 50 of top 20, noteer dat dan in `docs/beslissingen.md`. De selectie blijft automatisch; we kiezen nooit handmatig.

### 6. Controleren en vastleggen
```bash
npm test
```
```bash
npm run typecheck
```
- Alle tests slagen, ook de **merkblinde test** en de **partner-invariantietest**.
- `VERSIE` in `src/regels/methodiek.ts` ophogen als de methodiek verandert.
- Een regel toevoegen in `docs/beslissingen.md`: wat er veranderd is, de bron, en wie het besloot.
- Bij grote wijzigingen de **toegankelijkheidscheck** opnieuw doen (`docs/toegankelijkheid.md`).
- Een commit met een duidelijk bericht, bijvoorbeeld "Regels 2027: box 1, bijtelling, MRB". Na de push zet Vercel het automatisch live.
- De methodiekpagina (`/methodiek`) toont de nieuwe peildatums vanzelf.

## Wie
Claude Code kan stap 1 tot en met 6 uitvoeren, maar mag nooit waarden uit het geheugen gebruiken (CLAUDE.md, principe 4). Adriaan beslist bij twijfel en keurt de commit goed. Zakelijke regels laat je bij voorkeur jaarlijks meelezen door een fiscalist. Dat gebeurt nu nog niet (besluit 69).
