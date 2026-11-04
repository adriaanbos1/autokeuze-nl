# Fiscale en wettelijke regels NL — AutoKeuze NL

*Peildatum: 3 november 2026. Status: Fase 0.*

Dit document is de **menselijke uitleg** van het latere configbestand (`config/regels-nl.ts` of `.json`). Elke waarde krijgt daar een `bron`, `geldig_vanaf` en `status`.

Statuslabels:
- ✅ **vastgesteld** — in wet of besluit, of breed bevestigd door meerdere betrouwbare bronnen
- 🟡 **aangekondigd** — in Belastingplan/wetsvoorstel, nog niet definitief
- ⚠ **onzeker / te verifiëren** — bronnen spreken elkaar tegen, of alleen secundaire bron

> Belangrijke context: het Belastingplan 2027 (Prinsjesdag 2026) wordt behandeld door een **minderheidskabinet**. Niet alle plannen zijn zeker ([Athlon, 21-10-2026](https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/)). Vóór livegang (en ieder jaar op 1 januari) controleren we alles opnieuw tegen de Belastingdienst en wetten.nl.

---

## 1. Motorrijtuigenbelasting (MRB)

| Onderdeel | 2026 | 2027 | Status | Bron |
|---|---|---|---|---|
| Grondslag | Gewicht (rijklaar/massa ledig voertuig) + brandstofsoort, per kwartaal | idem | ✅ | Wet MRB 1994 |
| Korting volledig elektrische personenauto | 30% van het normale tarief | 30% | ✅ (2026) / 🟡 (2027) | [ANWB](https://www.anwb.nl/auto/elektrisch-rijden/kosten/wegenbelasting-elektrische-auto), [Athlon](https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/) |
| Afbouw EV-korting | 2028: 30% · 2029: 25% · 2030: 0% | | 🟡 | idem |
| Gewichtscorrectie voor EV-accu | onduidelijk | onderzoek naar andere grondslag dan gewicht | ⚠ bronnen spreken elkaar tegen | [AutoScout24](https://www.autoscout24.nl/informeren/advies/kosten-en-wetgeving/wegenbelasting-elektrische-auto-wat-je-moet-weten/), ANWB |
| Plug-in hybride (≤50 g/km) | **geen korting meer** (volledig tarief) | idem | ✅ | ANWB |
| Bestelauto ondernemer / lichte vracht tijdelijke korting | loopt | vervalt per 1-1-2027 | 🟡 | Athlon |
| Provinciale opcenten | 82,1 (N-Holland) t/m 104,4 (Z-Holland); max 143,9; over een eigen grondslag (art. 222 Provinciewet) | jaarlijks vastgesteld | ✅ | [CBS 80889ned](https://www.cbs.nl/nl-nl/cijfers/detail/80889ned) |

**Implementatie (Fase 1, gedaan):** in `src/regels/regels-nl.ts` staan:
- rijksdeel, dieseltoeslag en toeslag overige brandstoffen, letterlijk uit art. 23 Wet MRB 1994 (versie vanaf 1-7-2026). **Sinds 1 juli 2026 gaat de MRB uit van de massa rijklaar** (afgerond op 100 kg, precies 50 kg naar beneden), daarvoor van de eigen massa (rijklaar − 100 kg);
- fijnstoftoeslag diesel +19% (art. 23 lid 4–5);
- EV-percentage per jaar (art. 23b): 70% in 2026–2028, 75% in 2029, de bepaling vervalt per 2030. Dit werkt ook door in de opcenten;
- opcenten per provincie 2026 uit CBS 80889ned (o.a. Utrecht 86,4, Limburg 88,5);
- de opcenten worden niet over het rijksdeel berekend, maar over een **eigen, lagere grondslag** (art. 222 lid 3 Provinciewet: €45,81 + €11,68 per 100 kg boven 1.100 kg);
- het totaal per kwartaal wordt pas aan het eind naar beneden afgerond op hele euro's (de opcenten niet tussentijds afronden).

**Controle tegen de Belastingdienst (3-11-2026)** ✅: de officiële rekentool ([hulpmiddel MRB berekenen](https://www.belastingdienst.nl/wps/wcm/connect/nl/auto-en-vervoer/content/hulpmiddel-motorrijtuigenbelasting-berekenen)) bevat per provincie de bedragen voor alle gewichtsklassen. Die staan als referentie in `tests/fixtures/belastingdienst-mrb.json`. Uitkomst: **1.631 van de 1.632 combinaties** (12 provincies × gewicht 651–4.050 kg × benzine/diesel/elektrisch/LPG) kloppen tot op de euro. Bekende uitzonderingen:
- Noord-Brabant, LPG, 3.300 kg: wij €1.315 (exact €1.315,9999), Belastingdienst €1.316. Vermoedelijk afrondingsruis in de rekentool zelf.
- Klasse ≤ 650 kg: de Belastingdienst komt tot €1 lager uit; de oorzaak is onbekend. Dit is niet relevant, want er bestaan geen personenauto's van ≤ 650 kg rijklaar.
- LPG3/aardgas (af-fabriek-installatie) zit nog niet in de engine.

## 2. BPM (aanschafbelasting)

| Onderdeel | 2026 | Status | Bron |
|---|---|---|---|
| Emissievrije personenauto | vast bedrag **€687** (2025: €667); geen CO₂-deel | ✅ | [ANWB](https://www.anwb.nl/auto/autobelastingen/bpm), [Meijburg](https://www.meijburg.com/sites/default/files/2025-12/wijzigingen-belastingplan-2026_esg.pdf) |
| Brandstofauto | vaste voet + bedrag per gram CO₂ in schijven; schijfgrenzen in 2026 aangescherpt; dieseltoeslag | ✅ structuur / ⚠ bedragen nog over te nemen | Wet BPM 1992 art. 9 |
| Bestelauto ondernemer, emissievrij | geen BPM | ✅ | VNA-samenvatting Belastingplan 2026 |
| Toekomst | Vervanging door tenaamstellingsbelasting gaat **niet** door; vereenvoudiging wordt onderzocht | 🟡 | Athlon |

**Forfaitaire afschrijvingstabel gebruikte auto's** ✅ vastgesteld (art. 10 lid 2 Wet BPM 1992; tabel op [Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/nl/bpm/content/bpm-afschrijving-koerslijst-taxatierapport-forfaitaire-tabel), gelezen 4-11-2026). Per periode na eerste toelating een basispercentage plus een percentage per begonnen maand: 0–1 mnd 0% (+12%/mnd) · 1–3 mnd 12% (+4%) · 3–5 mnd 20% (+3,5%) · 5–9 mnd 27% (+1,5%) · 9–18 mnd 33% (+1%) · 18–30 mnd 42% (+0,75%) · 30–42 mnd 51% (+0,5%) · 42–54 mnd 57% (+0,42%) · 54–66 mnd 62% (+0,42%) · 66–78 mnd 67% (+0,42%) · 78–90 mnd 72% (+0,25%) · 90–102 mnd 75% (+0,25%) · 102–114 mnd 78% (+0,25%) · vanaf 114 mnd 81% (+0,19%); vanaf 17 jaar en 10 maanden 100%. Rekenvoorbeeld Belastingdienst: ruim 14 maanden → 39% (in `tests/restwaarde.test.ts`). ⚠ Laatst aangepast per 1-7-2012 volgens secundaire bronnen. In de app gebruiken we de tabel ook als algemene restwaardecurve (`methodiek.md` §2.1).

**Voor de app:** BPM zit in de catalogusprijs van een nieuwe auto. We hebben haar vooral nodig voor (a) uitleg van de prijsopbouw en (b) de cataloguswaarde voor de bijtelling (incl. btw en BPM).

## 3. Bijtelling (auto van de zaak)

| Onderdeel | Waarde | Status | Bron |
|---|---|---|---|
| Standaard | **22%** van de cataloguswaarde (incl. btw + BPM) | ✅ | [SRA advieswijzer 2026](https://www.sra.nl/nieuws/000000/advieswijzers/advieswijzer-auto-zakelijk-of-prive-2026) |
| EV, eerste toelating 2026 | **18% tot €30.000**, 22% daarboven (max. voordeel €1.200/jr) | ✅ | SRA, [Athlon](https://www.athlon.com/nl/kennisbank/bijtelling-2026/) |
| EV, eerste toelating 2027 | **20% tot €30.000**, 22% daarboven (max. voordeel €600/jr) | ✅ aangenomen | Athlon (21-10-2026) |
| EV, eerste toelating vanaf 2028 | 22% over alles | ✅ | idem |
| Waterstof / zonnecel-auto | 2026: 18% zonder cap; 2027: 20% zonder cap | ✅ | SRA |
| 60-maandenregel | percentage ligt 60 maanden vast vanaf eerste toelating; daarna het dan geldende percentage | ✅ | SRA |
| Youngtimer (oude auto) | 2026: oude auto's: 35% van de dagwaarde (⚠ leeftijdsgrens: bronnen noemen 15 resp. 16 jaar). 2027: grens 17 jaar, 2028: 20 jaar (eerder plan van 25 jaar vervalt) | ✅ 2026 / 🟡 2027+ (SRA noemt nog 25 jaar, Athlon de nieuwere 17/20) | SRA, Athlon |
| "Greentimer" | vanaf 2029: 14% voor EV's van 5–8 jaar oud, max. 3 jaar | 🟡 niet definitief | Athlon |
| Eigen bijdrage werknemer | verlaagt de bijtelling euro voor euro (niet onder nul) | ✅ (⚠ bron in config nog toevoegen) | Belastingdienst |
| Geen bijtelling | aantoonbaar ≤ 500 km privé per kalenderjaar (rittenregistratie) of "verklaring geen privégebruik" | ✅ | SRA, [KvK](https://www.kvk.nl/geldzaken/auto-van-de-zaak-of-prive/) |

### Nieuw per 2027: pseudo-eindheffing ✅ aangenomen
- Werkgever betaalt **12% van de catalogusprijs per jaar** voor *nieuw* ter beschikking gestelde personenauto's **met CO₂-uitstoot** (benzine, diesel, (plug-in) hybride) die privé gebruikt mogen worden. Geldt ook voor de **DGA/bv**. Werkgever mag dit niet doorberekenen aan de werknemer.
- Overgangsregeling: auto's die vóór 1-1-2027 al ter beschikking stonden, vallen er pas vanaf 2031 onder (datum ⚠: 17-9-2030 of 1-1-2031; het kabinet wil 1-1-2031).
- **Niet** van toepassing op de eenmanszaak-ondernemer zelf.
- Bron: [Athlon](https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/), SRA.
- **Gevolg voor de app:** voor de leaserijder en de DGA wordt een brandstofauto vanaf 2027 voor de werkgever/bv flink duurder. Dat beïnvloedt leasebudgetten. We tonen dit als werkgeverskosten, los van de netto bijtelling.

## 4. Zakelijk rijden — ZZP'er / eenmanszaak (IB-ondernemer)

| Regel | Waarde | Status |
|---|---|---|
| Keuze vermogen | auto zakelijk (ondernemingsvermogen) of privé, één keer per auto bij aanschaf | ✅ |
| Verplicht zakelijk | privégebruik ≤ 500 km/jr | ✅ |
| Verplicht privé | zakelijk gebruik < 10% | ✅ |
| Bijtelling bij zakelijke auto | zelfde percentages als §3; **begrensd tot de werkelijke autokosten** in dat jaar (incl. afschrijving) | ✅ |
| Woon-werkverkeer | telt voor de inkomstenbelasting als **zakelijk**; voor de btw als **privé** | ✅ |
| Privé-auto, zakelijke km | **€0,25 per zakelijke km** aftrekbaar (2026; was €0,23) | ✅ (met terugwerkende kracht per 1-1-2026, via beleidsbesluit; wettelijk vastgelegd in Belastingplan 2027) |
| Btw-correctie privégebruik (forfait) | **2,7%** van de catalogusprijs per jaar; **1,5%** vanaf het 5e jaar na ingebruikname, of als er geen btw is afgetrokken | ✅ |
| Afschrijving | lineair over gebruiksduur tot restwaarde (meestal 5 jaar) | ✅ (gangbare praktijk; exacte termijn per situatie) |
| KIA (kleinschaligheidsinvesteringsaftrek) | 2026: investeringen tussen ca. €2.901 en €392.230; **personenauto's zijn in principe uitgesloten**, behalve o.a. emissievrije personenauto's en taxi's; bestelauto's wél | ⚠ uitzondering voor emissievrije personenauto's te verifiëren · 2027 mogelijk versoberd 🟡 |
| MIA (milieu-investeringsaftrek) 2026 | alleen nog waterstofauto (45% over 90%, max €75.000) en zonnecel-auto (36% over 90%, max €100.000); gewone EV **niet** | ✅ (SRA) |
| Ondernemersaftrek / MKB-winstvrijstelling | bepaalt het *effectieve* belastingvoordeel van elke aftrekpost | ⚠ bedragen 2026 nog op te nemen in config |
| Box 1-tarieven 2026 | nodig voor het marginale tarief | ⚠ nog op te nemen in config (niet uit geheugen) |

Bronnen: [SRA advieswijzer 2026](https://www.sra.nl/nieuws/000000/advieswijzers/advieswijzer-auto-zakelijk-of-prive-2026), [Accountancy van Morgen, 27-5-2026](https://www.accountancyvanmorgen.nl/2026/05/27/belastingdienst-licht-verwerking-hogere-onbelaste-kilometervergoeding-in-loonaangifte-toe/), [Knab](https://bieb.knab.nl/ondernemen/zakelijk-rijden-dit-zijn-de-belastingregels?hsLang=nl), [MKB Servicedesk KIA](https://www.mkbservicedesk.nl/belastingen/aftrekposten/wat-is-de-kleinschaligheidsinvesteringsaftrek-kia).

## 5. DGA / bv

| Regel | Waarde | Status |
|---|---|---|
| Auto van de bv | privégebruik belast als loon (bijtelling via loonbelasting), zelfde percentages | ✅ |
| Bv-auto privé maken | alleen door verkoop aan de DGA (tegen marktwaarde; btw-discussie loopt bij de Hoge Raad) | ✅ / ⚠ btw-punt |
| DGA rijdt privéauto voor de bv | bv mag €0,25/km onbelast vergoeden | ✅ |
| Pseudo-eindheffing vanaf 2027 | 12% per jaar voor nieuwe CO₂-auto's ter beschikking gesteld aan de DGA | ✅ aangenomen |
| Vennootschapsbelasting-effect | autokosten aftrekbaar in de Vpb; netto voordeel hangt af van het Vpb-tarief + box 2-gevolgen | ⚠ tarieven in config |

**v1-advies:** DGA eerst als "light" scenario (bijtelling + pseudo-eindheffing + km-vergoeding). Een volledige Vpb/box 2-doorrekening pas in Fase 4.

## 6. Financieringsvormen (particulier)

| Vorm | Wat is het juridisch | BKR | Toezicht |
|---|---|---|---|
| **Private lease** (zonder koopoptie) | huur/gebruik; geen eigendom | In de praktijk **altijd geregistreerd** bij leden van het Keurmerk Private Lease; zichtbaar tot 5 jaar na einde contract ([Consumentenbond](https://www.consumentenbond.nl/private-lease/leasebedrag-verlagen-voor-je-hypotheek)) | Valt nu **niet** onder de Wft; zelfregulering via Keurmerk. ⚠ **Plan om private lease onder de Wft te brengen** (implementatie CCD2, Europese deadline 20-11-2026); status van de Nederlandse wet niet bevestigd |
| **Private lease met koopoptie/-plicht** | krediet | ja | Valt onder CCD2 → Wft 🟡 |
| **Financial lease / huurkoop** (particulier) | koop op afbetaling; eigendom gaat over na laatste termijn (incl. eventuele **slottermijn**) | ja | Wft consumentenkrediet ✅; maximale kredietvergoeding ⚠ actuele waarde opzoeken |
| **Persoonlijke lening** | krediet; auto direct eigendom | ja | Wft ✅ |
| **Contant** | geen krediet | nee | — |

Effect op hypotheek: geldverstrekkers rekenen een private-leasebedrag mee als maandlast (de NVB-gedragscode noemt dit expliciet). Het is goed om de gebruiker hierop te wijzen, zonder advies te geven.

## 7. Zakelijke financiering
- **Operational lease (zakelijk):** leasemaatschappij is eigenaar; vaste maandprijs incl. onderhoud/verzekering/MRB; bijtelling voor de rijder.
- **Financial lease (zakelijk):** ondernemer is economisch eigenaar, schrijft af, trekt rente af; slottermijn mogelijk. Geen Wft (zakelijk krediet).
- ZZP'er: btw op leasetermijnen aftrekbaar (operational) vs. btw op aanschaf in één keer (financial lease/koop). ⚠ uitwerken in Fase 4.

## 8. Wft: wat mag een vergelijkingstool zonder vergunning?

**Kern (Wft art. 1:1 en 2:80; AFM-interpretatie "bemiddelen"):**
- ✅ **Mag zonder vergunning:** algemene informatie geven, doorrekenen en vergelijken op basis van gegevens die de gebruiker invult, *zolang die gegevens niet aan een aanbieder worden doorgegeven* en de tool niet meewerkt aan het afsluiten van een kredietovereenkomst.
- ✅ **Doorverwijzen** met een gewone link, of het doorgeven van **alleen contactgegevens** (naam, adres, telefoon, e-mail), geldt volgens de AFM **niet** als bemiddelen ([Dirkzwager](https://www.dirkzwager.nl/kennis/artikelen/lead-generation-pas-op-voor-bemiddeling), [AFM interpretatie bemiddelen](https://www.afm.nl/~/profmedia/files/wet-regelgeving/beleidsuitingen/interpretaties/bemiddelen.pdf)).
- ❌ **Wél bemiddelen (vergunningplichtig):** relevante klantgegevens inwinnen (inkomen, gewenste looptijd, kenteken, budget) **én** die doorsturen naar een kredietaanbieder, zeker als je daarvoor betaald krijgt. Betaling door de aanbieder is een aanwijzing voor bemiddeling.
- ❌ **Advies:** een persoonlijke aanbeveling ("voor jou is lening X het beste") is advies → vergunningplichtig. Wij formuleren daarom: *"In dit scenario is X goedkoper"*.
- ⚠ Private lease valt nu niet onder de Wft. Als de CCD2-implementatie dat verandert, gelden dezelfde regels ook daarvoor. De architectuur gaat daarom nu al uit van de strengste variant.

**Gevolg voor het ontwerp (belangrijk voor het verdienmodel):**
1. Intakegegevens blijven in de browser en worden **nooit** naar partners gestuurd.
2. Partnerknoppen zijn platte doorverwijslinks (eventueel met een affiliate-code, zonder profieldata).
3. Geen "aanvraag via ons" voor krediet of lease. Willen we later echte leads verkopen, dan is een **AFM-vergunning** (of een vergunde partner) nodig. Dat is een productbeslissing (zie vragen in `plan.md`).
4. ⚠ Juridische toets door een Wft-jurist vóór livegang van de affiliatefunctie.

**Concept-disclaimer (ter goedkeuring):**
> AutoKeuze NL is een onafhankelijke rekentool. De uitkomsten zijn scenario's op basis van jouw invoer, openbare gegevens en aannames die we bij elke berekening tonen. Dit is **geen financieel advies** en geen advies in de zin van de Wet op het financieel toezicht. Wij bemiddelen niet in krediet, lease of verzekeringen. Bedragen zijn indicatief; fiscale regels kunnen wijzigen. Laat je bij een definitief besluit adviseren door een erkend adviseur. Commerciële partners hebben geen invloed op de rangschikking; links naar partners zijn als zodanig gemarkeerd en verschijnen pas ná de vergelijking. Geld lenen kost geld.

("Geld lenen kost geld" is verplicht bij reclame voor krediet; we nemen het op zodra er kredietpartners zichtbaar zijn.)

## 9. Zero-emissiezones (ZE-zones) en milieuzones

| Voertuig | Regel | Status |
|---|---|---|
| Personenauto | **geen** ZE-zone-regels; wel milieuzones (diesel) in o.a. Amsterdam, Den Haag, Utrecht, Arnhem | ✅ ([KvK](https://www.kvk.nl/duurzaamheid/zero-emissiezones-kom-je-straks-de-stad-nog-in-met-je-auto/)) |
| Bestelauto Euro 5 (overgangsregeling) | toegang tot **1-1-2027** | ✅ |
| Bestelauto Euro 6 (overgangsregeling) | tot 1-1-2028; kabinet wil verlengen tot **1-1-2029** | 🟡 ([Eerste Kamer, brief 22-10-2026](https://www.eerstekamer.nl/brief_in/20261022/verlenging_overgangsregeling_nul/f=/vn20fauaq8hf.pdf)) |
| Nieuwe bestelauto op fossiele brandstof (ingeschreven ≥ 2025) | geen toegang | ✅ |
| Per gemeente | eigen invoerdatum en zonegrenzen | via [opwegnaarzes.nl](https://opwegnaarzes.nl) |

**v1:** personenauto's centraal; een ZE-zone-melding alleen bij bestelauto's (relevant voor ZZP'ers, Fase 4).

## 10. Overige relevante wijzigingen
- **Accijns:** korting op benzine/diesel verlengd tot 1-1-2028, daarna verlaagd 🟡. Effect op de brandstofprijs-aanname vanaf 2028.
- **Salderen** stopt per 1-1-2027 ✅ (laden met eigen zonnestroom wordt relatief duurder).
- **Laadpunten:** nieuwe laadpunten moeten ISO 15118-20 ondersteunen (slim en bidirectioneel laden). Voor de app alleen informatief.

## 10a. WLTP-weging plug-in hybrides (utility factor) ✅ vastgesteld
- Bron: [Verordening (EU) 2023/443](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R0443), bijlage XXI punt 3.2, tabel A8.App5/1 (gelezen 4-11-2026).
- Coëfficiënten C1–C10: 26,25 · −38,94 · −631,05 · 5.964,83 · −25.095 · 60.380,2 · −87.517 · 75.513,8 · −35.749 · 7.154,94.
- Normaalafstand: dnea 800 km (Euro 6e), dneb 2.200 km vanaf 1-1-2025 (Euro 6e-bis), dnec 4.260 km vanaf 1-1-2027 (Euro 6e-bis-FCM). De waarde volgt de emissiecode EA/EB/EC van de auto; RDW toont die in `uitlaatemissieniveau`.
- ⚠ De vergelijking zelf staat in de verordening als afbeelding; wij gebruiken de standaardvorm uit VN-GTR 15. Die vorm is bevestigd door de controle tegen 2.178 RDW-auto's (`methodiek.md` §2.4).
- Waarom het ertoe doet: met de strengere normaalafstand telt de regel minder kilometers als elektrisch, dus stijgen het gewogen verbruik en de CO₂ op papier. Folderwaarden van plug-in hybrides uit verschillende jaren zijn daardoor niet direct vergelijkbaar.
- In de code: `regels.wltp.utilityFactor` in `src/regels/regels-nl.ts`.

## 11. Configbestand (voorstel structuur)
```yaml
- sleutel: mrb.ev_korting
  waarde: { 2026: 0.30, 2027: 0.30, 2028: 0.30, 2029: 0.25, 2030: 0.0 }
  status: vastgesteld_2026_aangekondigd_daarna
  bron: https://www.anwb.nl/auto/elektrisch-rijden/kosten/wegenbelasting-elektrische-auto
  geldig_vanaf: 2026-01-01
  peildatum: 2026-11-03
  toelichting: "Afbouw na 2028 nog niet definitief (minderheidskabinet)."
```
(Een voorbeeld van het formaat; nog geen code.)
