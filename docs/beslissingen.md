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
| 24 | 2026-11-03 | Brandstofverbruik plug-in hybride met lege accu niet invullen met een schatting zolang er geen bron is | RDW publiceert het niet; geen waarden uit het geheugen | Claude | open (stap 2c) |
| 25 | 2026-11-03 | Kentekencheck draait volledig in de browser, rechtstreeks naar RDW | privacy: geen eigen server, geen opslag | Claude | uitgevoerd |
