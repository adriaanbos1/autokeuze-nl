# AutoKeuze NL — projectcontext voor Claude Code

## Wat we bouwen
Een onafhankelijke, merkneutrale web-app die Nederlandse automobilisten helpt:
1. **De beste auto te kiezen** (nieuw én occasion) op basis van hun gebruik, situatie en voorkeuren.
2. **De beste financiële constructie te vinden**: private lease, contant kopen, financiering/lening (incl. financial lease met slottermijn) en zakelijke varianten (auto van de zaak, operational lease, ZZP/eenmanszaak, DGA/bv).

Kernbelofte: *"Eerlijk inzicht in wat een auto je écht kost en welke het beste bij je past — transparant doorgerekend."*

## Doelgroepen (v1)
- **Particuliere rijder** – gezin of individu die zelf kiest en betaalt.
- **ZZP'er / ondernemer** – twijfelt tussen zakelijk en privé; wil het fiscale effect zien.
- **Leaserijder van de zaak** – kiest binnen een leasebudget; wil bijtelling en netto maandlasten zien.

## Keuzecriteria (scoringsmodel)
Elk criterium krijgt een score van 0–100 en een gewicht dat afhangt van het profiel van de gebruiker (aanpasbaar via schuifjes):
- Betrouwbaarheid (storingen, APK-afkeur, terugroepacties)
- Onderhouds- en reparatiekosten
- Restwaarde / afschrijving
- Totale kosten (TCO) per maand en per km: brandstof/laden, verzekering (indicatief), MRB, afschrijving, onderhoud, banden
- Praktische fit: ruimte, trekgewicht, actieradius, laden thuis, gezinsprofiel
- Duurzaamheid en regelgeving: EV vs. brandstof, zero-emissiezones, toekomstige MRB/bijtelling
- Veiligheid (Euro NCAP) en rijplezier/comfort

Bij occasions hangen betrouwbaarheid, onderhoud en restwaarde af van **bouwjaar en kilometerstand** (curves per model/motorisatie).

## Harde principes
1. **Informatief, geen financieel advies.** De app vergelijkt en rekent transparant door met scenario's, maar geeft geen persoonlijk Wft-advies. Formuleringen zoals "in dit scenario is X goedkoper" in plaats van "je moet X nemen". Een duidelijke disclaimer, en geen bemiddeling in krediet.
2. **Neutraliteit is heilig.** Het verdienmodel wordt later affiliate/leads (leasemaatschappijen, financiers, dealers), maar **commerciële partners mogen de ranking nooit beïnvloeden**. Architectuur: de scoring-engine kent geen partnerdata; leadknoppen komen pas ná de ranking en worden gelabeld.
3. **Transparantie.** Elke score en elk bedrag is uitklapbaar: welke data, welke bron, welke peildatum, welke aannames.
4. **Actuele regels, met bron.** Fiscale en wettelijke parameters (MRB, bijtelling, BPM, EV-kortingen, kilometervergoeding, KIA/MIA, regels voor private lease en BKR) staan in één centraal, versiebeheerd configbestand met bron-URL en `geldig_vanaf`. Gebruik nooit waarden uit je geheugen zonder ze te verifiëren. Markeer onzekerheid expliciet.
5. **Privacy.** In v1 geen accounts en geen opslag van persoonsgegevens; alles draait in de browser of de sessie.

## Over de opdrachtgever
- Adriaan is marketeer, geen developer. **Leg keuzes uit in gewoon Nederlands**, kort, en zonder jargon (of met uitleg ervan).
- Kies zelf een moderne, gangbare en goedkoop te hosten stack en verantwoord die in één alinea. Voorkeur: iets dat met één commando lokaal draait en eenvoudig te deployen is (bijv. Next.js + TypeScript op Vercel).
- Geef na elke fase: wat er gebouwd is, hoe ik het lokaal open (exacte commando's), wat ik moet testen en welke beslissingen er van mij nodig zijn.
- Stel bij twijfel een vraag in plaats van te gokken bij productkeuzes; bij technische details mag je zelf beslissen.

## Werkwijze
- **Fase 0 is altijd onderzoek + plan. Bouw niets voordat ik het plan heb goedgekeurd.**
- Daarna in fases bouwen, met na elke fase een werkende, testbare versie.
- De reken-engine (TCO, financiering, fiscaal) is pure, geteste code: unit tests met voorbeeldcases die ik met de hand kan narekenen.
- Houd een `docs/`-map bij: `plan.md`, `databronnen.md`, `regels-nl.md`, `methodiek.md` (hoe de scores werken, publiek uitlegbaar) en `beslissingen.md` (log van keuzes).
- Gebruik git, met kleine commits en duidelijke berichten.

## Context/belangen
Adriaan werkt bij een automotive importeur. Het product moet daarom aantoonbaar merkneutraal zijn: geen merk krijgt een voorkeursbehandeling in data, gewichten of presentatie, en de methodiek is publiek.
