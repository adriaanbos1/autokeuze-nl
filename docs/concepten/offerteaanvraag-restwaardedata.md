# Concept: offerteaanvraag restwaardedata

> **Status: concept, niet verstuurd.** Adriaan beslist of en wanneer dit verstuurd wordt, en vult de afzender in.
> Bedoeld voor: Autotelex, Indicata (Autorola) en VWE (zie `docs/databronnen.md` §2.7). Contactgegevens: via het contactformulier of de salesafdeling op hun eigen website; die hebben we niet opgezocht of ingevuld.
> Opgesteld: 4-11-2026.

---

**Onderwerp:** Offerteaanvraag licentie restwaarde- en handelswaardedata voor een consumentenvergelijker

Geachte heer/mevrouw,

Wij bouwen AutoKeuze NL, een onafhankelijke en merkneutrale web-app die Nederlandse automobilisten helpt een auto en een financieringsvorm te kiezen (contant, lening, financial lease, private lease en zakelijke varianten). De app rekent de totale kosten per maand transparant door, inclusief afschrijving. Op dit moment schatten we de afschrijving met een generieke curve; die willen we vervangen door marktdata per model.

Wij vragen een offerte aan voor het volgende:

1. **Gegevens:** (verwachte) handels- of inruilwaarde van personenauto's in Nederland, per model en uitvoering/aandrijving, naar leeftijd (0–10 jaar) en kilometerstand. Bij voorkeur ook een prognose van de restwaarde over 3, 4 en 5 jaar voor nieuwe auto's.
2. **Omvang:** in eerste instantie ca. 50 modelfamilies (de meest geregistreerde in Nederland sinds 2019), later mogelijk meer.
3. **Levering:** een API of een periodiek bestand (maandelijks is voldoende).
4. **Gebruik:** we tonen **afgeleide bedragen** aan consumenten (bijvoorbeeld "verwachte waarde na 5 jaar: ca. €14.000") met bronvermelding. We publiceren uw ruwe dataset niet en verstrekken die niet door. Per kenteken: alleen als de gebruiker zelf een kenteken invoert.
5. **Neutraliteit:** de data wordt alleen gebruikt voor de berekening, en heeft geen relatie met eventuele commerciële partners van ons platform.

Graag horen wij:
- de licentievorm en de kosten (eenmalig en per maand/jaar), en of er een starttarief of proefperiode is voor een jong platform met nog beperkt bereik;
- of het tonen van afgeleide bedragen aan consumenten met bronvermelding binnen de licentie valt, en hoe u de bronvermelding wilt zien;
- de methodiek achter de waarden (advertentiedata, transacties, taxaties) en hoe vaak die wordt bijgewerkt;
- de dekking: welke merken, modellen, bouwjaren en aandrijvingen (in het bijzonder elektrische auto's en plug-in hybrides).

Bij voorkeur ontvangen wij eerst een voorbeeldbestand of testtoegang voor een paar modellen, zodat we de aansluiting op onze rekenmodule kunnen beoordelen.

Met vriendelijke groet,

[naam]
AutoKeuze NL
[e-mailadres / telefoon]

---

## Notities per aanbieder (voor Adriaan, niet meesturen)

| Aanbieder | Waarom interessant | Let op |
|---|---|---|
| Autotelex | Dé NL-referentie voor nieuwprijzen en handelswaarde (zie Fase 0-research); de Wet BPM noemt "een in de handel algemeen toegepaste koerslijst" als route voor de afschrijving | Vraag expliciet of consumentweergave mag |
| Indicata (Autorola) | Marktprijzen op basis van live advertentiedata; ook prognoses | Vraag naar NL-specifieke dekking en methode |
| VWE | Kentekengebaseerde voertuig- en waardedata | Vraag of kentekenopvragingen per stuk of in een bundel worden afgerekend |

**Om te beslissen vóór versturen:**
- Afzender en e-mailadres (een algemeen AutoKeuze NL-adres is neutraler dan een persoonlijk adres).
- Of we tegelijk bij alle drie aanvragen (beter vergelijken) of eerst bij één.
- Budget: `databronnen.md` §2.7 schat honderden tot enkele duizenden euro's per maand; dat is niet geverifieerd.
