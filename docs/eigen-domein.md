# Eigen domein koppelen — stappenplan (voor later)

*Besluit 90: voorlopig blijft de site op https://autokeuze-nl.vercel.app. Dit is het plan voor wanneer je een eigen naam wilt. Reken op ongeveer 15 minuten werk, en daarna tot een paar uur wachten tot het wereldwijd werkt.*

## 1. Domein kopen (Adriaan)
- Bij een Nederlandse registrar, bijvoorbeeld TransIP, Versio of Hostnet. Een .nl-domein kost ongeveer €5–15 per jaar.
- Check eerst of de naam niet lijkt op een merk of een bestaande vergelijkingssite (merkenregister: [BOIP](https://www.boip.int/nl)).
- Neem alleen het domein, zonder hosting of e-mailpakket. Vercel host de site gratis.

## 2. Domein toevoegen in Vercel (Adriaan, met Claude Code erbij)
1. Vercel → project **autokeuze-nl** → *Settings* → *Domains* → *Add*.
2. Vul zowel `jouwdomein.nl` als `www.jouwdomein.nl` in. Laat `www` doorverwijzen naar de versie zonder www.
3. Vercel laat zien welke DNS-regels nodig zijn, meestal:
   - een **A-record** voor `@` naar het IP-adres dat Vercel noemt;
   - een **CNAME** voor `www` naar het adres dat Vercel noemt.

## 3. DNS instellen bij de registrar (Adriaan)
- In het beheerpaneel van de registrar → DNS → voeg de twee regels uit stap 2 toe en verwijder eventuele oude "parkeer"-regels.
- Vercel regelt het https-certificaat automatisch zodra de DNS klopt.

## 4. Controleren (Claude Code)
- `https://jouwdomein.nl` opent de site, met slotje en zonder waarschuwing.
- `https://www.jouwdomein.nl` stuurt door.
- De oude `autokeuze-nl.vercel.app` blijft gewoon werken.

## 5. Daarna
- Optioneel: een e-mailadres op het domein voor meldingen (nodig voor de belangenvermelding en de toegankelijkheidsverklaring).
- Optioneel: Vercel *Deployment Protection* uitzetten of aanlaten, afhankelijk van of de site openbaar moet zijn.
