# Testlink op Vercel: stappenplan voor Adriaan

De app is volledig statisch: alle berekeningen draaien in de browser van de bezoeker, er is geen server of database. Daardoor kan hij gratis of goedkoop op Vercel staan. Gecontroleerd op 4-11-2026: `npm run build` slaagt en alle pagina's zijn statisch.

## Wat jij moet doen (eenmalig, ca. 15 minuten)
1. **GitHub-account** aanmaken op https://github.com (of je bestaande gebruiken). Een algemeen AutoKeuze-mailadres is neutraler dan je werkadres.
2. Een **lege, privé repository** aanmaken, bijvoorbeeld `autokeuze-nl`. Niets aanvinken (geen README, geen licentie).
3. Mij de naam van de repository geven. Ik zet de code erop; daarvoor vraagt je computer één keer om in te loggen bij GitHub (dat doe je zelf, ik typ geen wachtwoorden).
4. **Vercel-account** aanmaken op https://vercel.com met "Continue with GitHub".
5. In Vercel: *Add New → Project → Import* de repository. Instellingen niet aanpassen (Vercel herkent Next.js). Klik *Deploy*.
6. Na 1–2 minuten krijg je een link als `autokeuze-nl.vercel.app`. Die open je op je telefoon.

Daarna zet elke nieuwe versie die ik naar GitHub stuur zichzelf automatisch online.

## Om op te letten
- **Wie kan het zien?** De link is openbaar voor iedereen die hem kent. Vercel kan een testversie afschermen met een login ("Deployment Protection"); controleer in de instellingen wat jouw abonnement toestaat.
- **Gratis abonnement (Hobby):** volgens Vercel bedoeld voor persoonlijk, niet-commercieel gebruik. Zodra er affiliatelinks of inkomsten bij komen, is waarschijnlijk een betaald abonnement nodig. Controleer de actuele voorwaarden op vercel.com/pricing voordat we live gaan.
- **Euro NCAP:** vóór een openbare livegang eerst toestemming vragen (besluit 31). Een afgeschermde testlink is iets anders dan publiceren, maar zet de link niet breed rond.

## Tot die tijd: testen op je telefoon via wifi
Zet laptop en telefoon op hetzelfde wifi-netwerk en start de app zo:
```bash
npm run dev -- -H 0.0.0.0
```
Zoek het adres van je laptop op:
```bash
ipconfig getifaddr en0
```
Open op je telefoon `http://<dat adres>:3000`, bijvoorbeeld `http://192.168.1.23:3000`.
