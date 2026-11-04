# Beslissingen-log

Format: datum · beslissing · waarom · door wie · status

| # | Datum | Beslissing | Waarom | Door | Status |
|---|---|---|---|---|---|
| 1 | 2026-11-03 | Fase 0 levert alleen documentatie op (geen code); plan mode niet gebruikt, omdat die modus het schrijven van `docs/` blokkeert | opdracht vraagt deze docs als deliverable | Claude | uitgevoerd |
| 2 | 2026-11-03 | Stack: Next.js + TypeScript op Vercel; engine als pure TS-module met Vitest; data als bestanden in git, geen database | goedkoop, één commando lokaal, geen persoonsgegevens | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 3 | 2026-11-03 | Normalisatie met **vaste, openbare ankers** in plaats van relatief binnen de lijst | scores veranderen niet door de selectie; merkneutraal en uitlegbaar | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 4 | 2026-11-03 | Betrouwbaarheid v1 = eigen analyse van RDW APK-gebreken + terugroepacties | gratis, CC-0, Nederlands; geen licentie nodig | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 5 | 2026-11-03 | Restwaarde v1 = eigen curves uit een handmatige steekproef, gelabeld "schatting"; niet scrapen | geen gratis bron; scrapen juridisch riskant | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 6 | 2026-11-03 | Geen gebruikersdata naar partners; partnerlinks zijn platte links ná de ranking | Wft (geen bemiddeling) + neutraliteit | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 7 | 2026-11-03 | Rekenvoorbeelden met fictieve, merkloze voorbeeldauto's | na te rekenen en aantoonbaar neutraal | Claude | uitgevoerd |
| 8 | 2026-11-03 | Modelselectie voor de dataset op basis van RDW-registratiecijfers per segment | objectief; voorkomt verwijt van cherry-picking | Claude (voorstel) | akkoord (plan goedgekeurd 3-11) |
| 9 | 2026-11-03 | Plan Fase 0 goedgekeurd ("Akkoord, start Fase 1"); de 5 open vragen zijn nog niet beantwoord | — | Adriaan | uitgevoerd |
| 10 | 2026-11-03 | Node.js 22 LTS lokaal geïnstalleerd in `~/.local/node` (checksum gecontroleerd) | was niet aanwezig; geen beheerdersrechten nodig | Adriaan (akkoord) | uitgevoerd |
| 11 | 2026-11-03 | Elke kostenpost wordt op centen afgerond; het totaal is de som van de getoonde posten | uitklapbare berekening telt altijd precies op | Claude | uitgevoerd |
| 12 | 2026-11-03 | BPM voor brandstofauto's nog niet in de engine; alleen EV-bedrag €687. Catalogusprijs (incl. BPM) is leidend | bronnen over de CO₂-schijven 2026 spreken elkaar tegen | Claude | open: opnemen zodra de wetstekst is geverifieerd |
| 13 | 2026-11-03 | MRB-opcenten over de eigen grondslag van art. 222 Provinciewet (niet over het rijksdeel) | twee consistente bronnen + rekenvoorbeelden kloppen | Claude | bevestigd: 1.631/1.632 gelijk aan Belastingdienst-rekentool (3-11) |
| 14 | 2026-11-03 | ZZP-berekening rekent met een opgegeven effectief tarief; hulpfunctie voor MKB-winstvrijstelling + aftrekbeperking aanwezig; heffingskortingen nog niet | eenvoudig na te rekenen; volledige IB-berekening hoort bij Fase 4 | Claude | uitgevoerd |
| 15 | 2026-11-03 | DGA/bv in v1 als "light" (bijtelling + pseudo-eindheffing + km-vergoeding) | bevestigd door Adriaan (vraag 4) | Adriaan | besloten |
| 16 | 2026-11-03 | V1 met gewone doorverwijslinks, zonder gebruikersdata. Echte leads (gegevens doorsturen) pas later, en alleen met een AFM-vergunning of een vergunde partner, na juridisch advies | Wft: gegevens doorsturen = bemiddelen | Adriaan | besloten |
| 17 | 2026-11-03 | Het belang van de maker (werkzaam bij een importeur) wordt niet op de site vermeld. Methodiek blijft wel openbaar en de neutraliteitstests blijven verplicht | keuze van Adriaan; risico voor geloofwaardigheid als het later uitkomt is benoemd | Adriaan | besloten |
| 18 | 2026-11-03 | Restwaarde in v1 via eigen schattingen (gelabeld); offertes voor een licentie worden opgevraagd voor een later besluit | geen budget nu, wel optie houden | Adriaan | besloten |
| 19 | 2026-11-03 | Zakelijk in v1: ZZP'er en leaserijder volledig, DGA/bv licht | haalbaar zonder fiscalist; volledige bv-doorrekening later | Adriaan | besloten |
| 20 | 2026-11-03 | Occasions in v1: dezelfde 40–60 modellen tot ca. 10 jaar oud, plus kentekencheck via RDW (gewicht, APK, terugroepacties) | concrete auto's beter doorgerekend; RDW-data is gratis | Adriaan | besloten |
| 21 | 2026-11-03 | Opcenten in de MRB niet tussentijds op centen afronden; alleen het kwartaaltotaal naar beneden | zo komt de engine overeen met de Belastingdienst (12 afwijkingen van €1 verdwenen) | Claude | uitgevoerd |
| 22 | 2026-11-03 | Modelselectie: top 50 modelfamilies op RDW-registraties sinds 2019, met openbare normalisatieregels | objectief en controleerbaar; geen handmatige keuze | Claude | uitgevoerd |
| 23 | 2026-11-03 | Specificaties per aandrijving = mediaan van de 400 meest recente kentekens; catalogusprijs incl. opties | weerspiegelt wat er werkelijk verkocht wordt; officiële bron | Claude | uitgevoerd |
| 24 | 2026-11-03 | Brandstofverbruik plug-in hybride met lege accu niet invullen met een schatting zolang er geen bron is | RDW publiceert het niet; geen waarden uit het geheugen | Claude | vervangen door 30 |
| 25 | 2026-11-03 | Kentekencheck draait volledig in de browser, rechtstreeks naar RDW | privacy: geen eigen server, geen opslag | Claude | uitgevoerd |
| 26 | 2026-11-03 | Betrouwbaarheid = aandeel APK's met ≥ 1 technisch gebrek, leeftijdsgecorrigeerd (werkelijk/verwacht), logaritmische score 0,5× = 100 / 1× = 50 / 2× = 0 | eerlijk tussen jonge en oude modellen; symmetrisch; volledig uit open data | Claude | uitgevoerd |
| 27 | 2026-11-03 | Adviespunten en administratieve APK-punten tellen niet mee | zeggen niets over de auto zelf | Claude | uitgevoerd |
| 28 | 2026-11-03 | Steekproef via SHA-256-loting uit alle kentekens (niet alfabetisch, niet op kentekenformaat) | alfabetisch en op laatste teken bleken scheef (importreeksen, nieuwe kentekenformaten) | Claude | uitgevoerd |
| 29 | 2026-11-03 | Bekende vertekening: duurdere modellen scoren mogelijk beter door beter onderhoud (dealer/lease). Benoemd in de methodiek, niet gecorrigeerd | geen open data over onderhoud of km-stand per keuring | Claude | open: later aanvullen met tweede bron (ADAC/Consumentenbond) |
| 30 | 2026-11-04 | Verbruik plug-in hybride met lege accu: officiële RDW-waarde als die er is, anders afgeleid met de EU-utility-factorformule (2023/443) uit gewogen verbruik + actieradius + emissiecode | officiële rekenregel; gecontroleerd tegen 2.178 auto's (mediaan +1%) | Claude | uitgevoerd |
| 31 | 2026-11-04 | Euro NCAP alleen via de openbare uitslagpagina's (niet de interne /api/, uitgesloten in robots.txt); alleen feiten (sterren, jaar, link), geen logo/tekst/beeld | respecteer robots.txt en de voorwaarden | Claude | uitgevoerd; toestemming vragen vóór livegang = open |
| 32 | 2026-11-04 | Veiligheidsscore volgt de verloopmarkering van Euro NCAP zelf (niet onze eigen 6-jaarsregel) | bron is leidend; consistent met wat de gebruiker op euroncap.com ziet | Claude | uitgevoerd |
| 33 | 2026-11-04 | Onderhoud en banden als openbaar rekenmodel (aandrijving, gewicht, leeftijd, km), niet per merk | geen open bron per model; geen merkverschillen verzinnen | Claude | uitgevoerd; open: echte data later |
| 34 | 2026-11-04 | Verzekering verschilt niet per model: eigen premie of marktgemiddelde per dekking | geen betrouwbare bron per model; voorkomt schijnprecisie in de ranking | Claude | akkoord Adriaan 2026-11-04 |
| 35 | 2026-11-04 | Kostenaannames apart van wettelijke regels (`src/regels/aannames.ts`, soort "bron"/"aanname") | wettelijke waarden en eigen schattingen niet door elkaar | Claude | uitgevoerd |
| 36 | 2026-11-04 | Restwaarde in v1 = forfaitaire BPM-afschrijvingstabel (Belastingdienst) + km-correctie 1,5% per 10.000 km; niet per model | enige officiële, openbare afschrijvingscurve; geen scraping | Claude | uitgevoerd |
| 37 | 2026-11-04 | Criterium Restwaarde telt niet mee in de score zolang de curve voor elk model gelijk is; wel in de TCO | volgt de regel "ontbrekende data krijgt geen gok" (§1.2); afschrijving weglaten uit de kosten zou erger zijn | Claude | uitgevoerd |
| 38 | 2026-11-04 | Kilometerstand in de kentekencheck is optionele invoer van de gebruiker; anders 15.000 km/jaar aangenomen | RDW publiceert geen tellerstand; niets opgeslagen | Claude | uitgevoerd |
| 39 | 2026-11-04 | Offerteaanvraag restwaardedata alleen als concept; versturen beslist Adriaan | extern contact en kosten zijn een productkeuze | Claude | open: Adriaan |
| 40 | 2026-11-04 | Private lease: de gebruiker kan een offerteprijs invullen; zonder offerte tonen we een eigen indicatieve schatting (afschrijving + rente + onderhoud + verzekering + aangenomen marge), duidelijk gelabeld | keuze Adriaan; geen open bron met leaseprijzen per model | Adriaan | besloten |
| 41 | 2026-11-04 | Occasions in de top 3 als "model + leeftijd + km" met een geschatte prijs uit de generieke restwaardecurve, gelabeld "schatting" | keuze Adriaan; past bij besluit 20 | Adriaan | besloten |
| 42 | 2026-11-04 | Intake in Fase 3 kent alle drie profielen: particulier volledig, leaserijder en ZZP'er als basis; Fase 4 verdiept de zakelijke kant | keuze Adriaan | Adriaan | besloten |
| 43 | 2026-11-04 | Vercel-testlink aan het eind van Fase 3; tot dan lokaal testen (ook op de telefoon via wifi) | accounts op naam van Adriaan; eerst een werkende flow | Adriaan | besloten |
| 44 | 2026-11-04 | Ranglijst rekent met contant kopen als neutrale basis; financieringsvormen worden per auto vergeleken (stap 3c) | de volgorde mag niet afhangen van een financieringsproduct | Claude | uitgevoerd |
| 45 | 2026-11-04 | "Nieuw leverbaar" = model nog nieuw geregistreerd in het aankoopjaar (RDW-steekproef); anders uit de nieuw-ranglijst | objectief en controleerbaar; voorkomt uitlopende modellen in de top 3 | Claude | uitgevoerd |
| 46 | 2026-11-04 | Budget = maandbedrag alles inbegrepen (TCO); top 3 alleen binnen budget, aangevuld met de goedkoopste erboven (gelabeld) als er te weinig passen | budget is een harde eis, maar een lege uitkomst helpt niemand | Claude | uitgevoerd; Adriaan kan kiezen voor aankoopbudget als hoofdvraag |
| 47 | 2026-11-04 | Ankers voor ONDH (€100/€20 per maand), DUUR (180/0 g CO₂), FIT (lengte 400/470 cm bij gezin; bereik 1×/2× langste rit) vastgelegd in `src/regels/methodiek.ts` | ontbraken nog in de methodiek; openbaar en gelijk voor elk merk | Claude | uitgevoerd; review Adriaan gewenst |
| 48 | 2026-11-04 | Schuifjes 0–40 in stappen van 5 in plaats van 0–5; tie-break op afgeronde eindscore | startwaarden blijven exact zichtbaar; eenduidige sortering | Claude | uitgevoerd |
| 49 | 2026-11-04 | Energieprijzen: CBS voor brandstof en thuisstroom; publiek/snelladen als gelabelde aanname | geen officieel gemiddelde laadtarief | Claude | uitgevoerd |
| 50 | 2026-11-04 | Startpagina is nu de autokeuze; de Fase 1-rekenpagina staat op `/rekenpagina` | de hoofdflow hoort op de voorpagina | Claude | uitgevoerd |
| 51 | 2026-11-04 | Occasiondata per model × bouwjaar (2016–2025) uit RDW: 4 × 50 kentekens per bouwjaar (laatste toelatingen per kwartaal), niet geëxporteerd | nieuwprijs en specs van dat bouwjaar zijn eerlijker dan die van nu; spreiding over het jaar | Claude | uitgevoerd |
| 52 | 2026-11-04 | Verbruik zonder WLTP-waarde = NEDC × mediane WLTP/NEDC-verhouding uit RDW-auto's met beide waarden | geen omrekenfactor uit het geheugen; afgeleid uit dezelfde bron | Claude | uitgevoerd |
| 53 | 2026-11-04 | Occasion-kilometerstand = 15.000 km per jaar oud (aanname); maximale km-stand optioneel als harde eis | RDW publiceert geen tellerstand | Claude | uitgevoerd |
| 54 | 2026-11-04 | Euro NCAP telt niet mee voor een occasion als het model alleen ná het bouwjaar is getest | latere test gaat meestal over een nieuwere generatie; geen gok | Claude | uitgevoerd |
| 55 | 2026-11-04 | Occasion-gewichtsaanpassing (BETR +5, ONDH +5) alleen bij "alleen occasion", niet bij "allebei" | bij allebei moeten nieuw en occasion op dezelfde schaal vergeleken worden | Claude | uitgevoerd |
| 56 | 2026-11-04 | Diesel-occasions: aangenomen dat er een roetfilter is geregistreerd (geen fijnstoftoeslag MRB) | de grens voor de toeslag is nog niet tegen de wet gecontroleerd; check per kenteken in de kentekencheck | Claude | open: per kenteken verifiëren |
