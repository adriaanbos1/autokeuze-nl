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
> Nog te doen in Fase 2: **2c** Euro NCAP, onderhoud, banden, verzekering (bandbreedtes), verbruik van plug-in hybrides met lege accu; **2d** restwaarde- en occasion-curves (schatting) + offerteaanvragen restwaardedata.

- **Doel:** 40–60 populaire modellen in NL (selectie op basis van RDW-registraties per segment, dus objectief en niet door ons gekozen). Per model en motorisatie: prijs, specs, verbruik, Euro NCAP, onderhoud, restwaardecurve, verzekeringsklasse. RDW-koppeling: betrouwbaarheidsscore uit APK-gebreken, terugroepacties en specs. Optioneel: kenteken invoeren voor een occasion.
- **Wat jij kunt testen:** een tabelpagina met alle modellen, per waarde de bron en peildatum. Een "datadekking"-overzicht. Een kenteken-check van een willekeurige auto.
- **Omvang:** ca. 2–3 weken (groot; het handwerk zit in de eigen dataset).

### Fase 3: Web-app
- **Doel:** intake (gebruik, km/jaar, budget, gezin, laden thuis, zakelijk/privé, nieuw/occasion) → top 3 met uitleg en uitklapbare berekening → vergelijking van de financieringsscenario's met schuifjes. Mobiel eerst.
- **Wat jij kunt testen:** de volledige flow op je telefoon, via een Vercel-testlink.
- **Omvang:** ca. 2–3 weken (groot).

### Fase 4: Zakelijke module uitgediept
- **Doel:** ZZP'er (btw, KIA, financial lease zakelijk, bestelauto + ZE-zones), DGA/bv (Vpb, pseudo-eindheffing, auto privé vs. bv), leaserijder (budget, eigen bijdrage, 2026 vs. 2027-instap).
- **Wat jij kunt testen:** de zakelijke scenario's. Bij voorkeur ook laten narekenen door een fiscalist (aanrader).
- **Omvang:** ca. 1–2 weken (middel).

### Fase 5: Afronding
- **Doel:** publieke methodiekpagina, disclaimers, toegankelijkheid (WCAG 2.2 AA), voorbereiding op affiliates (aparte module + invariantietest), jaarlijkse regels-update-checklist, deploy op eigen domein.
- **Wat jij kunt testen:** de live site; een toegankelijkheidsrapport; de invariantietest.
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
