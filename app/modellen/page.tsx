import selectie from "../../data/modelselectie.json";
import rdw from "../../data/modellen-rdw.json";
import type { ModelRdw, UitvoeringRdw } from "@/data/types";
import { Nav } from "../nav";
import { apkHerkomst, betrouwbaarheidModel } from "@/data/betrouwbaarheid-data";
import { ncapHerkomst, veiligheidModel } from "@/data/ncap-data";
import { bandenPerJaar, onderhoudPerJaar } from "@/engine/onderhoud";

// Voorbeeld voor de kolom "onderhoud + banden": nieuwe auto, 15.000 km per jaar.
const VOORBEELD_KM = 15000;

const modellen = rdw.modellen as ModelRdw[];
const eur = (x: number | null) => (x === null ? "—" : x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }));
const n = (x: number | null, eenheid = "") => (x === null ? "—" : `${x.toLocaleString("nl-NL")}${eenheid}`);

function verbruik(u: UitvoeringRdw) {
  if (u.aandrijving === "elektrisch") return n(u.verbruikWltp, " kWh");
  if (u.aandrijving === "plug-in hybride")
    return (
      <span title={u.verbruikLegeAccuHerkomst ? `accu leeg: ${u.verbruikLegeAccuHerkomst.afgeleid} kentekens afgeleid uit het gewogen verbruik, ${u.verbruikLegeAccuHerkomst.rdw} officieel (RDW)` : undefined}>
        {n(u.elektrischVerbruikWltp, " kWh")} · accu leeg {n(u.verbruikWltp, " l")}
        {u.verbruikLegeAccuHerkomst && u.verbruikLegeAccuHerkomst.afgeleid > 0 ? "*" : ""}{" "}
        <span className="uitleg">(gewogen {n(u.verbruikGewogenWltp, " l")})</span>
      </span>
    );
  return n(u.verbruikWltp, " l");
}

// Datadekking: welke criteria al gevuld zijn (Fase 2 bouwt dit stap voor stap op).
const criteria: [string, string][] = [
  ["Specificaties (RDW)", "gevuld"],
  ["Catalogusprijs (RDW)", "gevuld"],
  ["Verbruik / CO₂ / actieradius (RDW, WLTP)", "gevuld (plug-in hybride met lege accu: afgeleid*)"],
  ["Betrouwbaarheid (RDW APK-gebreken, bouwjaar 2014–2022)", "gevuld"],
  ["Euro NCAP (sterren + testjaar)", "gevuld"],
  ["Onderhoud en banden", "gevuld (rekenmodel, indicatief)"],
  ["Verzekering", "marktgemiddelde per dekking; geen verschil per model"],
  ["Restwaarde / occasionwaarde", "generieke curve (BPM-afschrijvingstabel + km-correctie), niet per model"],
];

export default function Modellen() {
  return (
    <main>
      <Nav />
      <h1>Dataset: {modellen.length} modellen</h1>
      <p className="sub">
        Gekozen op aantal registraties sinds 2019 ({selectie.dekkingGekozen.toLocaleString("nl-NL")}% van {selectie.aantalRegistratiesGeteld.toLocaleString("nl-NL")}{" "}
        personenauto&apos;s), zonder handmatige selectie. Specificaties: medianen van de meest recent geregistreerde exemplaren per aandrijving.
        Bron: RDW Open Data, peildatum {rdw.peildatum}.
      </p>

      <h2>Datadekking</h2>
      <table>
        <tbody>
          {criteria.map(([c, s]) => (
            <tr key={c}>
              <td>{c}</td>
              <td className="b">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Modellen (volgorde: aantal registraties)</h2>
      <div className="tabel-scroll">
        <table className="dataset">
          <thead>
            <tr>
              <th>#</th>
              <th>Model</th>
              <th>Aandrijving</th>
              <th className="b">Catalogusprijs</th>
              <th className="b">Massa rijklaar</th>
              <th className="b">Verbruik /100 km</th>
              <th className="b">Actieradius</th>
              <th className="b">Trekgewicht</th>
              <th className="b">Steekproef</th>
              <th className="b">Betrouwbaarheid</th>
              <th className="b">Euro NCAP</th>
              <th className="b">Onderhoud + banden /jr</th>
            </tr>
          </thead>
          <tbody>
            {modellen.flatMap((m) => {
              const b = betrouwbaarheidModel(m.id);
              const v = veiligheidModel(m.id);
              return m.uitvoeringen.map((u, i) => (
                <tr key={`${m.id}-${u.aandrijving}`} className={i === 0 ? "nieuw-model" : ""}>
                  <td>{i === 0 ? m.rang : ""}</td>
                  <td>{i === 0 ? `${m.merk} ${m.model}` : ""}</td>
                  <td>{u.aandrijving}</td>
                  <td className="b">{eur(u.catalogusprijs)}</td>
                  <td className="b">{n(u.massaRijklaar, " kg")}</td>
                  <td className="b">{verbruik(u)}</td>
                  <td className="b">{n(u.actieradiusWltpKm, " km")}</td>
                  <td className="b">{n(u.trekgewichtGeremd, " kg")}</td>
                  <td className="b uitleg">
                    {u.steekproef} · {u.periode[0] === u.periode[1] ? u.periode[0] : `${u.periode[0]}–${u.periode[1]}`}
                  </td>
                  <td className="b">
                    {i > 0 ? "" : b ? (
                      <span title={`${b.werkelijk} keuringen met gebrek, ${b.verwacht} verwacht (${b.keuringen} keuringen)`}>
                        {b.score} <span className="uitleg">({b.verhouding.toLocaleString("nl-NL")}× · {b.zekerheid})</span>
                      </span>
                    ) : (
                      <span className="uitleg">onvoldoende data</span>
                    )}
                  </td>
                  <td className="b">
                    {i > 0 ? "" : v ? (
                      <a href={v.geldend.url} title={`score ${v.score} · ${v.alle.map((x) => `${x.testjaar}: ${x.sterren}★`).join(", ")}`}>
                        {v.geldend.sterren}★ ({v.geldend.testjaar}){v.geldend.verlopen ? " verlopen" : ""}
                      </a>
                    ) : (
                      <span className="uitleg">geen test</span>
                    )}
                  </td>
                  <td className="b">
                    {(() => {
                      const elektrisch = u.aandrijving === "elektrisch";
                      const o = onderhoudPerJaar({ elektrisch, kmPerJaar: VOORBEELD_KM, leeftijdJaar: 0 });
                      const bd = u.massaRijklaar === null ? null : bandenPerJaar({ elektrisch, massaRijklaar: u.massaRijklaar, kmPerJaar: VOORBEELD_KM });
                      return bd ? <span title={`${o.uitleg}\n${bd.uitleg}`}>{eur(o.bedrag + bd.bedrag)}</span> : "—";
                    })()}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <p className="disclaimer">
        Catalogusprijs is incl. btw en BPM en inclusief de fabrieksopties van de geregistreerde auto&apos;s, dus geen vanafprijs. WLTP-verbruik is
        een laboratoriumwaarde; in de praktijk ligt het verbruik meestal hoger. &quot;Hybride&quot; omvat ook mild-hybrides (RDW-klasse NOVC-HEV).
        Betrouwbaarheid: score 0–100 (50 = gemiddeld) uit APK-gebreken t.o.v. auto&apos;s van hetzelfde bouwjaar en dezelfde leeftijd; tussen haakjes
        de verhouding (1× = gemiddeld) en de statistische zekerheid. APK-venster {apkHerkomst.venster.vanaf}–{apkHerkomst.venster.tot}; methode in
        docs/methodiek.md §2.2. Score geldt per model, niet per aandrijving.
        <br />
        Euro NCAP: aantal sterren en testjaar van de nieuwste test, met link naar de uitslag (bron: euroncap.com, peildatum {ncapHerkomst.peildatum}).
        Sterren uit verschillende jaren zijn niet goed vergelijkbaar, want de test wordt steeds strenger; &quot;verlopen&quot; betekent dat Euro NCAP de
        uitslag na 6 jaar niet meer laat gelden.
        <br />
        * Plug-in hybride met lege accu: RDW publiceert dit verbruik zelden; wij leiden het af uit het gewogen WLTP-verbruik en de elektrische
        actieradius (methodiek §2.4, gecontroleerd tegen 2.178 auto&apos;s met een officiële waarde: mediane afwijking +1%).
        <br />
        Onderhoud + banden: indicatief rekenmodel voor een nieuwe auto bij {VOORBEELD_KM.toLocaleString("nl-NL")} km per jaar (uurtarief ANWB, verder
        eigen aannames in src/regels/aannames.ts). Verschilt alleen naar aandrijving en gewicht, niet naar merk.
      </p>
    </main>
  );
}
