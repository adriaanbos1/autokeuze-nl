import selectie from "../../data/modelselectie.json";
import bestelselectie from "../../data/bestelselectie.json";
import { Nav } from "../nav";
import { CRITERIA, VERSIE, ankers, criteriumNaam, profielTweaks, standaardGewichten, type Criterium, type Profiel } from "@/regels/methodiek";
import { register, type Label } from "@/regels/register";

export const metadata = {
  title: "Methodiek – AutoKeuze NL",
  description: "Hoe AutoKeuze NL auto's rangschikt en kosten doorrekent: criteria, gewichten, vaste schalen, bronnen en aannames.",
};

// Alle getallen op deze pagina komen rechtstreeks uit de code die ook de ranglijst maakt
// (src/regels/methodiek.ts, regels-nl.ts en aannames.ts). Ze kunnen dus niet uit elkaar lopen.

const PROFIELEN: [Profiel, string][] = [
  ["particulier", "Particulier"],
  ["zzp", "ZZP'er"],
  ["dga", "DGA met bv"],
  ["leaserijder", "Leaserijder"],
];

const WAT: Record<Criterium, string> = {
  TCO: "Wat de auto jou per maand kost over je looptijd en kilometers: afschrijving, energie, verzekering, MRB, onderhoud, banden en gemiste rente. Bij zakelijke profielen het netto bedrag na belasting.",
  BETR: "APK-gebreken (RDW) vergeleken met auto's van hetzelfde bouwjaar en dezelfde leeftijd.",
  ONDH: "Verwacht onderhoud en banden per maand (rekenmodel op aandrijving, gewicht en leeftijd).",
  REST: "Verwachte waarde aan het eind van je looptijd, als deel van de aankoopprijs.",
  FIT: "Past de auto bij je gebruik: ruimte (bij gezin), actieradius tegenover je langste rit.",
  DUUR: "CO₂-uitstoot bij jouw gebruik (plug-in hybride: met jouw laadsituatie).",
  VEIL: "Euro NCAP-sterren, met aftrek naarmate de test ouder is.",
  COMF: "Nog geen objectieve bron; telt nu niet mee.",
};

const LABEL: Record<Label, string> = {
  vastgesteld: "vastgesteld",
  aangekondigd: "aangekondigd",
  onzeker: "onzeker",
  bron: "uit bron",
  aanname: "eigen aanname",
};

const nl = (x: number) => x.toLocaleString("nl-NL");
const datum = (iso: string) => new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
const tweak = (t: Partial<Record<Criterium, number>>) =>
  Object.entries(t)
    .map(([c, v]) => `${criteriumNaam[c as Criterium]} ${v! > 0 ? "+" : "−"}${Math.abs(v!)}`)
    .join(", ");

const groepen = [...new Set(register.map((r) => r.groep))];
const onzeker = register.filter((r) => r.label === "onzeker" || r.label === "aangekondigd");

export default function Methodiek() {
  return (
    <main id="inhoud">
      <Nav />
      <h1>Methodiek</h1>
      <p className="sub">Hoe AutoKeuze NL auto&apos;s rangschikt en kosten doorrekent. Versie {VERSIE}.</p>

      <nav aria-label="Inhoud van deze pagina" className="inhoud">
        <ol>
          <li>
            <a href="#kort">In het kort</a>
          </li>
          <li>
            <a href="#criteria">Criteria en vaste schalen</a>
          </li>
          <li>
            <a href="#gewichten">Gewichten per profiel</a>
          </li>
          <li>
            <a href="#ranglijst">Hoe de ranglijst ontstaat</a>
          </li>
          <li>
            <a href="#neutraal">Merkneutraliteit</a>
          </li>
          <li>
            <a href="#onzeker">Wat nog onzeker is</a>
          </li>
          <li>
            <a href="#register">Alle regels en aannames met bron</a>
          </li>
        </ol>
      </nav>

      <h2 id="kort">In het kort</h2>
      <ol>
        <li>Je vertelt hoe je rijdt, wat je budget is en wat je belangrijk vindt.</li>
        <li>
          <strong>Harde eisen</strong> (budget, zitplaatsen, trekgewicht, actieradius, laadvermogen, zero-emissiezone) halen auto&apos;s uit de lijst. Ze geven
          geen punten.
        </li>
        <li>
          Elke overgebleven auto krijgt per criterium een <strong>score van 0 tot 100</strong> op een <strong>vaste, openbare schaal</strong>.
        </li>
        <li>
          Die scores tellen we op met <strong>gewichten</strong> die bij je profiel passen. Met schuifjes pas je ze zelf aan.
        </li>
        <li>Bij elke score en elk bedrag kun je openklappen welke data, bron, peildatum en aanname erachter zitten.</li>
        <li>Commerciële partijen hebben geen invloed op de volgorde. Er zijn op dit moment ook geen commerciële partners.</li>
      </ol>
      <p className="melding">
        AutoKeuze NL rekent scenario&apos;s door en vergelijkt. Het is geen financieel of fiscaal advies en geen bemiddeling. Uitkomsten zijn formuleringen als
        &quot;in dit scenario is X goedkoper&quot;, niet &quot;je moet X nemen&quot;.
      </p>

      <h2 id="criteria">Criteria en vaste schalen</h2>
      <p>
        Een score hangt nooit af van welke andere auto&apos;s in de lijst staan. We gebruiken vaste ankerpunten: een waarde die 0 punten oplevert en een waarde
        die 100 punten oplevert, met een rechte lijn daartussen. Ontbreekt de data voor een criterium, dan telt dat criterium voor die auto niet mee en wegen de
        andere naar verhouding zwaarder. De kaart van de auto vermeldt dat.
      </p>
      <div className="tabel-scroll" tabIndex={0} role="region" aria-label="Tabel criteria">
        <table className="raster">
          <caption className="uitleg">Criteria en wat we meten</caption>
          <thead>
            <tr>
              <th scope="col">Criterium</th>
              <th scope="col">Wat we meten</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c}>
                <th scope="row">{criteriumNaam[c]}</th>
                <td>{WAT[c]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Ankerpunten</h3>
      <ul>
        <li>
          Totale kosten: {nl(ankers.tco.slecht)}× je maandbudget = 0 punten, {nl(ankers.tco.goed)}× je maandbudget = 100 punten.
        </li>
        <li>
          Onderhoud en banden: €{ankers.onderhoud.slecht} per maand = 0, €{ankers.onderhoud.goed} per maand = 100.
        </li>
        <li>
          Duurzaamheid: {ankers.co2.slecht} g CO₂/km = 0, {ankers.co2.goed} g/km = 100.
        </li>
        <li>
          Ruimte (alleen bij 3+ personen of kinderen): lengte {ankers.lengteGezin.slecht} cm = 0, {ankers.lengteGezin.goed} cm = 100.
        </li>
        <li>
          Actieradius (elektrisch): praktijkbereik {nl(ankers.bereikPerRit.slecht)}× je langste rit = 0, {nl(ankers.bereikPerRit.goed)}× = 100.
        </li>
        <li>Betrouwbaarheid: 50 = even veel APK-gebreken als het gemiddelde van auto&apos;s van dezelfde leeftijd.</li>
        <li>Veiligheid: 2 sterren = 0, 5 sterren = 100; een halve ster aftrek per volle 3 jaar sinds de test.</li>
      </ul>

      <h2 id="gewichten">Gewichten per profiel</h2>
      <p>Startwaarden; je past ze aan met de schuifjes. De gewichten zijn voor elk merk gelijk.</p>
      <div className="tabel-scroll" tabIndex={0} role="region" aria-label="Tabel startgewichten">
        <table className="raster">
          <caption className="uitleg">Startgewichten in procenten</caption>
          <thead>
            <tr>
              <th scope="col">Criterium</th>
              {PROFIELEN.map(([p, naam]) => (
                <th scope="col" key={p} className="b">
                  {naam}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c}>
                <th scope="row">{criteriumNaam[c]}</th>
                {PROFIELEN.map(([p]) => (
                  <td key={p} className="b">
                    {standaardGewichten[p][c]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Automatische aanpassingen, altijd zichtbaar in de app:</p>
      <ul>
        <li>Gezin (kinderen of 3+ personen): {tweak(profielTweaks.gezin)}.</li>
        <li>Alleen occasions: {tweak(profielTweaks.occasion)}.</li>
      </ul>

      <h2 id="ranglijst">Hoe de ranglijst ontstaat</h2>
      <ol>
        <li>
          <strong>Welke modellen:</strong> de {selectie.modellen.length} personenauto-modellen die sinds 2019 het vaakst in Nederland zijn ingeschreven (
          {nl(selectie.dekkingGekozen)}% van {nl(selectie.aantalRegistratiesGeteld)} registraties, RDW, peildatum {datum(selectie.peildatum)}). Voor ondernemers
          ook de {bestelselectie.modellen.length} meest ingeschreven bestelauto&apos;s. Geen handmatige selectie.
        </li>
        <li>
          <strong>Per model</strong> telt de uitvoering (aandrijving, nieuw of bouwjaar) met de hoogste score. Zo staan er drie verschillende modellen in de top
          3.
        </li>
        <li>
          <strong>Volgorde:</strong> eindscore (afgerond op één decimaal), bij gelijke stand de laagste maandkosten, daarna alfabetisch.
        </li>
        <li>
          <strong>Top 3:</strong> de hoogste drie binnen je budget. Passen er minder, dan vullen we aan met de goedkoopste erboven, met het label &quot;boven je
          budget&quot;.
        </li>
        <li>
          <strong>Kopen als basis:</strong> de ranglijst rekent met kopen (zakelijk: de goedkoopste koopvariant). Lease en financiering staan daarna als
          vergelijking per auto, zodat een leaseproduct de volgorde niet bepaalt.
        </li>
      </ol>
      <p>
        Uitgebreide formules en met de hand na te rekenen voorbeelden staan in de methodiekdocumentatie bij de broncode (docs/methodiek.md) en in de{" "}
        <a href="/rekenpagina">rekenpagina</a>.
      </p>

      <h2 id="neutraal">Merkneutraliteit</h2>
      <ul>
        <li>Dezelfde formules, schalen en standaardwaarden voor elk merk. Geen handmatige correcties per merk.</li>
        <li>Onderhoud, restwaarde en verzekering zijn rekenmodellen die niet per merk verschillen.</li>
        <li>
          <strong>Merkblinde test:</strong> vervang je alle merk- en modelnamen door nummers, dan blijft elke score gelijk. Deze test draait bij elke wijziging.
        </li>
        <li>
          <strong>Gescheiden partnercode:</strong> mochten er later partnerlinks komen, dan staan die in een aparte module die de rekencode niet kan
          beïnvloeden. Een test bewijst dat de ranglijst met en zonder partners identiek is. Partnerlinks zouden pas ná de ranglijst staan, met het label
          &quot;partnerlink&quot;, en zonder jouw gegevens door te sturen.
        </li>
        <li>De rekencode bevat geen velden voor commissie of vergoedingen; een test controleert dat.</li>
      </ul>

      <h2 id="onzeker">Wat nog onzeker is</h2>
      <p>Regels die nog niet definitief zijn of waarvoor we alleen een secundaire bron hebben. We rekenen ermee, maar markeren ze.</p>
      <ul>
        {onzeker.map((r) => (
          <li key={r.pad}>
            <strong>
              {r.groep} – {r.naam}
            </strong>{" "}
            ({LABEL[r.label]}){r.toelichting ? `: ${r.toelichting}` : ""}
          </li>
        ))}
        <li>
          <strong>Verzekering</strong>: marktgemiddelde per dekking, niet per model of per persoon. Vul in de app je eigen premie in voor een preciezer beeld.
        </li>
        <li>
          <strong>Restwaarde</strong>: een algemene curve, niet per model. Een licentie op restwaardedata is nog niet afgesloten.
        </li>
        <li>
          <strong>Zakelijke uitkomsten</strong> zijn niet nagerekend door een fiscalist.
        </li>
      </ul>

      <h2 id="register">Alle regels en aannames met bron</h2>
      <p>
        {register.length} parameters. &quot;Vastgesteld&quot; = in wet of besluit; &quot;aangekondigd&quot; = in een wetsvoorstel; &quot;onzeker&quot; = bronnen
        spreken elkaar tegen of alleen een secundaire bron; &quot;uit bron&quot; = openbaar cijfer zonder wettelijke status; &quot;eigen aanname&quot; = ons
        uitgangspunt, aanpasbaar. Peildatum = wanneer wij de waarde controleerden.
      </p>
      {groepen.map((g) => (
        <details key={g}>
          <summary>
            {g} ({register.filter((r) => r.groep === g).length})
          </summary>
          <div className="tabel-scroll" tabIndex={0} role="region" aria-label={`Tabel ${g}`}>
            <table className="raster">
              <thead>
                <tr>
                  <th scope="col">Parameter</th>
                  <th scope="col">Status</th>
                  <th scope="col">Geldig vanaf</th>
                  <th scope="col">Peildatum</th>
                  <th scope="col">Bron</th>
                </tr>
              </thead>
              <tbody>
                {register
                  .filter((r) => r.groep === g)
                  .map((r) => (
                    <tr key={r.pad}>
                      <th scope="row">
                        {r.naam}
                        {r.toelichting && <div className="uitleg">{r.toelichting}</div>}
                      </th>
                      <td>{LABEL[r.label]}</td>
                      <td>{datum(r.geldigVanaf)}</td>
                      <td>{datum(r.peildatum)}</td>
                      <td className="bron">
                        {r.url ? (
                          <a href={r.url} rel="noopener noreferrer">
                            {r.bron}
                          </a>
                        ) : (
                          r.bron
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}

      <p className="disclaimer">
        Deze pagina wordt automatisch opgebouwd uit dezelfde bestanden waarmee de app rekent. Fiscale regels controleren we elk jaar per 1 januari en na
        Prinsjesdag.
      </p>
    </main>
  );
}
