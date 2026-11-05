import { Nav } from "../nav";

export const metadata = {
  title: "Over, disclaimer en privacy – AutoKeuze NL",
  description: "Wat AutoKeuze NL wel en niet is, hoe we met je gegevens omgaan en welke bronnen we gebruiken.",
};

export default function Over() {
  return (
    <main>
      <Nav />
      <h1>Over AutoKeuze NL</h1>
      <p className="sub">Wat deze site wel en niet is, hoe we met je gegevens omgaan en welke bronnen we gebruiken.</p>

      <h2 id="wat">Wat het is</h2>
      <p>
        AutoKeuze NL is een onafhankelijke rekentool. Je ziet welke auto&apos;s bij je gebruik passen en wat ze je per maand kosten, bij kopen, lenen, financial
        lease, private lease of zakelijk rijden. Elke score en elk bedrag kun je openklappen: welke data, welke bron, welke peildatum en welke aanname. Hoe de
        ranglijst werkt staat op de <a href="/methodiek">methodiekpagina</a>.
      </p>

      <h2 id="disclaimer">Geen advies</h2>
      <p>
        De uitkomsten zijn scenario&apos;s op basis van jouw invoer, openbare gegevens en de aannames die we bij elke berekening tonen. Dit is{" "}
        <strong>geen financieel advies</strong> en geen advies in de zin van de Wet op het financieel toezicht. Wij bemiddelen niet in krediet, lease of
        verzekeringen. Bedragen zijn indicatief; fiscale regels kunnen wijzigen. Laat je bij een definitief besluit adviseren door een erkend adviseur.
      </p>
      <p>
        Zakelijke berekeningen (ZZP&apos;er, DGA, auto van de zaak) zijn vereenvoudigd en niet nagerekend door een fiscalist. Ze houden bijvoorbeeld geen
        rekening met je andere investeringen, aftrekposten of de situatie van je partner.
      </p>
      <p>
        Er zijn op dit moment geen commerciële partners. Komen die er later, dan hebben ze geen invloed op de rangschikking: partnerlinks worden als zodanig
        gemarkeerd, staan pas ná de vergelijking en sturen geen gegevens over jou door.
      </p>

      <h2 id="privacy">Privacy</h2>
      <ul>
        <li>Je hebt geen account nodig en we slaan niets over jou op. Alle berekeningen gebeuren in je eigen browser.</li>
        <li>Wat je invult (inkomen, budget, kilometers) verlaat je apparaat niet en is weg als je de pagina sluit.</li>
        <li>We gebruiken geen cookies, geen tracking en geen advertentienetwerken.</li>
        <li>
          Uitzondering: bij de <a href="/kenteken">kentekencheck</a> vraagt je browser de voertuiggegevens rechtstreeks op bij de open data van de RDW
          (opendata.rdw.nl). Alleen het kenteken gaat dan naar de RDW; wij zien het niet.
        </li>
        <li>De site draait bij Vercel. Zoals elke webserver ziet die technische gegevens als je IP-adres; wij gebruiken die niet.</li>
      </ul>

      <h2 id="bronnen">Bronnen en licenties</h2>
      <ul>
        <li>
          <strong>RDW open data</strong> (voertuiggegevens, APK-gebreken, terugroepacties): vrij te gebruiken (CC-0).
        </li>
        <li>
          <strong>CBS</strong> (brandstof- en stroomprijzen): open data, hergebruik met bronvermelding (CC BY 4.0).
        </li>
        <li>
          <strong>Belastingdienst, wetten.overheid.nl, Rijksoverheid</strong>: tarieven en regels, met link per regel op de methodiekpagina.
        </li>
        <li>
          <strong>Euro NCAP</strong>: we noemen alleen het aantal sterren en het testjaar, met een link naar de uitslag op euroncap.com. Euro NCAP is niet
          betrokken bij deze site.
        </li>
        <li>Merknamen en modelnamen zijn van hun eigenaars en staan hier alleen om auto&apos;s aan te duiden.</li>
      </ul>

      <h2 id="toegankelijk">Toegankelijkheid</h2>
      <p>
        We streven naar WCAG 2.2 niveau AA: bruikbaar met toetsenbord en schermlezer, voldoende contrast, en goed leesbaar op een telefoon. Een contactadres
        voor vragen en meldingen volgt bij de publieke lancering.
      </p>
    </main>
  );
}
