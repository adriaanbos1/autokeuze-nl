"use client";

import { useState } from "react";
import type { AutoBezit, Scenario, Vorm } from "@/engine";
import { scenariosVoor, standaardKeuzes, type FinancieringKeuzes } from "@/data/financiering";
import { aannames } from "@/regels/aannames";
import { regels } from "@/regels/regels-nl";

const eur = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
const pct = (x: number) => `${(x * 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 })}%`;
const MAX = regels.krediet.maximaleKredietvergoeding.waarde;

const NAAM: Record<Vorm, string> = {
  contant: "Contant kopen",
  lening: "Persoonlijke lening",
  financialLease: "Financial lease (huurkoop)",
  privateLease: "Private lease",
};

function Schuif({ label, waarde, max, stap, zet }: { label: string; waarde: number; max: number; stap: number; zet: (n: number) => void }) {
  return (
    <label className="schuif">
      <span>
        {label} <b>{eur(waarde)}</b>
      </span>
      <input type="range" min={0} max={max} step={stap} value={Math.min(waarde, max)} onChange={(e) => zet(Number(e.target.value))} />
    </label>
  );
}

function Rente({ label, waarde, zet }: { label: string; waarde: number; zet: (n: number) => void }) {
  return (
    <label>
      {label}
      <input type="number" inputMode="decimal" step={0.1} min={0} value={Math.round(waarde * 1000) / 10} onChange={(e) => zet(Number(e.target.value) / 100)} />
      {waarde > MAX && <span className="uitleg ontbreekt">Boven het wettelijk maximum van {pct(MAX)} voor consumptief krediet.</span>}
    </label>
  );
}

function kanttekeningen(s: Scenario): string[] {
  switch (s.vorm) {
    case "contant":
      return ["Je bent eigenaar en kunt langer doorrijden of eerder verkopen.", "Het gemiste rendement op je spaargeld telt mee als kosten."];
    case "lening":
      return [`Totale rente ${eur(s.totaleRente!)}.`, "Een lening wordt geregistreerd bij het BKR en telt mee bij een hypotheekaanvraag."];
    case "financialLease":
      return [
        `Totale rente ${eur(s.totaleRente!)}, inclusief rente over de slottermijn.`,
        s.restschuldRisico! > 0
          ? `Let op: de slottermijn ligt ${eur(s.restschuldRisico!)} boven de verwachte waarde van de auto. Verkoop dekt de slottermijn dan waarschijnlijk niet.`
          : "De verwachte waarde aan het eind dekt de slottermijn.",
        "Je wordt pas eigenaar na de laatste termijn. Registratie bij het BKR.",
      ];
    case "privateLease":
      return [
        s.leaseprijsGeschat
          ? "Leaseprijs is onze eigen schatting op kostprijsbasis, geen aanbod. Vul een echte offerte in voor een eerlijke vergelijking."
          : "Leaseprijs uit jouw offerte.",
        `Inclusief verwacht eigen risico bij schade (${aannames.privateLease.schadesPerJaar.waarde.toLocaleString("nl-NL")} schade per jaar × ${eur(aannames.privateLease.eigenRisico.waarde)}). Meer kilometers dan je bundel kosten extra.`,
        "Je bent geen eigenaar. Private lease wordt bij het BKR geregistreerd en telt mee bij een hypotheekaanvraag.",
      ];
  }
}

export function Financiering({ bezit, naam }: { bezit: AutoBezit; naam: string }) {
  const [k, setK] = useState<FinancieringKeuzes>(() => standaardKeuzes(bezit));
  const z = <K extends keyof FinancieringKeuzes>(veld: K) => (v: FinancieringKeuzes[K]) => setK({ ...k, [veld]: v });
  const scenarios = scenariosVoor(bezit, k);
  const goedkoopst = [...scenarios].sort((a, b) => a.tco.perMaand - b.tco.perMaand)[0];
  const jaar = bezit.maanden / 12;

  return (
    <details className="financiering">
      <summary>Kopen, lenen of leasen?</summary>
      <p className="uitleg">
        Dezelfde {naam}, {jaar} jaar, {bezit.kmPerJaar.toLocaleString("nl-NL")} km per jaar. &quot;Kost per maand&quot; is inclusief waardeverlies; &quot;je betaalt per
        maand&quot; is wat er van je rekening gaat.
      </p>
      <div className="velden">
        <Schuif label="Eigen geld bij een lening" waarde={k.eigenGeld} max={bezit.aankoopprijs} stap={500} zet={z("eigenGeld")} />
        <Rente label="Rente lening (% per jaar)" waarde={k.leningRente} zet={z("leningRente")} />
        <Schuif label="Aanbetaling financial lease" waarde={k.aanbetaling} max={bezit.aankoopprijs} stap={500} zet={z("aanbetaling")} />
        <Schuif label="Slottermijn" waarde={k.slottermijn} max={Math.max(0, bezit.aankoopprijs - k.aanbetaling)} stap={500} zet={z("slottermijn")} />
        <Rente label="Rente financial lease (% per jaar)" waarde={k.flRente} zet={z("flRente")} />
        <label>
          Private lease: maandprijs uit je offerte (optioneel)
          <input
            type="number"
            inputMode="decimal"
            value={k.leaseOfferte ?? ""}
            placeholder="leeg = onze schatting"
            onChange={(e) => setK({ ...k, leaseOfferte: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
      </div>

      <div className="scenarios">
        {scenarios.map((s) => (
          <div key={s.vorm} className={`scenario${s === goedkoopst ? " laagst" : ""}`}>
            <h4>{NAAM[s.vorm]}</h4>
            <table>
              <tbody>
                <tr>
                  <td>Kost per maand</td>
                  <td className="b">
                    <b>{eur(s.tco.perMaand)}</b>
                  </td>
                </tr>
                <tr>
                  <td>Je betaalt per maand</td>
                  <td className="b">{eur(s.perMaandBetalen)}</td>
                </tr>
                <tr>
                  <td>Nu in één keer</td>
                  <td className="b">{eur(s.nuBetalen)}</td>
                </tr>
                {s.eindeBetalen > 0 && (
                  <tr>
                    <td>Slottermijn aan het eind</td>
                    <td className="b">{eur(s.eindeBetalen)}</td>
                  </tr>
                )}
                <tr>
                  <td>Je hebt aan het eind</td>
                  <td className="b">{s.bezitEinde ? `auto t.w.v. ca. ${eur(s.bezitEinde)}` : "geen auto"}</td>
                </tr>
              </tbody>
            </table>
            <ul className="uitleg">
              {kanttekeningen(s).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <details>
              <summary>Hoe is dit berekend?</summary>
              <table>
                <tbody>
                  {s.tco.posten.map((p) => (
                    <tr key={p.label}>
                      <td>
                        {p.label}
                        <div className="uitleg">{p.uitleg}</div>
                      </td>
                      <td className="b">{eur2(p.bedrag)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {s.leaseprijsPosten && (
                <>
                  <p className="uitleg">Opbouw van onze geschatte leaseprijs ({eur2(s.leaseprijs!)}):</p>
                  <table>
                    <tbody>
                      {s.leaseprijsPosten.map((p) => (
                        <tr key={p.label}>
                          <td>
                            {p.label}
                            <div className="uitleg">{p.uitleg}</div>
                          </td>
                          <td className="b">{eur2(p.bedrag)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="uitleg">{aannames.privateLease.opslag.toelichting}</p>
                </>
              )}
            </details>
          </div>
        ))}
      </div>
      <p className="uitleg">
        In dit scenario is <b>{NAAM[goedkoopst.vorm].toLowerCase()}</b> het goedkoopst per maand. Dat is een rekensom, geen advies: let ook op wat je aan het eind hebt, je
        vrijheid om te verkopen en het effect op een hypotheek. <b>Let op! Geld lenen kost geld.</b> Wij bemiddelen niet in krediet of lease.
      </p>
    </details>
  );
}
