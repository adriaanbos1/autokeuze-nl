# Databronnen — AutoKeuze NL

*Peildatum onderzoek: 3 november 2026. Status: Fase 0, ter goedkeuring.*

Dit document zegt per criterium waar de data vandaan kan komen, en per bron wat die levert, hoe betrouwbaar die is, wat ze kost en of we haar commercieel mogen gebruiken. Waar iets niet is bevestigd staat **⚠ te verifiëren**.

Legenda kosten: 🟢 gratis · 🟡 gratis met voorwaarden / op aanvraag · 🔴 betaald (offerte nodig)

---

## 1. Overzicht per criterium

| Criterium | Beste v1-bron (gratis) | Later / betaald | Tijdelijk: eigen dataset |
|---|---|---|---|
| Betrouwbaarheid | RDW APK-gebreken + terugroepacties (eigen analyse) | TÜV Report, ADAC Pannenstatistik (licentie), Consumentenbond | Score per model/bouwjaar uit RDW-data, aangevuld met *verwijzing* naar openbare rapporten |
| Onderhoud/reparatie | — (geen open bron) | Onderhoudsdata van leasemaatschappijen / dealerprijzen | Onderhoudsschema's uit openbare fabrieksinformatie + uurtarief-aanname |
| Restwaarde | — (geen open bron) | Autotelex, Indicata, VWE | Curves uit openbare occasionprijzen (steekproef), met bronvermelding |
| TCO: brandstof | CBS pompprijzen (dagelijks, open data) | — | — |
| TCO: stroom/laden | Energiebelasting (Belastingdienst), prijsvergelijkers als indicatie | Laadpasdata (bijv. via laadpasaanbieders) | Standaardwaarde thuis/publiek, door gebruiker aan te passen |
| TCO: MRB, BPM, bijtelling | Wetteksten + Belastingdienst + CBS opcenten | — | Centraal configbestand (`regels-nl.md`) |
| TCO: verzekering | — | Verzekeraars / vergelijkers (licentie) | Bandbreedtes per autoklasse, duidelijk "indicatief" |
| TCO: banden | — | — | Bandenmaat (RDW) × prijsband per maat |
| Praktische specs | RDW voertuigdata (gewicht, trekgewicht, zitplaatsen, brandstof, CO₂) | Specdatabases (Autotelex, JATO) | Bagageruimte, actieradius WLTP, laadsnelheid uit fabrieksopgave |
| Veiligheid | Euro NCAP (feitelijke sterren noemen, ⚠ logo niet) | Euro NCAP-toestemming voor logo/detailscores | — |
| Emissie/energie | RDW (CO₂, brandstof, emissieklasse) | — | — |

---

## 2. Bronnen in detail

### 2.1 RDW Open Data 🟢
- **Wat:** alle Nederlandse kentekens met technische gegevens; APK-keuringen en geconstateerde gebreken per kenteken; terugroepacties en hun status per kenteken.
- **Relevante datasets** (portal `opendata.rdw.nl`, techniek: Socrata-API):
  - `Gekentekende_voertuigen` — id `m9d7-ebf2` — merk, handelsbenaming, datum eerste toelating, massa, trekgewicht, zitplaatsen, catalogusprijs. Licentie **CC-0** (vrij, ook commercieel). [data.overheid.nl](https://data.overheid.nl/dataset/11441-open-data-rdw--gekentekende-voertuigen)
  - Brandstofgegevens (CO₂, verbruik, emissieklasse) — aparte dataset, koppelen op kenteken.
  - `Geconstateerde_gebreken` — id `a34c-vvps` (gebreken per kenteken) + `Gebreken` (omschrijvingen). ⚠ licentie per dataset te verifiëren (verwachting CC-0, zoals de rest).
  - `Terugroep_actie_status` — id `t49b-isb7` — CC-0, laatst bijgewerkt juli 2026. Plus `Terugroep_actie` en `Terugroep_actie_risico`. [RDW](https://opendata.rdw.nl/api/views/t49b-isb7)
- **Kwaliteit:** hoog en volledig (wettelijke registratie). Let op: APK-gebreken zeggen iets over slijtage en onderhoud, niet direct over pech. Terugroepacties staan soms nog als "open" terwijl ze al zijn uitgevoerd ([Autoblog](https://www.autoblog.nl/nieuws/mijn-auto-is-prima-maar-van-de-rdw-moet-hij-van-de-weg-af)).
- **Toegang:** gratis API (JSON/CSV), zonder sleutel. Bij veel verkeer is een gratis "app token" nodig.
- **Update:** dagelijks.
- **Gebruik in v1:** ja, de kern van onze eigen betrouwbaarheidsscore: *aandeel voertuigen met gebreken per APK, per model × bouwjaar × km*, gecorrigeerd voor leeftijd. Wij rekenen dat zelf uit, dus geen licentieprobleem.

### 2.2 Euro NCAP 🟡
- **Wat:** veiligheidssterren (0–5) en deelscores (inzittenden, kinderen, kwetsbare weggebruikers, assistentiesystemen) per model en testjaar.
- **Kwaliteit:** de Europese standaard. Let op: sterren uit verschillende testjaren zijn niet goed vergelijkbaar, want het protocol wordt steeds strenger.
- **Voorwaarden:** logo's, beeld en video mogen **niet** commercieel gebruikt worden zonder schriftelijke toestemming. Herpublicatie van materiaal buiten niet-commercieel/educatief gebruik vraagt toestemming ([Euro NCAP pers](https://www.euroncap.com/nl/pers), [protocol star rating v2.0](https://www.euroncap.com/media/88384/euro-ncap-protocol-application-of-star-rating-v20.pdf)). Het feitelijk noemen van "5 sterren (2024)" met bronlink valt waarschijnlijk onder normaal citeren, maar ⚠ dat laten we juridisch bevestigen, of we vragen toestemming.
- **Toegang:** geen publieke API; handmatig overnemen (40–60 modellen is goed te doen).
- **Update:** meerdere testrondes per jaar.
- **v1:** sterren + testjaar als tekst met bronlink, geen logo. Toestemming aanvragen = actiepunt.

### 2.3 ANWB 🟡
- **Wat:** autotests, kostenoverzichten, rekenhulpen voor MRB en bijtelling, pechhulpcijfers.
- **Kwaliteit:** goed, Nederlands, consumentgericht. Methodiek van autokosten niet volledig openbaar.
- **Voorwaarden:** auteursrecht; overnemen van data niet zonder toestemming. Bruikbaar als **controlebron** (onze uitkomsten narekenen) en om naar te linken.
- **v1:** alleen als referentie/controle.

### 2.4 Consumentenbond — Autobetrouwbaarheidsonderzoek 🔴/🟡
- **Wat:** jaarlijkse enquête onder ca. 7.000 eigenaren van auto's tot 10 jaar oud; betrouwbaarheid per merk en model ([Consumentenbond, jan 2026](https://www.consumentenbond.nl/nieuws/2026/consumentenbond-onderzoekt-betrouwbaarheid-autos.-japan-regeert-china-verrast)).
- **Kwaliteit:** goed voor de NL-markt, maar zelfrapportage en kleine aantallen per model.
- **Voorwaarden:** detailresultaten achter betaalmuur; commercieel hergebruik alleen met licentie.
- **v1:** niet overnemen. Later eventueel licentie of samenwerking.

### 2.5 TÜV Report (Duitsland) 🔴
- **Wat:** afkeurpercentages bij de Duitse APK (HU) per model en leeftijdsklasse; editie 2026 gebaseerd op ca. 9,5 miljoen keuringen ([Auto Bild](https://www.autobild.de/artikel/tuev-report-2026-tops-und-flops-28424531.html), [TÜV SÜD](https://www.tuvsud.com/de-de/publikationen/tuev-report)).
- **Kwaliteit:** groot en objectief, maar de Duitse vloot en het Duitse gebruik wijken af van de Nederlandse.
- **Voorwaarden:** commercieel uitgegeven (tijdschrift); geen open licentie gevonden. ⚠ licentie navragen.
- **v1:** niet. Onze RDW-analyse is het Nederlandse equivalent en vrij bruikbaar.

### 2.6 ADAC Pannenstatistik (Duitsland) 🔴
- **Wat:** pechgevallen per model/bouwjaar (2–9 jaar oud), ca. 158 modellen; editie 2026 over pechjaar 2025 ([ADAC](https://www.adac.de/rund-ums-fahrzeug/unfall/adac-pannenstatistik/)).
- **Kwaliteit:** goed voor "pech onderweg" (aanvulling op APK-gebreken). Alleen modellen met voldoende registraties in Duitsland.
- **Voorwaarden:** auteursrecht ADAC; ⚠ licentie navragen.
- **v1:** niet overnemen; eventueel later als tweede betrouwbaarheidsbron.

### 2.7 Restwaarde en prijzen: Autotelex, Indicata, VWE, Autodisk 🔴
- **Autotelex:** dé NL-referentie voor nieuwprijzen, specificaties, inruil- en handelswaarde (sinds 1964; ook gebruikt door de Belastingdienst-praktijk). B2B-licentie, prijs op aanvraag ([CarCollect-integratie](https://carcollect.com/integrations/autotelex)).
- **Indicata (Autorola):** marktprijzen op basis van live advertentiedata, ook internationaal. B2B, prijs op aanvraag.
- **VWE / Autodisk:** kentekengebaseerde voertuig- en waardedata voor de autobranche. B2B, prijs op aanvraag. ⚠ geen openbare prijzen gevonden.
- **Indicatie kosten:** op basis van vergelijkbare diensten vermoedelijk honderden tot enkele duizenden euro's per maand. ⚠ offertes nodig.
- **Openbare occasionprijzen** (advertentiesites): het scrapen van advertenties is meestal in strijd met de gebruiksvoorwaarden en de databankenwet. **Niet scrapen.** Wel mogelijk: een kleine, handmatige steekproef van vraagprijzen per model/bouwjaar voor onze eigen afschrijvingscurve, met peildatum en vermelding "gebaseerd op een steekproef van N advertenties". ⚠ juridisch laten toetsen.
- **v1:** eigen curves (zie `methodiek.md` §3), duidelijk gemarkeerd als *schatting*. **Later:** licentie bij één aanbieder. Dit is de grootste kwaliteitswinst die met geld te koop is.

### 2.8 Brandstofprijzen — CBS 🟢
- **Wat:** gewogen gemiddelde dagprijzen Euro95, diesel en LPG, incl. btw en accijns. Tabel `80416ned` ([CBS](https://www.cbs.nl/nl-nl/cijfers/detail/80416ned)).
- **Kwaliteit:** hoog (gebaseerd op tankpasdata van Travelcard). Publicatie per week.
- **Toegang:** gratis OData-API `https://opendata.cbs.nl/ODataApi/OData/80416ned`. Licentie **CC-BY 4.0** (commercieel toegestaan met bronvermelding).
- **Ter info:** eind juli 2026 kostte Euro95 ca. €2,38/l en diesel ca. €2,39/l (hoog door de crisis in het Midden-Oosten).
- **v1:** ja. We gebruiken het gemiddelde van de afgelopen 3 maanden als standaardwaarde, en de gebruiker kan die aanpassen.

### 2.9 Stroomprijzen en laden 🟡
- **Thuisladen:** all-in kWh-prijs zomer 2026 grofweg €0,24–0,30 (variabel contract), afhankelijk van bron en peildatum ([Consumentenbond](https://www.consumentenbond.nl/energie-vergelijken/kwh-prijs), [Energievergelijk](https://www.energievergelijk.nl/energieprijzen/stroomprijs)). Energiebelasting 2026: €0,1108/kWh incl. btw (eerste schijf). Er is geen officieel CBS-maandgemiddelde voor consumenten gevonden. ⚠ ACM/CBS nog controleren.
- **Salderen** stopt per 1-1-2027 ([Athlon](https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/)). Daardoor wordt laden met eigen zonnepanelen relatief minder voordelig: een aanname die we apart moeten tonen.
- **Publiek laden:** er bestaat geen open bron met gemiddelde prijzen. Standaard €0,55/kWh (AC) en €0,75/kWh (snelladen) als *aanname*, aan te passen. ⚠ onderbouwen met een steekproef.
- **v1:** standaardwaarden + schuifjes (thuis %, publiek %, snelladen %, eigen kWh-prijs).

### 2.10 MRB-opcenten per provincie — CBS 🟢
- Tabel `80889ned` ([CBS](https://www.cbs.nl/nl-nl/cijfers/detail/80889ned)), licentie CC-BY. In 2026 van 82,1 (Noord-Holland) tot 104,4 (Zuid-Holland). Jaarlijkse update.
- **v1:** ja; de gebruiker kiest een provincie.

### 2.11 Verzekering 🔴
- Er bestaat geen open bron. Premies hangen sterk af van leeftijd, woonplaats, schadevrije jaren en dekking. Vergelijkers (Independer e.d.) bieden alleen commerciële samenwerkingen, en die zouden de neutraliteit raken.
- **v1:** **indicatieve bandbreedte** per autoklasse en dekking (WA / WA+ / allrisk), samengesteld uit openbare voorbeeldpremies, met label "indicatief, vraag zelf een offerte aan". Gebruiker kan eigen premie invullen.

### 2.12 Banden en onderhoud 🔴/eigen
- **Banden:** bandenmaat komt deels uit RDW (⚠ veld te verifiëren) of uit fabrieksopgave. Prijsband per maat (budget/midden/premium) uit een openbare steekproef. EV's slijten sneller (gewicht/koppel): een correctiefactor als *aanname* tonen.
- **Onderhoud:** geen open bron. Eigen tabel per model: interval (km/maanden) × geschatte kosten per beurt (uren × uurtarief + onderdelen). Uurtarief-aanname met bron (bijv. BOVAG-indicatie). Occasions: opslag per leeftijd/km (zie methodiek).
- **v1:** eigen dataset, elke regel met bron en peildatum.

### 2.13 Praktische specs (fabrieksinformatie)
- Bagageruimte, WLTP-actieradius, laadsnelheid (AC/DC), trekgewicht, afmetingen: uit openbare fabrieksbrochures/prijslijsten. RDW levert gewicht, trekgewicht en zitplaatsen al officieel.
- Feitelijke specificaties zijn niet auteursrechtelijk beschermd; we nemen geen teksten of foto's over. Foto's: neutrale illustraties of geen foto's in v1 (dat is ook beter voor de neutraliteit).

---

## 3. Advies

**v1 (gratis en haalbaar)**
1. RDW Open Data: specs, CO₂/brandstof, APK-gebreken, terugroepacties → eigen betrouwbaarheidsscore.
2. CBS: brandstofprijzen + opcenten.
3. Wetteksten/Belastingdienst: MRB, BPM, bijtelling (configbestand).
4. Euro NCAP: sterren + testjaar als tekst met link (geen logo).
5. **Eigen samengestelde dataset** voor 40–60 modellen: prijzen, restwaardecurves, onderhoud, verzekering (bandbreedte), banden, praktische specs. Elke waarde krijgt `bron`, `peildatum`, `betrouwbaarheid: hoog/middel/laag`.

**Later (bij omzet of financiering)**
1. Restwaardelicentie (Autotelex of Indicata): grootste kwaliteitswinst.
2. Euro NCAP-toestemming voor logo/detailscores.
3. Tweede betrouwbaarheidsbron (Consumentenbond-licentie of ADAC/TÜV).
4. Verzekeringsindicaties via een partner, **alleen** als die geen invloed heeft op de ranking.

**Waarom een eigen dataset verantwoord is:** omdat de methodiek en alle aannames openbaar en uitklapbaar zijn, kan iedereen nagaan waar een cijfer vandaan komt. Juist met jouw achtergrond bij een importeur maakt dat het product controleerbaar neutraal. Zie `beslissingen.md`.

## 5. Gebruikt in Fase 2 (stap 2a)

### 5.1 Modelselectie (objectief)
- Script `scripts/selecteer-modellen.ts` telt alle personenauto's in RDW met datum eerste toelating sinds 1-1-2019 (niet geëxporteerd), per merk + handelsbenaming. Resultaat: `data/modelselectie.json`.
- Varianten worden samengevoegd tot een modelfamilie met `src/data/normaliseer.ts`. Regel: het model is het eerste woord na de merknaam. Alleen een vaste lijst tweede woorden hoort bij de naam (CROSS, AIRCROSS, X, STAR; "MODEL Y", "IONIQ 5"). Merkspecifieke regels bestaan alleen waar een merk de modelnaam in een typecode verstopt (BMW "118I" → 1 SERIE, Mercedes "A 180" → A-KLASSE). Elke regel heeft een test in `tests/normaliseer.test.ts`.
- De **50 grootste families** gaan mee: samen 51,8% van 3,69 miljoen registraties (peildatum 3-11-2026). Bij gelijke aantallen beslist de alfabetische volgorde.
- Gevolg: ook modellen die niet meer nieuw te koop zijn (bijv. VW up!, Ford Fiesta) zitten erin. Die zijn relevant als occasion.

### 5.2 Specificaties per model en aandrijving
- Script `scripts/haal-specs.ts` neemt per model de **400 meest recent toegelaten kentekens** en haalt per kenteken de brandstofgegevens op. Per aandrijving (minimaal 10 kentekens) berekent het de mediaan van: catalogusprijs, massa rijklaar, zitplaatsen, trekgewicht geremd (0 = niet toegestaan), lengte, vermogen, WLTP-verbruik, CO₂ en elektrische actieradius. Resultaat: `data/modellen-rdw.json`.
- Aandrijving uit RDW: `OVC-HEV` = plug-in hybride, `NOVC-HEV` = hybride (**inclusief mild-hybride**), alleen "Elektriciteit" = elektrisch.
- **Catalogusprijs** = RDW-catalogusprijs incl. btw en BPM, inclusief de fabrieksopties van de geregistreerde auto's. Dit is dus geen vanafprijs, maar wel wat er gemiddeld werkelijk gekocht wordt.
- **Plug-in hybride:** RDW publiceert het elektrische verbruik, de actieradius en het *gewogen* WLTP-verbruik. Het brandstofverbruik met een lege accu ontbreekt vrijwel altijd. ⚠ Aanvullen in de eigen dataset (nodig voor eerlijke energiekosten).
- Bekende beperking: een aandrijving die nu weinig verkocht wordt, kan uit de steekproef vallen.

### 5.3 Kentekencheck
- `src/data/kenteken.ts` haalt per kenteken op: voertuiggegevens (`m9d7-ebf2`), brandstof (`8ys7-d773`), status van terugroepacties (`t49b-isb7`) en details van openstaande acties (`af5r-44mf`).
- RDW staat verzoeken vanuit de browser toe (CORS `*`). Het kenteken gaat daardoor **rechtstreeks van de gebruiker naar RDW**, zonder eigen server of opslag (privacy-eis).

## 6. Open punten
- ⚠ Licenties per RDW-dataset bevestigen (alles CC-0?).
- ⚠ Euro NCAP: mag "5 sterren (2024)" als feit commercieel genoemd worden? Toestemming vragen.
- ⚠ Steekproef van vraagprijzen: juridische check (databankenrecht / gebruiksvoorwaarden).
- ⚠ Offertes Autotelex / Indicata / VWE opvragen voor de latere fase.
