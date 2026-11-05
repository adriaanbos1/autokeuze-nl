# Bouwplan — AutoKeuze NL

*Versie 0.2, 3 november 2026. Status: plan goedgekeurd; Fase 1 gebouwd.*

## 1. Stack en hosting

**Keuze:** Next.js (React) met TypeScript, gehost op Vercel. De reken-engine is een losse TypeScript-module met Vitest-tests. Data en regels staan als versiebeheerde JSON/TS-bestanden in de repo (géén database in v1).

**In gewone taal:** Next.js is de meest gebruikte bouwdoos voor moderne websites. TypeScript is JavaScript met "spellingscontrole", zodat rekenfouten sneller opvallen. Omdat alle berekeningen in je browser draaien en we geen accounts of database hebben, is er niets om te beveiligen of te beheren, en slaan we geen persoonsgegevens op (privacy-eis). Vercel zet de site met één klik live, en elke wijziging krijgt automatisch een eigen testlink. RDW- en CBS-data halen we op bij het bouwen van de site en slaan we op als bestand. Zo zijn we niet afhankelijk van hun servers als er bezoekers zijn.

**Lokaal draaien (vanaf Fase 1):** `npm install` (eenmalig) en dan `npm run dev`. Tests: `npm test`.

**Verwachte kosten per maand**
| Post | Tijdens bouw | Bij livegang |
|---|---|---|
| Vercel | €0 (Hobby) | ca. €20 (Pro; Hobby is niet toegestaan voor commercieel gebruik) |
| Domeinnaam (.nl) | — | ca. €1 (≈ €10–15/jaar) |
| RDW / CBS data | €0 | €0 |
| Analytics (privacyvriendelijk, bijv. Plausible) | — | ca. €9, optioneel |
| **Totaal** | **€0** | **≈ €20–30** |

Alternatief bij krappe kosten: Cloudflare Pages (gratis, ook commercieel). Overstappen kan later zonder herbouw.

## 2. Fases

### Fase 1: Reken-engine (TCO + 4 financieringsvormen + fiscaal), met tests
> **Status 3-11-2026: gebouwd.** 58 tests groen. MRB gecontroleerd tegen de Belastingdienst (1.631/1.632 exact). Nog open: BPM brandstofauto's, heffingskortingen.

- **Doel:** een pure rekenmodule: TCO, contant / lening / financial lease met slottermijn / private lease; MRB, BPM, bijtelling (incl. 60-maandenregel, cap, eigen bijdrage), ZZP zakelijk vs. privé, btw-correctie, pseudo-eindheffing. Plus het configbestand `regels-nl` met bron en `geldig_vanaf` voor elke waarde. MRB-tabellen worden overgenomen uit de wet en getoetst tegen de Belastingdienst-rekentool.
- **Wat jij kunt testen:** `npm test` toont groene vinkjes per rekenvoorbeeld. De drie persona's uit `methodiek.md` zijn tests met precies dezelfde getallen. Daarnaast een simpele rekenpagina (geen opmaak) waar je zelf waarden invult.
- **Omvang:** ca. 1–2 weken (middel).

### Fase 2: Dataset v1
> **Status 3-11-2026: stap 2a gebouwd.** Objectieve selectie van 50 modellen, officiële RDW-specificaties per aandrijving, kentekencheck (incl. MRB en terugroepacties), pagina's `/modellen` en `/kenteken`.
> **Stap 2b gebouwd:** betrouwbaarheidsscore uit RDW-APK-gebreken voor alle 50 modellen (methodiek §2.2), zichtbaar op `/modellen` en bij de kentekencheck.
> **Stap 2c gebouwd (4-11-2026):** Euro NCAP-sterren voor alle 50 modellen, verbruik van plug-in hybrides met lege accu (afgeleid en gecontroleerd), rekenmodel onderhoud en banden, verzekering als marktgemiddelde of eigen premie (methodiek §2.3–2.5).
> **Stap 2d gebouwd (4-11-2026):** generieke restwaardecurve (forfaitaire BPM-tabel + km-correctie), occasionwaarde in de kentekencheck, concept-offerteaanvraag restwaardedata. **Fase 2 is hiermee afgerond.** Volgende: Fase 3 (web-app: intake → top 3).

- **Doel:** 40–60 populaire modellen in NL (selectie op basis van RDW-registraties per segment, dus objectief en niet door ons gekozen). Per model en motorisatie: prijs, specs, verbruik, Euro NCAP, onderhoud, restwaardecurve, verzekeringsklasse. RDW-koppeling: betrouwbaarheidsscore uit APK-gebreken, terugroepacties en specs. Optioneel: kenteken invoeren voor een occasion.
- **Wat jij kunt testen:** een tabelpagina met alle modellen, per waarde de bron en peildatum. Een "datadekking"-overzicht. Een kenteken-check van een willekeurige auto.
- **Omvang:** ca. 2–3 weken (groot; het handwerk zit in de eigen dataset).

### Fase 3: Web-app
- **Doel:** intake (gebruik, km/jaar, budget, gezin, laden thuis, zakelijk/privé, nieuw/occasion) → top 3 met uitleg en uitklapbare berekening → vergelijking van de financieringsscenario's met schuifjes. Mobiel eerst.
- **Wat jij kunt testen:** de volledige flow op je telefoon, via een Vercel-testlink.
- **Testlink (4-11-2026):** https://autokeuze-nl.vercel.app — automatisch bijgewerkt bij elke push naar `main`. **Fase 3 is hiermee afgerond.** Volgende: Fase 4 (zakelijke module uitgediept).
- **Deelstappen (4-11-2026, besluiten 40–43):**
  - **3a** ✅ gebouwd 4-11-2026: score-engine (alle criteria met vaste ankers, gewichten per profiel, schuifjes, herschaling bij ontbrekende data, merkneutrale tie-break) + intake → top 3 voor nieuwe auto's, particulier.
  - **3b** ✅ gebouwd 4-11-2026: occasions in de ranking (model + leeftijd + km, geschatte prijs).
  - **3c** ✅ gebouwd 4-11-2026: financieringsvergelijking met schuifjes: contant, lening, financial lease, private lease (offerte of eigen schatting).
  - **3d** ✅ gebouwd 4-11-2026: zakelijke basis in de intake (leaserijder, ZZP'er), mobiele afwerking, Vercel-testlink.
- **Omvang:** ca. 2–3 weken (groot).

### Fase 4: Zakelijke module uitgediept
- **Doel:** ZZP'er (btw, KIA, financial lease zakelijk, bestelauto + ZE-zones), DGA/bv (Vpb, pseudo-eindheffing, auto privé vs. bv), leaserijder (budget, eigen bijdrage, 2026 vs. 2027-instap).
- **Wat jij kunt testen:** de zakelijke scenario's. Bij voorkeur ook laten narekenen door een fiscalist (aanrader).
- **Deelstappen (4-11-2026, besluiten 67–70):**
  - **4a** ✅ gebouwd 4-11-2026: fiscale basis met bron: heffingskortingen 2026 (exacte inkomstenbelasting), bijtelling per jaar van eerste toelating 2016–2025 en de 60-maandenregel, KIA 2026, Vpb- en box 2-tarieven 2026.
  - **4b** ✅ gebouwd 4-11-2026: ZZP'er uitgediept: btw-aftrek en -correctie, KIA, financial lease en operational lease zakelijk, occasions.
  - **4c** ✅ gebouwd 4-11-2026: DGA/bv: auto in de bv vs. privé, met Vpb, box 2 en pseudo-eindheffing; eigen profiel in de intake.
  - **4d** ✅ gebouwd 4-11-2026: leaserijder uitgediept: leasebudget, eigen bijdrage, instap 2026 vs. 2027, occasions niet (lease is nieuw).
  - **4e** ✅ gebouwd 4-11-2026: bestelauto's: objectieve RDW-selectie, ZE-zones, MRB en BPM voor ondernemers, KIA.
  - Geen fiscalist (besluit 69): zakelijke uitkomsten met extra waarschuwing.
  - **Fase 4 is hiermee afgerond.** Volgende: Fase 5 (afronding).
- **Omvang:** ca. 1–2 weken (middel).

### Fase 5: Afronding
- **Doel:** publieke methodiekpagina, disclaimers, toegankelijkheid (WCAG 2.2 AA), voorbereiding op affiliates (aparte module + invariantietest), jaarlijkse regels-update-checklist, deploy op eigen domein.
- **Wat jij kunt testen:** de live site; een toegankelijkheidsrapport; de invariantietest.
- **Deelstappen (5-11-2026, besluiten 90–97):**
  - **5a** ✅ openbare methodiekpagina (`/methodiek`, automatisch uit het config) en pagina Over (disclaimer, privacy, bronnen en licenties).
  - **5b** ✅ toegankelijkheid WCAG 2.2 AA: automatische test 0 fouten, reparaties en rapport (`docs/toegankelijkheid.md`).
  - **5c** ✅ partnermodule (leeg, niet zichtbaar) met ranking-invariantietest.
  - **5d** ✅ checklist regelupdate + `npm run regelcheck`; stappenplan eigen domein; concept belangenvermelding.
  - Niet gedaan op verzoek: eigen domein (besluit 90), open source (91), belangenvermelding live (92).
  - **Fase 5 is hiermee afgerond.** Zie "Vóór de publieke lancering" hieronder.

### Vóór de publieke lancering (open punten)
1. Belangenvermelding kiezen en live zetten (`docs/belangenvermelding-concept.md`).
2. Contactadres voor meldingen.
3. Eigen domein (`docs/eigen-domein.md`).
4. Euro NCAP: toestemming of juridische bevestiging voor het noemen van sterren.
5. Regel over de werkgever uit CLAUDE.md halen als de repository openbaar wordt.
6. Test met een echte schermlezer.
7. Optioneel: fiscalist laat de zakelijke berekeningen nalezen; licentie op restwaardedata.
8. Vóór partnerlinks: juridische toets (Wft) en het label "Geld lenen kost geld" bij krediet.
- **Omvang:** ca. 1 week (klein–middel).

Totaal: grofweg 7–11 weken doorlooptijd, afhankelijk van feedbackrondes en de dataset.

## 3. Risico's

| Risico | Impact | Maatregel |
|---|---|---|
| **Schijn van belangenverstrengeling** (jij werkt bij een importeur) | hoog: dit raakt de kernbelofte | openbare methodiek, open-source engine, merkblinde audit-test, belangenvermelding op de site, eventueel externe review |
| Restwaardedata zonder licentie is een schatting | middel–hoog | duidelijk label "schatting"; later een licentie (Autotelex/Indicata) |
| Fiscale regels veranderen (minderheidskabinet, Belastingplan 2027) | middel | centraal config + statuslabels + jaarlijkse check per 1 januari en na Prinsjesdag |
| Wft: affiliate wordt bemiddeling | hoog (boete AFM) | geen data naar partners; alleen links; juridische toets vóór affiliates |
| Private lease onder de Wft (CCD2) | middel | ontwerp gaat nu al uit van de strengste regels |
| Euro NCAP/Consumentenbond licenties | laag–middel | geen logo's; feiten met bronlink; toestemming vragen |
| Te veel complexiteit voor gebruikers | middel | standaardwaarden, alles uitklapbaar in plaats van alles tegelijk |

## 4. Open vragen voor jou
Zie de chat (maximaal 5 vragen). Antwoorden worden vastgelegd in `beslissingen.md`.
