import selectie from "../../data/modelselectie.json";
import rdw from "../../data/modellen-rdw.json";
import type { ModelRdw, UitvoeringRdw } from "@/data/types";
import { Nav } from "../nav";
import { apkHerkomst, betrouwbaarheidModel } from "@/data/betrouwbaarheid-data";

const modellen = rdw.modellen as ModelRdw[];
const eur = (x: number | null) => (x === null ? "—" : x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }));
const n = (x: number | null, eenheid = "") => (x === null ? "—" : `${x.toLocaleString("nl-NL")}${eenheid}`);

function verbruik(u: UitvoeringRdw) {
  if (u.aandrijving === "elektrisch") return n(u.verbruikWltp, " kWh");
  if (u.aandrijving === "plug-in hybride") return `${n(u.elektrischVerbruikWltp, " kWh")} / gewogen ${n(u.verbruikGewogenWltp, " l")}`;
  return n(u.verbruikWltp, " l");
}

// Datadekking: welke criteria al gevuld zijn (Fase 2 bouwt dit stap voor stap op).
const criteria: [string, string][] = [
  ["Specificaties (RDW)", "gevuld"],
  ["Catalogusprijs (RDW)", "gevuld"],
  ["Verbruik / CO₂ / actieradius (RDW, WLTP)", "gevuld (plug-in hybride zonder accu: ontbreekt)"],
  ["Betrouwbaarheid (RDW APK-gebreken, bouwjaar 2014–2022)", "gevuld"],
  ["Euro NCAP", "nog te doen"],
  ["Onderhoud, banden, verzekering", "nog te doen (eigen dataset)"],
  ["Restwaarde / occasion-curves", "nog te doen (schatting)"],
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
            </tr>
          </thead>
          <tbody>
            {modellen.flatMap((m) => {
              const b = betrouwbaarheidModel(m.id);
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
      </p>
    </main>
  );
}
