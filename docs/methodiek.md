# Methodiek — hoe AutoKeuze NL rekent en rangschikt

*Versie 0.1 (concept, Fase 0). Dit document wordt later de publieke methodiekpagina.*

## 0. In het kort
1. Je vertelt hoe je rijdt en wat je belangrijk vindt.
2. **Harde eisen** (budget, zitplaatsen, trekgewicht, actieradius) filteren auto's eruit. Ze geven geen punten.
3. Elke overgebleven auto krijgt per criterium een **score van 0–100** op een **vaste, openbare schaal**.
4. Die scores tellen we op met **gewichten** die bij jouw profiel passen. Met schuifjes pas je de gewichten aan.
5. Bij elke score en elk bedrag kun je zien: welke data, welke bron, welke peildatum, welke aanname.
6. Commerciële partners zien en beïnvloeden niets hiervan (§7).

---

## 1. Scoringsmodel

### 1.1 Criteria
| Code | Criterium | Wat meten we | Bron (v1) |
|---|---|---|---|
| BETR | Betrouwbaarheid | APK-gebreken t.o.v. leeftijdsgenoten, terugroepacties (ernst) | RDW |
| ONDH | Onderhoud & reparatie | verwachte €/maand onderhoud + reparatierisico | eigen dataset |
| REST | Restwaarde | verwachte waarde na de looptijd, als % van de prijs | eigen curves |
| TCO | Totale kosten | €/maand over jouw looptijd en km's (§4) | berekend |
| FIT | Praktische fit | ruimte, trekgewicht, actieradius vs. jouw ritten, laden thuis | RDW + fabrieksopgave |
| DUUR | Duurzaamheid & regels | CO₂, ZE-zone, toekomstige MRB/bijtelling | RDW + regels-nl |
| VEIL | Veiligheid | Euro NCAP-sterren, gecorrigeerd voor testjaar | Euro NCAP |
| COMF | Comfort & rijplezier | geluid, vering, prestaties (beperkt objectief) | eigen dataset, laag gewicht |

### 1.2 Normalisatie: vaste schalen, geen onderlinge vergelijking
We gebruiken **absolute ankerpunten** en niet "de beste in de lijst = 100". Daardoor verandert de score van een auto niet als er een andere auto bijkomt, en kan een merk niet profiteren van de selectie.

Formule per criterium (lineair, begrensd):
```
score = 100 × (waarde − slecht) / (goed − slecht), begrensd tot [0, 100]
```
Voorbeelden van ankers (concept, worden openbaar gepubliceerd):
| Criterium | "slecht" (0) | "goed" (100) |
|---|---|---|
| TCO €/maand | 2× jouw budget | ½× jouw budget |
| Restwaarde na 5 jr | 25% | 65% *(telt pas mee met restwaardedata per model, §2.1)* |
| BETR: gebrekenratio t.o.v. gemiddelde voor die leeftijd | 2,0× | 0,5× (logaritmische schaal, zie §2.2) |
| Euro NCAP | 2 sterren | 5 sterren (actueel protocol) |

- **TCO is relatief aan jóuw budget**, zodat de schaal past bij een student én bij een directeur.
- **Euro NCAP-veroudering:** −0,5 ster per 3 jaar sinds de test (protocollen worden strenger); tests ouder dan 6 jaar tellen als "verlopen" (score max 50).
- **Ontbrekende data** krijgt geen 50 als gok. Het criterium telt dan niet mee voor die auto, de gewichten van de andere criteria worden herschaald, en we tonen het label "onvoldoende data". Elke auto krijgt daarnaast een **datadekking-%**.

### 1.3 Gewichten per profiel (startwaarden, concept)
| Criterium | Particulier | ZZP'er | Leaserijder |
|---|---|---|---|
| TCO | 30 | 30 | 15 *(netto bijtelling)* |
| Betrouwbaarheid | 15 | 20 | 5 *(lease dekt risico)* |
| Onderhoud | 10 | 10 | 0 *(in leaseprijs)* |
| Restwaarde | 10 | 10 | 0 *(risico leasemaatschappij)* |
| Praktische fit | 15 | 15 | 30 |
| Duurzaamheid & regels | 5 | 5 | 15 |
| Veiligheid | 10 | 5 | 15 |
| Comfort | 5 | 5 | 20 |
| **Totaal** | 100 | 100 | 100 |

Profieltweaks (automatisch, zichtbaar): gezin met kinderen → VEIL +5, FIT +5 (ten koste van COMF/DUUR); occasion → BETR +5, ONDH +5.

### 1.4 Schuifjes
- De gebruiker zet elk criterium op 0–5 ("niet belangrijk" … "heel belangrijk"); wij herschalen dat naar procenten die optellen tot 100.
- Eindscore = Σ (gewicht × score) / Σ gewichten.
- Bij gelijke eindscore (verschil < 1 punt) beslist de **laagste TCO**, daarna **alfabetisch op modelnaam**, zodat de volgorde voorspelbaar en merkneutraal is.
- We tonen de top 3 met per auto de **3 sterkste en 2 zwakste punten**, en "wat moet er veranderen om nummer 1 te worden".

---

## 2. Occasions: leeftijd- en kilometercurves

Voor een occasion hangen drie criteria af van **leeftijd (jaren)** en **kilometerstand**:

### 2.1 Restwaarde (afschrijving), gebouwd in Fase 2d
Er is geen open bron voor marktwaarden per model, en advertentiesites scrapen we niet. Daarom in v1 een **generieke curve**:
```
waarde(maanden, km) = nieuwprijs × (1 − afschrijving%(maanden) − b × (km − km_norm) / 10.000)
km_norm             = 15.000 × maanden / 12
```
- `afschrijving%` = de **forfaitaire afschrijvingstabel van de Belastingdienst** voor de BPM op gebruikte auto's (`regels-nl.md` §2), per begonnen maand sinds de eerste toelating. Dit is een wettelijke vuistregel, geen marktwaarde.
- `b` = 1,5% van de nieuwprijs per 10.000 km boven of onder normaal (eigen aanname, bandbreedte 1–2%).
- `nieuwprijs` = de RDW-catalogusprijs (incl. btw, BPM en opties).
- Afschrijving over de looptijd = waarde nu (bij nieuw: de nieuwprijs) − waarde aan het eind, gedeeld door het aantal maanden (`afschrijvingOverLooptijd`).

Narekenen: €40.000 nieuw, 5 jaar, 15.000 km/jr → 60 maanden = 62% + 6 × 0,42% = 64,52% → eindwaarde **€14.192**, afschrijving (40.000 − 14.192) / 60 = **€430,13 per maand**. Occasion van 3 jaar met 45.000 km: 51% + 6 × 0,5% = 54% → **€18.400**; met 65.000 km 3% lager → **€17.200**.

Gevolgen, eerlijk benoemd:
- De curve is voor elk merk en model gelijk. Echte verschillen (sommige modellen of aandrijvingen houden hun waarde beter dan andere) zitten er niet in.
- Het **criterium Restwaarde (REST) telt daarom nog niet mee in de score** ("onvoldoende data", §1.2): een curve die voor iedereen gelijk is, zegt niets over het verschil tussen modellen. In de **TCO** rekenen we wel met de curve, omdat afschrijving de grootste kostenpost is en weglaten erger zou zijn dan een grove schatting.
- Verbetering: een licentie op restwaardedata (concept-offerteaanvraag in `docs/concepten/`).

### 2.2 Betrouwbaarheid (gebouwd in Fase 2b)

**Wat we meten:** welk deel van de reguliere APK-keuringen minstens één **technisch gebrek** had, vergeleken met auto's van hetzelfde bouwjaar en dezelfde leeftijd.

1. **Bron:** RDW Open Data: APK-meldingen (`sgfe-77wx`), geconstateerde gebreken (`a34c-vvps`) en de gebrekencatalogus (`hx2c-gt7k`). Licentie: publiek domein.
2. **Welke gebreken tellen mee** (`src/data/gebreken.ts`): technische gebreken uit de APK-regeling, zoals remmen, ophanging, stuurinrichting, roest, banden, verlichting, ruiten, uitlaat en lekkages. **Niet mee:** adviespunten (bijvoorbeeld bandprofiel 1,6–2,5 mm), administratieve punten (kentekenregister, tellerstand, VIN), afmetingen, LPG-documentatie en tachograaf.
3. **Keuringen:** "APK Lichte voertuigen", soort "periodieke controle", in de laatste 24 maanden. Een herkeuring op dezelfde dag telt één keer.
4. **Steekproef:** per model × bouwjaar (2014–2022) 600 kentekens, gelot met een vaste hash (SHA-256) van het kenteken: willekeurig, maar elke keer dezelfde uitkomst. Het landelijk gemiddelde: per bouwjaar 3.000 kentekens, op dezelfde manier gelot uit alle personenauto's van dat bouwjaar. Dezelfde regel geldt voor elk merk.
5. **Leeftijdscorrectie (indirecte standaardisatie):** per bouwjaar en leeftijd bij keuring rekenen we uit hoeveel keuringen met gebrek je zou *verwachten* als het model precies gemiddeld was:
   `verwacht = Σ keuringen_model × (landelijk aandeel met gebrek, zelfde bouwjaar en leeftijd)`.
   `verhouding = werkelijk / verwacht`.
6. **Score** (logaritmisch, zodat "half zo vaak" even ver boven gemiddeld ligt als "twee keer zo vaak" eronder):
   `score = 100 × (1 − log₂(verhouding)) / 2`, begrensd op 0–100. Dus 0,5× = 100, 1× = 50 en 2× = 0.
7. **Minimale aantallen:** een cel (bouwjaar × leeftijd) telt alleen mee bij ≥ 30 keuringen. Een model krijgt alleen een score bij ≥ 200 keuringen in totaal, anders "onvoldoende data". De **zekerheid** volgt het aantal waargenomen gebreken: ≥ 100 hoog, ≥ 40 middel, anders laag.
8. **Voor een occasion** gebruiken we dezelfde berekening, maar alleen voor de bouwjaren rond die auto (filter op bouwjaar).

**Beperkingen (eerlijk benoemd):**
- APK-gebreken meten slijtage en onderhoudsstaat, niet alleen ontwerpkwaliteit. Een model dat veel door intensieve gebruikers wordt gereden (lease, veel km) kan slechter scoren. Kilometerstand per keuring zit niet in de open data.
- De score geldt per model, nog niet per aandrijving.
- Een steekproef van 600 per model × bouwjaar geeft statistische ruis; daarom tonen we de zekerheid naast de score.
- Pech onderweg (ADAC) en ervaringen van eigenaren (Consumentenbond) zitten er niet in; zie `databronnen.md`.
- Terugroepacties tellen niet mee in de score, maar tonen we apart per kenteken.

### 2.3 Onderhoud & reparatie
```
onderhoud_per_jaar = beurten × (uren × uurtarief + onderdelen) × (1 + c × max(0, leeftijd − 3))
beurten            = max(1, km_per_jaar / 20.000)          (ANWB: elke 20.000 km of eens per jaar)
banden_per_jaar    = km_per_jaar × slijtagefactor / 40.000 × 4 × prijs_per_band(gewicht)
```
**Gebouwd in Fase 2c** (`src/engine/onderhoud.ts`, waarden in `src/regels/aannames.ts`):

| Waarde | Verbranding (incl. (plug-in) hybride) | Elektrisch | Soort |
|---|---|---|---|
| uurtarief incl. btw | €82 | €82 | bron (ANWB/AMT 2024) |
| uren per beurt | 1,5 | 1,0 | aanname |
| onderdelen per beurt | €120 | €50 | aanname |
| leeftijdsopslag `c` | 6% per jaar boven 3 jaar | idem | aanname (bandbreedte 5–8%) |
| slijtagefactor banden | 1,0 | 1,2 | bron (Michelin, secundair) |
| levensduur set banden | 40.000 km | 40.000 km | aanname |
| prijs per band | ≤1.200 kg €90 · ≤1.600 kg €120 · ≤2.000 kg €160 · zwaarder €210 | idem | aanname |

Narekenen: benzine 1.500 kg, 15.000 km, nieuw → onderhoud 1 × (1,5 × 82 + 120) = **€243**, banden 15.000 / 40.000 × 4 × 120 = **€180**. Elektrisch 2.000 kg, 15.000 km → onderhoud **€132**, banden 0,45 × 4 × 160 = **€288**.

- Het model maakt alleen onderscheid naar aandrijving, gewicht, leeftijd en km, **niet naar merk**. Dat is neutraal, maar ook grof: echte verschillen in onderhoudsschema's en onderdelenprijzen zitten er nog niet in.
- Nog niet in het model: grote voorspelbare posten (distributieriem, remmen, 12V-accu) en reparaties buiten de leeftijdsopslag.
- Verzekering: eigen premie van de gebruiker, anders het marktgemiddelde per dekking (Geld.nl H1 2026: WA €109,57 · WA+ €100,17 · allrisk €111,49 per maand). Geen verschil per model, dus geen invloed op de ranking tussen modellen; wel op de vergelijking kopen vs. private lease (lease bevat meestal allrisk).

### 2.4 Plug-in hybride: verbruik met lege accu (Fase 2c)
Het "gewogen" WLTP-verbruik uit de folder is een mengsel van elektrisch en op brandstof rijden. De EU-regel weegt met de **utility factor** (UF), het deel van de kilometers dat als elektrisch wordt aangenomen:
```
UF(d)  = 1 − exp(−Σ Cᵢ · (d / dn)ⁱ),  i = 1…10      (Verordening (EU) 2023/443, tabel A8.App5/1)
gewogen ≈ UF × 0 + (1 − UF) × leeg   ⇒   leeg ≈ gewogen / (1 − UF)
```
- `d` = elektrische actieradius (WLTP), `dn` = normaalafstand volgens de emissiecode: EA (en oudere Euro 6) 800 km, EB 2.200 km (vanaf 2025), EC 4.260 km (vanaf 2027). Hoe groter `dn`, hoe minder kilometers de regel als elektrisch telt.
- Aannames: in de elektrische fase wordt geen brandstof verbruikt, en we nemen de UF bij de actieradius (de officiële berekening werkt per testfase).
- **Controle:** bij 2.178 RDW-auto's waarvoor RDW de officiële waarde wél publiceert: mediane afwijking **+1%**, 80% tussen −2% en +7,5%; voor emissiecode EA (802 auto's) 100% binnen 10%. Voorbeeld met de hand: gewogen 2,9 l, actieradius 47 km, EA → UF = 0,737 → 2,9 / 0,263 = **11,0 l** (officieel 11,0).
- In de TCO rekenen we met **jouw** aandeel elektrisch (laadgedrag), niet met de UF: `energie = km × aandeel × kWh/100 × stroomprijs + km × (1 − aandeel) × leeg/100 × brandstofprijs` (`energiekostenPhevPerJaar`).

### 2.5 Veiligheid (Euro NCAP, Fase 2c)
- Geldende uitslag per model: de nieuwste test; bij twee uitslagen in hetzelfde jaar de standaarduitvoering (zonder optioneel veiligheidspakket).
- Score (§1.2): gecorrigeerde sterren = sterren − 0,5 per volle 3 jaar sinds de test; 2 sterren = 0, 5 sterren = 100; door Euro NCAP als verlopen gemarkeerd → hoogstens 50. Voorbeelden (peiljaar 2026): 5★ uit 2025 → 100; 5★ uit 2022 → 4,5 → 83; 5★ uit 2019 (verlopen) → 50; 3★ uit 2024 → 33.
- Kentekencheck (bestaande auto): de nieuwste test van vóór of uit het bouwjaar, omdat een latere test meestal over een nieuwere generatie gaat.
- We tonen sterren en testjaar als tekst met link, geen logo of beeld.

---

## 3. TCO-formule (kosten per maand)

```
TCO_maand = afschrijving + kosten_van_geld + energie + MRB + verzekering
          + onderhoud + banden + overig (APK, pechhulp)
```

| Onderdeel | Formule | Toelichting |
|---|---|---|
| afschrijving | (aankoopprijs − restwaarde_einde) / maanden | §2.1 |
| kosten van geld (contant) | gemiddeld vastgezet kapitaal × rendement / 12 | gemiddeld kapitaal = (aankoop + restwaarde)/2; rendement standaard **2,5%** netto (spaarrente-aanname, aanpasbaar) |
| kosten van geld (lening) | betaalde rente / maanden + eigen inbreng × rendement / 12 | annuïteit |
| energie | km/jr × verbruik × prijs / 12 | EV: mix thuis/publiek/snel; verbruik inclusief laadverlies |
| MRB | tarief × gewichtsklasse × brandstof × (1 + opcenten) × (1 − EV-korting jaar) | per jaar van de looptijd (korting loopt af!) |
| verzekering | gebruikersinvoer of bandbreedte per klasse | indicatief |
| onderhoud, banden | §2.3, km-gebonden | |

**Per km** = TCO_maand × 12 / km per jaar.

### 3.1 Wat zit wel en niet in een (private) leaseprijs
| Zit erin (meestal) | Zit er niet in |
|---|---|
| afschrijving + rente | energie (brandstof/stroom) |
| MRB | **eigen risico** bij schade (vaak €250–500 per keer) |
| verzekering (vaak allrisk) | boetes bij te veel km of schade bij inleveren |
| onderhoud, reparatie, banden | laadpaal thuis |
| pechhulp, vervangend vervoer (soms) | afkoop bij vroegtijdig stoppen |

Lease-TCO in de app = leaseprijs + energie + verwacht eigen risico (aanname: 0,12 schade per jaar × eigen risico) + verwachte meer-km-kosten.

**Wat je opbouwt:** bij kopen ben je aan het einde de restwaarde rijk, bij lease niets. Dat zit al in de "afschrijving", zodat beide vergelijkbaar zijn. Daarnaast tonen we het **risico** naast het bedrag: bij kopen loop jij het restwaarderisico, bij lease niet.

### 3.2 De vier financieringsvormen (particulier)
| | Contant | Persoonlijke lening | Financial lease / huurkoop (met slottermijn) | Private lease |
|---|---|---|---|---|
| Eigenaar | jij | jij | jij na laatste termijn | leasemaatschappij |
| Kosten van geld | gederfd rendement | rente | rente (ook over slottermijn) | in prijs |
| Restwaarderisico | jij | jij | jij | leasemaatschappij |
| Onderhoudsrisico | jij | jij | jij | leasemaatschappij |
| BKR | nee | ja | ja | ja (praktijk) |
| Flexibiliteit | hoog | hoog (aflossen kan) | laag | laag (afkoopboete) |

**Slottermijn:** lagere maandtermijn, maar je betaalt rente over het hele (hogere) uitstaande bedrag, en aan het eind moet je de slottermijn betalen, herfinancieren of de auto verkopen. De app toont: (a) maandlast, (b) totaal betaalde rente, (c) "is de verwachte restwaarde hoger dan de slottermijn?" (risico op een restschuld).

---

## 4. Uitgewerkte rekenvoorbeelden

> **Afronding:** elke post wordt op centen afgerond; het totaal is de som van de getoonde posten (zo telt de uitklapbare berekening altijd precies op).
>
> **Let op:** de auto's hieronder zijn **fictieve voorbeeldauto's** ("Auto A") met ronde bedragen. Zo is alles met de hand na te rekenen en speelt geen enkel merk een rol. Bedragen voor MRB, verzekering en onderhoud zijn hier **ingevoerde voorbeeldwaarden**, nog niet berekend uit de tabellen. Deze voorbeelden staan 1-op-1 als unit tests in `tests/persona-*.test.ts`.

Gemeenschappelijke aannames: benzine €2,30/l · stroom thuis €0,27/kWh, publiek €0,55/kWh · rendement op spaargeld 2,5%/jr.

### 4.1 Persona 1: particulier gezin
*Gezin, 15.000 km/jaar (1.250 km/mnd), 5 jaar (60 maanden), laadt thuis (80% thuis, 20% publiek), koopt contant.*

| | Auto A: compacte EV, nieuw | Auto B: compacte hybride (benzine), nieuw | Auto C: occasion benzine, 4 jr, 60.000 km |
|---|---|---|---|
| Aankoopprijs | €35.000 | €32.000 | €18.000 |
| Restwaarde na 5 jr | 45% = €15.750 | 50% = €16.000 | 45% = €8.100 |
| Verbruik | 16 kWh/100 km | 4,5 l/100 km | 6,0 l/100 km |

**Berekening per maand:**
| Post | A (EV) | B (hybride) | C (occasion) | Rekenregel |
|---|---|---|---|---|
| Afschrijving | 320,83 | 266,67 | 165,00 | (prijs − rest) / 60 |
| Kosten van geld | 52,86 | 50,00 | 27,19 | (prijs + rest)/2 × 2,5% / 12 |
| Energie | 65,20 | 129,38 | 172,50 | zie onder |
| MRB *(voorbeeld)* | 40,00 | 45,00 | 40,00 | |
| Verzekering *(voorbeeld)* | 75,00 | 70,00 | 55,00 | |
| Onderhoud + banden *(voorbeeld)* | 45,00 | 55,00 | 85,00 | |
| **TCO per maand** | **€598,89** | **€616,05** | **€544,69** | |
| **Per km** | €0,479 | €0,493 | €0,436 | TCO / 1.250 |

Energie uitgerekend:
- A: 15.000 × 0,16 = 2.400 kWh/jr. Mixprijs = 0,8 × 0,27 + 0,2 × 0,55 = €0,326. 2.400 × 0,326 = €782,40/jr → **€65,20/mnd**
- B: 15.000 × 0,045 = 675 l × €2,30 = €1.552,50/jr → **€129,38/mnd**
- C: 15.000 × 0,06 = 900 l × €2,30 = €2.070/jr → **€172,50/mnd**

**Financieringsvarianten voor Auto A:**
| Vorm | Berekening | TCO/mnd |
|---|---|---|
| Contant | zie boven | €598,89 |
| Persoonlijke lening €25.000, 60 mnd, 7,5% (+ €10.000 eigen geld) | maandtermijn €500,95; totale rente €5.057 → €84,28/mnd; gederfd rendement eigen geld 10.000 × 2,5% / 12 = €20,83. Kosten van geld = €105,11 i.p.v. €52,86 | **€651,14** |
| Private lease €489/mnd (60 mnd, 15.000 km, incl. MRB/verzekering/onderhoud) | 489 + energie 65,20 + verwacht eigen risico (0,12 schade/jr × €500 = €60/jr = €5/mnd) | **€559,20** |

*Uitleg voor de gebruiker:* "In dit scenario is private lease €39,69/mnd goedkoper dan contant kopen, en loop je geen restwaarderisico. Bij contant kopen heb je na 5 jaar een auto ter waarde van ca. €15.750 (die zit al in de berekening), en kun je langer doorrijden of eerder verkopen. Het BKR-effect van lease en lening kan je hypotheekruimte verlagen."

Annuïteit nagerekend: r = 7,5%/12 = 0,00625; termijn = 25.000 × 0,00625 / (1 − 1,00625⁻⁶⁰) = 156,25 / 0,31191 = €500,95.

### 4.2 Persona 2: ZZP'er (eenmanszaak, btw-plichtig)
*25.000 km/jaar, waarvan 20.000 zakelijk en 5.000 privé (dus > 500 km: bijtelling). 5 jaar, koopt contant. Effectief marginaal belastingtarief na ondernemersaftrek en MKB-winstvrijstelling: aanname 35% (⚠ wordt in Fase 1 exact berekend met de box 1-tarieven 2026). Kosten van geld laten we hier weg (gelijk in beide varianten).*

| | Auto Z1: EV | Auto Z2: hybride (benzine) |
|---|---|---|
| Catalogusprijs (incl. btw + BPM) | €40.000 | €38.000 |
| Restwaarde na 5 jr | 40% = €16.000 | 45% = €17.100 |
| Verbruik | 17 kWh/100 km (mix €0,326) | 5,0 l/100 km |
| MRB *(voorbeeld)* | €480/jr | €660/jr |
| Verzekering *(voorbeeld)* | €1.100/jr | €1.050/jr |
| Onderhoud + banden *(voorbeeld, incl. btw)* | €700/jr | €800/jr |

**Variant 1: auto zakelijk (bedragen excl. btw, want de btw is aftrekbaar)**
| Post per jaar | Z1 (EV) | Z2 (hybride) |
|---|---|---|
| Afschrijving (ex btw) | (40.000 − 16.000) / 1,21 / 5 = 3.966,94 | (38.000 − 17.100) / 1,21 / 5 = 3.454,55 |
| Energie (ex btw) | 4.250 kWh × 0,326 / 1,21 = 1.145,04 | 1.250 l × 2,30 / 1,21 = 2.376,03 |
| MRB | 480,00 | 660,00 |
| Verzekering | 1.100,00 | 1.050,00 |
| Onderhoud (ex btw) | 578,51 | 661,16 |
| **Autokosten (aftrekbaar)** | **7.270,49** | **8.201,74** |
| Bijtelling | 18% × 30.000 + 22% × 10.000 = 7.600 → **begrensd tot kosten: 7.270,49** | 22% × 38.000 = 8.360 → **begrensd: 8.201,74** |
| Fiscaal voordeel (kosten − bijtelling) × 35% | **€0** | **€0** |
| Btw-correctie privégebruik 2,7% × catalogus | 1.080,00 | 1.026,00 |
| **Netto kosten per jaar** | **8.350,49** | **9.227,74** |
| **Per maand** | **€695,87** | **€768,98** |

**Variant 2: auto privé + €0,25/km voor zakelijke ritten (bedragen incl. btw)**
| Post per jaar | Z1 (EV) | Z2 (hybride) |
|---|---|---|
| Afschrijving | (40.000 − 16.000)/5 = 4.800,00 | (38.000 − 17.100)/5 = 4.180,00 |
| Energie | 1.385,50 | 2.875,00 |
| MRB + verzekering + onderhoud | 480 + 1.100 + 700 = 2.280,00 | 660 + 1.050 + 800 = 2.510,00 |
| **Kosten** | **8.465,50** | **9.565,00** |
| Kilometeraftrek 20.000 × €0,25 = €5.000 × 35% | −1.750,00 | −1.750,00 |
| **Netto kosten per jaar** | **6.715,50** | **7.815,00** |
| **Per maand** | **€559,63** | **€651,25** |

*Uitleg:* "In dit scenario is de auto privé houden €136,24/mnd (EV) goedkoper dan zakelijk. Dat komt doordat je 5.000 km privé rijdt: de bijtelling is dan net zo hoog als alle autokosten, en je betaalt bovendien de btw-correctie."

*Gevoeligheid (zelfde EV, maar ≤ 500 km privé, dus geen bijtelling en nagenoeg geen btw-correctie):* netto 7.270,49 − 35% × 7.270,49 = 7.270,49 − 2.544,67 = **€4.725,82/jr = €393,82/mnd**. Dan is zakelijk duidelijk goedkoper. Daarom laat de app de privé-km als schuifje zien. Let op: woon-werk telt voor de inkomstenbelasting als zakelijk, voor de btw als privé.

### 4.3 Persona 3: leaserijder (auto van de zaak)
*Werknemer, kiest binnen een leasebudget, auto met eerste toelating in 2026. Marginaal tarief: aanname 49,5% (⚠ te verifiëren 2026). De werkgever betaalt de leaseprijs.*

| | Auto L1: EV €45.000 | Auto L2: benzine €40.000 | Auto L3: EV €32.000 |
|---|---|---|---|
| Bijtelling per jaar | 18% × 30.000 + 22% × 15.000 = **8.700** | 22% × 40.000 = **8.800** | 18% × 30.000 + 22% × 2.000 = **5.840** |
| Netto per jaar (× 49,5%) | 4.306,50 | 4.356,00 | 2.890,80 |
| **Netto per maand** | **€358,88** | **€363,00** | **€240,90** |
| Energie | meestal via laadpas werkgever (€0) | tankpas werkgever (€0) | €0 |

Varianten:
- **L1 met eigen bijdrage €50/mnd** (auto boven het budget): bijtelling 8.700 − 600 = 8.100 → netto 4.009,50 + eigen bijdrage 600 = €4.609,50/jr = **€384,13/mnd**.
- **L1 bij eerste toelating 2027:** 20% × 30.000 + 22% × 15.000 = 9.300 → €4.603,50/jr = **€383,63/mnd** (vast voor 60 maanden).
- **L2 (benzine) nieuw in 2027:** voor de werkgever komt er een pseudo-eindheffing bij van 12% × 40.000 = **€4.800/jr**. Daardoor zal de werkgever deze auto waarschijnlijk niet meer of alleen met een hogere eigen bijdrage aanbieden. De app toont dit als "werkgeverskosten", los van jouw netto bijtelling.

*Uitleg:* "In dit scenario kost Auto L3 jou netto €117,98/mnd minder dan L1. Bij L1 betaal je voor €15.000 meer cataloguswaarde, en daarover geldt het volle tarief van 22%."

---

## 5. Hoe we omgaan met onzekerheid
- Elk bedrag heeft een **bandbreedte** (laag / verwacht / hoog), bijvoorbeeld met de stroomprijs ±20%.
- In de top 3 staat ook: "zou deze volgorde veranderen als …?" (gevoeligheid voor energieprijs, km/jaar, restwaarde).
- Regels die nog niet vaststaan (🟡) worden gebruikt met label "aangekondigd". De gebruiker kan ze uitzetten.

## 6. Merkneutraliteit in de data
- Dezelfde formules, ankers en standaardwaarden voor elk merk. Geen handmatige "correcties" per merk.
- Dataset-wijzigingen gaan via git met reden en bron (openbaar changelog).
- Het datamodel bevat geen velden voor partnerschap, marge of commissie.
- **Audit-test:** als je de merknamen in de dataset door elkaar husselt, blijft elke score per model gelijk. Er mag geen enkele regel code op merknaam filteren of wegen.

## 7. Technische borging van neutraliteit (ranking ↔ affiliate)

```
[Intake (browser)] → [Scoring-engine] → [Ranking] → [Presentatie] → [Partnerblok (ná de ranking)]
                         ↑                                              ↑
               dataset + regels-nl                             partner-config (apart)
               (geen partnerdata)                       krijgt ALLEEN: model-id's van de getoonde auto's
```

1. **Aparte modules:** `engine/` (rekenen + rangschikken) importeert nooit iets uit `partners/`. Dat dwingen we af met een lint-regel en een test die de build laat falen.
2. **Eenrichtingsverkeer:** het partnerblok krijgt alleen de uitkomst (welke modellen staan in de top 3) en kan die niet terugschrijven of herordenen.
3. **Regressietest "ranking-invariantie":** dezelfde invoer met en zonder partner-config moet een byte-voor-byte identieke ranking geven.
4. **Presentatie:** partnerlinks staan pas ná de ranking en de berekening, met het label "Advertentie / partnerlink", en altijd met minstens één neutrale optie ("zelf zoeken").
5. **Geen data naar partners:** gewone links, geen profieldata in de URL (ook vereist voor de Wft, zie `regels-nl.md` §8).
6. **Openbaarheid:** methodiek, ankers, standaardgewichten en de broncode van de engine kunnen openbaar (bijv. open source). Dat is het sterkste bewijs van neutraliteit.
