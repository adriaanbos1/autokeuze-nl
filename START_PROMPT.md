# Startprompt — plak dit als eerste bericht in Claude Code

Lees eerst CLAUDE.md volledig. We beginnen met **Fase 0: onderzoek en plan**. Bouw nog geen code; gebruik plan mode.

## Opdracht Fase 0
Lever in `docs/` de volgende stukken op en vat ze daarna kort voor mij samen in de chat:

### 1. `databronnen.md` — waar halen we de data vandaan?
Onderzoek per criterium (betrouwbaarheid, onderhoudskosten, restwaarde, TCO-componenten, praktische specs, veiligheid, emissie/energie) de beschikbare bronnen voor de Nederlandse markt. Kijk in elk geval naar:
- RDW Open Data (kentekens, APK-keuringen en -gebreken, terugroepacties, voertuigspecificaties)
- Euro NCAP, ANWB, Consumentenbond, TÜV Report, ADAC Pannenstatistik
- Restwaarde- en prijsdata (bijv. Autotelex, VWE, Indicata, Autodisk; daarnaast openbare occasionprijzen)
- Brandstof- en stroomprijzen, verzekeringsindicaties, banden en onderhoud

Geef per bron: wat het levert, de kwaliteit, gratis/betaald (met indicatieve kosten), de API- of downloadmogelijkheid, licentie/gebruiksvoorwaarden (mag het in een commercieel product?) en de update-frequentie. Sluit af met een **advies**: wat gebruiken we in v1 (gratis en haalbaar), wat later, en waar vullen we tijdelijk aan met een zorgvuldig samengestelde eigen dataset (met bronvermelding).

### 2. `regels-nl.md` — fiscale en wettelijke parameters
Zoek de actuele waarden voor 2026 en de aangekondigde waarden voor 2027 op, met bron en peildatum:
- MRB (incl. EV-korting en -afbouw, gewichtsklassen, provinciale opcenten), BPM
- Bijtelling (percentages, cap, EV-regels, de 60-maandenregel), eigen bijdrage
- Zakelijk rijden voor de ZZP'er/eenmanszaak (auto op de zaak vs. privé + km-vergoeding, KIA/MIA, afschrijving) en voor de DGA/bv
- Private lease (BKR-registratie, toetsing), financial lease en slottermijn, persoonlijke lening en huurkoop
- Wft-grenzen: wat mag een vergelijkingstool zeggen zonder vergunning, en wat moet in de disclaimer staan?
- Zero-emissiezones voor (bestel)auto's, voor zover relevant

Markeer alles wat onzeker is of nog door de politiek moet.

### 3. `methodiek.md` — hoe werkt de keuzelogica?
- Het scoringsmodel: normalisatie per criterium, gewichten per profiel en hoe de gebruiker die aanpast
- Hoe het model occasions behandelt (leeftijd- en km-curves)
- De TCO-formule en de vergelijking van de financieringsvormen (wat zit wel en niet in een leaseprijs, eigen risico, gederfde rente/rendement bij contant kopen)
- Uitgewerkt rekenvoorbeeld voor 3 persona's (particulier, ZZP'er, leaserijder), elk met 2–3 auto's
- Hoe neutraliteit technisch wordt geborgd (scheiding tussen ranking en affiliate)

### 4. `plan.md` — bouwplan
- Voorgestelde stack en hosting, met uitleg in gewone taal en verwachte maandkosten
- Fases met per fase: doel, wat ik daarna kan zien of testen, en een globale omvang. Startvoorstel (pas aan waar nodig):
  1. Reken-engine (TCO + 4 financieringsvormen + fiscaal) met tests
  2. Dataset v1: ca. 40–60 populaire modellen in NL (nieuw + occasion-curves), RDW-koppeling waar mogelijk
  3. Web-app: intake (gebruik, km/jaar, budget, gezin, laden thuis, zakelijk/privé) → top 3 met uitleg en uitklapbare berekening → vergelijking van financieringsscenario's met schuifjes
  4. Zakelijke module (ZZP/DGA/leaserijder) uitgediept
  5. Afronding: methodiekpagina, disclaimers, voorbereiding op affiliates (zonder invloed op de ranking), toegankelijkheid, deploy
- De belangrijkste risico's en open vragen voor mij

## Daarna
Stop na Fase 0 en wacht op mijn akkoord. Stel me hooguit 5 gerichte vragen over keuzes die jij niet kunt maken.
