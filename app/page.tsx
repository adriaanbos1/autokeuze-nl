"use client";

import { useMemo, useRef, useState } from "react";
import { Nav } from "./nav";
import { Financiering } from "./financiering";
import {
  alleModellen,
  datasetPeildatum,
  gezinsprofiel,
  nietGescoord,
  rangschik,
  soortTekst,
  STANDAARD_ZAKELIJK,
  toelichting,
  kostenPerMaand,
  type ProfielKosten,
  type Intake,
  type Resultaat,
  type Soort,
} from "@/data/ranking";
import { occasionHerkomst } from "@/data/occasions-data";
import type { Aandrijvingstype } from "@/data/types";
import { ncapHerkomst, veiligheidModel } from "@/data/ncap-data";
import { startGewichten, type Gewichten } from "@/engine";
import { CRITERIA, criteriumNaam, VERSIE, type Criterium, type Profiel } from "@/regels/methodiek";
import { regels, type Provincie } from "@/regels/regels-nl";
import { aannames } from "@/regels/aannames";

const eur = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
const provincies = Object.keys(regels.mrb.opcenten2026.waarde).map((p) => [p, p.replace(/(^|-)\w/g, (s) => s.toUpperCase())]) as [Provincie, string][];
const AANDRIJVINGEN: [Aandrijvingstype, string][] = [
  ["benzine", "Benzine"],
  ["hybride", "Hybride"],
  ["plug-in hybride", "Plug-in hybride"],
  ["elektrisch", "Elektrisch"],
];
// Criteria zonder data per model in v1: schuifje uit, met uitleg.
const ZONDER_DATA: Partial<Record<Criterium, string>> = {
  REST: "telt nog niet mee: de restwaardecurve is voor elk model gelijk (wel in de kosten)",
  COMF: "telt nog niet mee: geen objectieve bron",
};

const PROFIELEN: [Profiel, string][] = [
  ["particulier", "Privé: ik kies en betaal zelf"],
  ["zzp", "ZZP'er of eenmanszaak"],
  ["leaserijder", "Auto van de zaak (leaserijder)"],
];
const STARTBUDGET: Record<Profiel, number> = { particulier: 750, zzp: 600, leaserijder: 250 };
const BUDGETVRAAG: Record<Profiel, string> = {
  particulier: "Budget per maand, alles inbegrepen (€)",
  zzp: "Wat mag de auto je netto per maand kosten? (€)",
  leaserijder: "Wat mag de auto je netto per maand kosten? (€)",
};

const STANDAARD: Intake = {
  profiel: "particulier",
  soort: "beide",
  maxLeeftijdJaar: 8,
  maxKmStand: null,
  zakelijk: STANDAARD_ZAKELIJK,
  kmPerJaar: 15000,
  langsteRitKm: 150,
  maandbudget: 750,
  maxAankoopprijs: null,
  personen: 2,
  kinderen: false,
  thuisladen: true,
  trekgewicht: 0,
  provincie: "utrecht",
  looptijdMaanden: 60,
  aandrijvingen: ["benzine", "hybride", "plug-in hybride", "elektrisch"],
  dekking: "allrisk",
  eigenPremiePerMaand: null,
  startjaar: new Date().getFullYear(),
};

function Getal({
  label,
  hulp,
  waarde,
  zet,
  min = 0,
  stap = 1,
}: {
  label: string;
  hulp?: string;
  waarde: number;
  zet: (n: number) => void;
  min?: number;
  stap?: number;
}) {
  return (
    <label>
      {label}
      <input type="number" inputMode="numeric" min={min} step={stap} value={waarde} onChange={(e) => zet(Math.max(min, Number(e.target.value)))} />
      {hulp && <span className="uitleg">{hulp}</span>}
    </label>
  );
}

function JaNee({ label, waarde, zet }: { label: string; waarde: boolean; zet: (b: boolean) => void }) {
  return (
    <fieldset className="janee">
      <legend>{label}</legend>
      <button type="button" className={waarde ? "gekozen" : ""} aria-pressed={waarde} onClick={() => zet(true)}>
        Ja
      </button>
      <button type="button" className={!waarde ? "gekozen" : ""} aria-pressed={!waarde} onClick={() => zet(false)}>
        Nee
      </button>
    </fieldset>
  );
}

function Intakeformulier({ intake, zet }: { intake: Intake; zet: (i: Intake) => void }) {
  const z =
    <K extends keyof Intake>(k: K) =>
    (v: Intake[K]) =>
      zet({ ...intake, [k]: v });
  const zz = (v: Partial<Intake["zakelijk"]>) => zet({ ...intake, zakelijk: { ...intake.zakelijk, ...v } });
  return (
    <>
      <fieldset className="profiel">
        <legend>Voor wie is de auto?</legend>
        {PROFIELEN.map(([p, t]) => (
          <label key={p} className="radio">
            <input type="radio" name="profiel" checked={intake.profiel === p} onChange={() => zet({ ...intake, profiel: p, maandbudget: STARTBUDGET[p] })} />{" "}
            {t}
          </label>
        ))}
      </fieldset>

      {intake.profiel !== "particulier" && (
        <>
          <h2>{intake.profiel === "zzp" ? "Je onderneming" : "Je situatie"}</h2>
          <div className="velden">
            <Getal
              label={intake.profiel === "zzp" ? "Verwachte winst per jaar (€)" : "Bruto jaarinkomen (€)"}
              hulp="Bepaalt je belastingtarief. We bewaren niets."
              waarde={intake.zakelijk.inkomen}
              zet={(n) => zz({ inkomen: n })}
              stap={1000}
            />
            {intake.profiel === "leaserijder" ? (
              <>
                <Getal
                  label="Eigen bijdrage per maand (€)"
                  waarde={intake.zakelijk.eigenBijdragePerMaand}
                  zet={(n) => zz({ eigenBijdragePerMaand: n })}
                  stap={10}
                />
                <label>
                  Wanneer krijg je de auto?
                  <select value={intake.zakelijk.jaarIngebruikname} onChange={(e) => zz({ jaarIngebruikname: Number(e.target.value) })}>
                    <option value={2026}>in 2026</option>
                    <option value={2027}>in 2027</option>
                  </select>
                  <span className="uitleg">Het bijtellingspercentage ligt 60 maanden vast vanaf de eerste toelating.</span>
                </label>
              </>
            ) : (
              <>
                <Getal
                  label="Deel van je kilometers dat zakelijk is (%)"
                  hulp="Woon-werk telt voor de inkomstenbelasting als zakelijk."
                  waarde={Math.round(intake.zakelijk.zakelijkAandeel * 100)}
                  zet={(n) => zz({ zakelijkAandeel: Math.min(100, n) / 100 })}
                  stap={5}
                />
                <JaNee label="Btw-plichtig?" waarde={intake.zakelijk.btwPlichtig} zet={(b) => zz({ btwPlichtig: b })} />
              </>
            )}
          </div>
          <p className="uitleg">
            Basisversie: alleen nieuwe auto&apos;s, gekocht (ZZP) of via de zaak (lease). Operational lease voor ondernemers, de DGA/bv en occasions met oudere
            bijtellingsregels volgen in Fase 4.
          </p>
        </>
      )}

      {intake.profiel === "particulier" && (
        <>
          <fieldset className="keuzeknoppen">
            <legend>Nieuw of tweedehands?</legend>
            {(
              [
                ["nieuw", "Nieuw"],
                ["occasion", "Occasion"],
                ["beide", "Allebei vergelijken"],
              ] as [Soort, string][]
            ).map(([v, t]) => (
              <button
                key={v}
                type="button"
                className={intake.soort === v ? "gekozen" : ""}
                aria-pressed={intake.soort === v}
                onClick={() => zet({ ...intake, soort: v })}
              >
                {t}
              </button>
            ))}
          </fieldset>
          {intake.soort !== "nieuw" && (
            <div className="velden">
              <label>
                Hoe oud mag de occasion maximaal zijn?
                <select value={intake.maxLeeftijdJaar} onChange={(e) => zet({ ...intake, maxLeeftijdJaar: Number(e.target.value) })}>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((j) => (
                    <option key={j} value={j}>
                      {j} jaar
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Maximale kilometerstand (optioneel)
                <input
                  type="number"
                  inputMode="numeric"
                  step={10000}
                  value={intake.maxKmStand ?? ""}
                  placeholder="geen maximum"
                  onChange={(e) => zet({ ...intake, maxKmStand: e.target.value ? Number(e.target.value) : null })}
                />
                <span className="uitleg">We rekenen met 15.000 km per jaar oud.</span>
              </label>
            </div>
          )}
        </>
      )}

      <h2>Hoe rijd je?</h2>
      <div className="velden">
        <Getal label="Kilometers per jaar" waarde={intake.kmPerJaar} zet={z("kmPerJaar")} stap={1000} />
        <Getal label="Langste rit die je regelmatig maakt (enkele reis, km)" waarde={intake.langsteRitKm} zet={z("langsteRitKm")} stap={10} />
        <JaNee label="Kun je thuis laden (eigen oprit of laadpunt)?" waarde={intake.thuisladen} zet={z("thuisladen")} />
        <Getal label="Trekgewicht nodig (kg, 0 = geen aanhanger)" waarde={intake.trekgewicht} zet={z("trekgewicht")} stap={100} />
      </div>

      <h2>Wie rijden er mee?</h2>
      <div className="velden">
        <Getal label="Aantal personen (meestal maximaal)" waarde={intake.personen} zet={z("personen")} min={1} />
        <JaNee label="Kinderen in het gezin?" waarde={intake.kinderen} zet={z("kinderen")} />
      </div>

      <h2>Wat mag het kosten?</h2>
      <div className="velden">
        <Getal
          label={BUDGETVRAAG[intake.profiel]}
          hulp={
            intake.profiel === "particulier"
              ? "Afschrijving, brandstof of laden, belasting, verzekering en onderhoud"
              : intake.profiel === "leaserijder"
                ? "Netto bijtelling plus eigen bijdrage"
                : "Na belastingvoordeel, auto zakelijk of privé (wat in jouw geval goedkoper is)"
          }
          waarde={intake.maandbudget}
          zet={z("maandbudget")}
          stap={25}
          min={25}
        />
        <label>
          {intake.profiel === "leaserijder" ? "Maximale cataloguswaarde volgens je leaseregeling (€, optioneel)" : "Maximale aankoopprijs (€, optioneel)"}
          <input
            type="number"
            inputMode="numeric"
            step={1000}
            value={intake.maxAankoopprijs ?? ""}
            placeholder="geen maximum"
            onChange={(e) => zet({ ...intake, maxAankoopprijs: e.target.value ? Number(e.target.value) : null })}
          />
        </label>
        {intake.profiel !== "leaserijder" && (
          <>
            <label>
              Hoe lang houd je de auto?
              <select value={intake.looptijdMaanden} onChange={(e) => zet({ ...intake, looptijdMaanden: Number(e.target.value) })}>
                {[3, 4, 5, 6, 7, 8].map((j) => (
                  <option key={j} value={j * 12}>
                    {j} jaar
                  </option>
                ))}
              </select>
            </label>
            <label>
              Provincie (voor de motorrijtuigenbelasting)
              <select value={intake.provincie} onChange={(e) => zet({ ...intake, provincie: e.target.value as Provincie })}>
                {provincies.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Verzekering
              <select value={intake.dekking} onChange={(e) => zet({ ...intake, dekking: e.target.value as Intake["dekking"] })}>
                <option value="allrisk">Allrisk</option>
                <option value="waPlus">WA+ (beperkt casco)</option>
                <option value="wa">WA</option>
              </select>
            </label>
            <label>
              Eigen premie per maand (€, optioneel)
              <input
                type="number"
                inputMode="decimal"
                value={intake.eigenPremiePerMaand ?? ""}
                placeholder={`gemiddeld ${eur2(aannames.verzekering.gemiddeldePerMaand.waarde[intake.dekking])}`}
                onChange={(e) => zet({ ...intake, eigenPremiePerMaand: e.target.value ? Number(e.target.value) : null })}
              />
            </label>
          </>
        )}
      </div>

      <fieldset className="aandrijving">
        <legend>Welke aandrijving wil je overwegen?</legend>
        {AANDRIJVINGEN.map(([a, t]) => (
          <label key={a} className="radio">
            <input
              type="checkbox"
              checked={intake.aandrijvingen.includes(a)}
              onChange={(e) => zet({ ...intake, aandrijvingen: e.target.checked ? [...intake.aandrijvingen, a] : intake.aandrijvingen.filter((x) => x !== a) })}
            />{" "}
            {t}
          </label>
        ))}
      </fieldset>
    </>
  );
}

function Schuifjes({ gewichten, zet, standaard }: { gewichten: Gewichten; zet: (g: Gewichten) => void; standaard: Gewichten }) {
  const mee = CRITERIA.filter((c) => !ZONDER_DATA[c]);
  const som = mee.reduce((s, c) => s + gewichten[c], 0) || 1;
  return (
    <details className="schuifjes">
      <summary>Wat vind jij belangrijk? (gewichten aanpassen)</summary>
      <p className="uitleg">De startwaarden horen bij jouw profiel. Schuif om ze aan te passen; het percentage is het aandeel in de eindscore.</p>
      {CRITERIA.map((c) => (
        <label key={c} className="schuif">
          <span>
            {criteriumNaam[c]} <b>{ZONDER_DATA[c] ? "—" : `${Math.round((100 * gewichten[c]) / som)}%`}</b>
          </span>
          <input
            type="range"
            min={0}
            max={40}
            step={5}
            value={ZONDER_DATA[c] ? 0 : gewichten[c]}
            disabled={!!ZONDER_DATA[c]}
            onChange={(e) => zet({ ...gewichten, [c]: Number(e.target.value) })}
          />
          {ZONDER_DATA[c] && <span className="uitleg">{ZONDER_DATA[c]}</span>}
        </label>
      ))}
      <button type="button" className="link" onClick={() => zet(standaard)}>
        Terug naar de startwaarden
      </button>
    </details>
  );
}

function Posten({ posten }: { posten: { label: string; bedrag: number; uitleg: string }[] }) {
  return (
    <table>
      <tbody>
        {posten.map((p) => (
          <tr key={p.label}>
            <td>
              {p.label}
              {p.uitleg && <div className="uitleg">{p.uitleg}</div>}
            </td>
            <td className="b">{eur2(p.bedrag)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Zakelijke profielen: hoe het nettobedrag tot stand komt (per jaar). */
function ProfielBerekening({ p }: { p: ProfielKosten }) {
  return (
    <details className="financiering">
      <summary>{p.varianten ? "Zakelijk of privé?" : "Hoe is de netto bijtelling berekend?"}</summary>
      <p className="uitleg">{p.uitleg}. Bedragen per jaar.</p>
      {p.varianten ? (
        <div className="scenarios">
          {p.varianten.map((v) => (
            <div key={v.naam} className={`scenario${v.perMaand === p.perMaand ? " laagst" : ""}`}>
              <h4>
                {v.naam}: {eur(v.perMaand)} per maand
              </h4>
              <Posten posten={v.posten} />
            </div>
          ))}
        </div>
      ) : (
        <Posten posten={p.posten} />
      )}
      <p className="uitleg">
        {p.varianten
          ? "In dit scenario is de variant met het blauwe kader het goedkoopst. Heffingskortingen en de afbouw daarvan zitten er nog niet in; kosten van geld laten we weg (gelijk in beide varianten). Laat je bij een definitief besluit adviseren."
          : "Tarief zonder heffingskortingen. Brandstof of laden betaalt in deze berekening je werkgever. Het percentage ligt 60 maanden vast."}
      </p>
    </details>
  );
}

function AutoKaart({ r, plek, eerste, gewichten }: { r: Resultaat; plek: number; eerste: Resultaat; gewichten: Gewichten }) {
  const t = toelichting(r, eerste, gewichten);
  // Criteria die normaal meetellen maar voor deze auto geen data hebben.
  const ontbreekt = nietGescoord(r.scores).filter((c) => !ZONDER_DATA[c] && gewichten[c] > 0 && c !== "FIT");
  const veil = veiligheidModel(r.id);
  return (
    <article className="autokaart">
      <div className="kop">
        <span className="plek">{plek}</span>
        <div>
          <h3>{r.naam}</h3>
          <div className="uitleg">
            {r.uitvoering.aandrijving} · {soortTekst(r)} · {r.occasion ? "geschatte prijs" : "catalogusprijs"} {eur(r.kosten.aankoopprijs)}
          </div>
        </div>
        <div className="eindscore" title="Eindscore op 100">
          {Math.round(r.eind.score)}
          <span>/100</span>
        </div>
      </div>
      <div className="groot">
        {eur(kostenPerMaand(r.kosten))} <span className="uitleg">{r.kosten.profiel ? r.kosten.profiel.label : "per maand alles inbegrepen"}</span>
      </div>
      {r.kosten.profiel?.pseudoEindheffingWerkgever ? (
        <p className="uitleg">
          Je werkgever betaalt voor deze auto vanaf 2027 {eur(r.kosten.profiel.pseudoEindheffingWerkgever)} per jaar pseudo-eindheffing (12% van de
          catalogusprijs, auto met CO₂-uitstoot). Dat kan je leasebudget beïnvloeden.
        </p>
      ) : null}
      {r.occasion && (
        <details>
          <summary>Hoe is de occasionprijs geschat?</summary>
          <p className="uitleg">
            {r.kosten.prijsUitleg} Echte vraagprijzen verschillen per auto, uitvoering, staat en verkoper; vergelijk altijd met het aanbod.
          </p>
        </details>
      )}
      {!r.binnenBudget && <div className="melding">Boven je budget. Er passen te weinig auto&apos;s binnen je budget; dit is de goedkoopste daarboven.</div>}
      <ul className="punten">
        {t.sterk.map((c) => (
          <li key={c} className="plus">
            <b>{criteriumNaam[c]}:</b> {r.scores[c]!.waarde}
          </li>
        ))}
        {t.zwak.map((c) => (
          <li key={c} className="min">
            <b>{criteriumNaam[c]}:</b> {r.scores[c]!.waarde}
          </li>
        ))}
      </ul>
      {ontbreekt.length > 0 && (
        <p className="uitleg ontbreekt">
          Geen data voor {ontbreekt.map((c) => criteriumNaam[c].toLowerCase()).join(" en ")}
          {r.occasion && ontbreekt.includes("VEIL") ? " (geen Euro NCAP-test gevonden uit of vóór dit bouwjaar)" : ""}. Dat telt niet mee; de andere criteria
          wegen daardoor zwaarder. Kijk hier zelf extra naar.
        </p>
      )}
      {t.achterstand && (
        <p className="uitleg">
          {t.verschil.toLocaleString("nl-NL")} punten achter op nummer 1, vooral door {criteriumNaam[t.achterstand.criterium].toLowerCase()} (
          {t.achterstand.punten.toLocaleString("nl-NL")} punten). Vind je dat minder belangrijk? Zet het schuifje lager.
        </p>
      )}
      <details>
        <summary>Hoe is de score berekend?</summary>
        <table>
          <tbody>
            {CRITERIA.map((c) => {
              const s = r.scores[c];
              const w = r.eind.effectieveGewichten[c];
              return (
                <tr key={c}>
                  <td>
                    {criteriumNaam[c]}
                    <div className="uitleg">
                      {s
                        ? `${s.waarde}. ${s.uitleg}`
                        : nietGescoord(r.scores).includes(c)
                          ? (ZONDER_DATA[c] ?? "onvoldoende data of niet van toepassing; telt niet mee")
                          : ""}
                    </div>
                  </td>
                  <td className="b">{s ? `${Math.round(s.score)}` : "—"}</td>
                  <td className="b uitleg">{w != null ? `× ${w}%` : ""}</td>
                </tr>
              );
            })}
            <tr>
              <td>
                <b>Eindscore</b>
                <div className="uitleg">Gewogen gemiddelde over de criteria met data ({Math.round(r.eind.datadekking * 100)}% van het gewicht had data).</div>
              </td>
              <td className="b">
                <b>{r.eind.score.toLocaleString("nl-NL")}</b>
              </td>
              <td />
            </tr>
          </tbody>
        </table>
        {veil && (
          <p className="uitleg">
            Euro NCAP-uitslag:{" "}
            <a href={veil.geldend.url} target="_blank" rel="noreferrer">
              euroncap.com
            </a>
          </p>
        )}
      </details>
      {!r.kosten.profiel && (
        <details>
          <summary>Hoe zijn de kosten berekend?</summary>
          <table>
            <tbody>
              {r.kosten.tco.posten.map((p) => (
                <tr key={p.label}>
                  <td>
                    {p.label}
                    <div className="uitleg">{p.uitleg}</div>
                  </td>
                  <td className="b">{eur2(p.bedrag)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b>Totaal per maand</b>
                  <div className="uitleg">
                    Contant gekocht, {r.kosten.tco.perKm.toLocaleString("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 3 })} per km.
                    Lenen of leasen: zie hieronder.
                  </div>
                </td>
                <td className="b">
                  <b>{eur2(r.kosten.tco.perMaand)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </details>
      )}
      {r.kosten.profiel ? (
        <ProfielBerekening p={r.kosten.profiel} />
      ) : (
        <Financiering key={`${r.id}-${r.occasion?.bouwjaar ?? 0}-${r.kosten.tco.perMaand}`} bezit={r.kosten.bezit} naam={r.naam} />
      )}
    </article>
  );
}

export default function Autokeuze() {
  const [intake, setIntake] = useState<Intake>(STANDAARD);
  const gezin = gezinsprofiel(intake);
  const occasion = intake.soort === "occasion";
  const standaard = useMemo(() => startGewichten(intake.profiel, { gezin, occasion }), [intake.profiel, gezin, occasion]);
  const [eigen, setEigen] = useState<Gewichten | null>(null);
  const gewichten = eigen ?? standaard;
  const [getoond, setGetoond] = useState(false);
  const resultatenRef = useRef<HTMLDivElement>(null);

  const ranglijst = useMemo(() => rangschik(intake, gewichten), [intake, gewichten]);
  const eerste = ranglijst.top[0];

  return (
    <main className="keuze">
      <Nav />
      <h1>Welke auto past bij jou?</h1>
      <p className="sub">
        Beantwoord een paar vragen. We rekenen de {alleModellen.length} meest geregistreerde modellen in Nederland door en laten zien welke in jouw situatie het
        beste scoren, en waarom. Alles draait in je browser; we bewaren niets.
      </p>

      <Intakeformulier intake={intake} zet={setIntake} />

      <button
        type="button"
        className="hoofdknop"
        onClick={() => {
          setGetoond(true);
          setTimeout(() => resultatenRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
        }}
      >
        Toon mijn top 3
      </button>

      {getoond && (
        <div ref={resultatenRef}>
          <h2>{ranglijst.top.length > 0 && ranglijst.top.length < 3 ? `Jouw top ${ranglijst.top.length}` : "Jouw top 3"}</h2>
          {intake.aandrijvingen.length === 0 ? (
            <p className="melding">Kies minstens één aandrijving.</p>
          ) : !eerste ? (
            <p className="melding">
              Geen enkele auto voldoet aan je eisen. Kijk hieronder waarom, en pas bijvoorbeeld het aantal personen of het trekgewicht aan.
            </p>
          ) : (
            <>
              <p className="uitleg">
                In dit scenario scoren deze auto&apos;s het hoogst. Dit is een vergelijking, geen advies: kijk ook zelf of de auto bij je past en maak een
                proefrit.
                {gezin && " Omdat je met 3 of meer personen of met kinderen rijdt, tellen veiligheid en ruimte zwaarder mee."}
                {occasion && " Omdat je een occasion zoekt, tellen betrouwbaarheid en onderhoud zwaarder mee."}
              </p>
              <Schuifjes gewichten={gewichten} zet={setEigen} standaard={standaard} />
              <div className="top">
                {ranglijst.top.map((r, n) => (
                  <AutoKaart key={r.id} r={r} plek={n + 1} eerste={eerste} gewichten={gewichten} />
                ))}
              </div>
            </>
          )}

          {ranglijst.lijst.length > 0 && (
            <details>
              <summary>Bekijk de volledige ranglijst ({ranglijst.lijst.length} modellen)</summary>
              <div className="tabel-scroll">
                <table className="ranglijst">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Model</th>
                      <th className="b">Score</th>
                      <th className="b">Per maand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranglijst.lijst.map((r, n) => (
                      <tr key={r.id}>
                        <td>{n + 1}</td>
                        <td>
                          {r.naam}{" "}
                          <span className="uitleg">
                            {r.uitvoering.aandrijving} · {soortTekst(r)}
                          </span>
                        </td>
                        <td className="b">{Math.round(r.eind.score)}</td>
                        <td className="b">
                          {eur(r.kosten.tco.perMaand)}
                          {!r.binnenBudget && <span className="uitleg"> boven budget</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="uitleg">
                Per model telt de uitvoering (aandrijving{intake.soort !== "nieuw" ? ", nieuw of bouwjaar" : ""}) die het hoogst scoort. Bij een gelijke
                afgeronde score staat de laagste maandprijs eerst, daarna alfabetisch.
              </p>
            </details>
          )}

          {ranglijst.uitgesloten.length > 0 && (
            <details>
              <summary>Niet meegenomen ({ranglijst.uitgesloten.length} uitvoeringen)</summary>
              <ul className="uitleg">
                {ranglijst.uitgesloten.map((u, n) => (
                  <li key={n}>
                    {u.naam} ({u.aandrijving}
                    {u.bouwjaren.length
                      ? `, bouwjaar ${u.bouwjaren.length > 1 ? `${Math.min(...u.bouwjaren)}–${Math.max(...u.bouwjaren)}` : u.bouwjaren[0]}`
                      : ", nieuw"}
                    ): {u.redenen.join(", ")}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <details>
            <summary>Wat zit er (nog) niet in?</summary>
            <ul className="uitleg">
              <li>
                De ranglijst rekent met contant kopen, zodat de volgorde niet afhangt van een financieringsproduct. Lenen en leasen vergelijk je per auto onder
                &quot;Kopen, lenen of leasen?&quot;.
              </li>
              <li>
                Occasions: per model en bouwjaar de nieuwprijs en specificaties van toen (RDW, {occasionHerkomst.peildatum}). De prijs is een schatting met een
                generieke afschrijvingscurve en 15.000 km per jaar; geen marktprijs. Verbruik van vóór 2019 is omgerekend uit de oudere NEDC-test.
              </li>
              <li>
                Prijzen zijn de mediane catalogusprijs van recent geregistreerde exemplaren (RDW, {datasetPeildatum}), inclusief opties en zonder kortingen.
              </li>
              <li>Verbruik is de officiële WLTP-opgave. In de praktijk ligt het vaak hoger, vooral in de winter. Daar corrigeren we nog niet voor.</li>
              <li>Restwaarde en onderhoud zijn rekenmodellen die niet per merk verschillen. Verzekering is voor elk model gelijk.</li>
              <li>BPM voor brandstofauto&apos;s rekenen we niet apart; die zit in de catalogusprijs.</li>
              <li>Euro NCAP: alleen sterren en testjaar, met link naar de bron ({ncapHerkomst.peildatum}).</li>
            </ul>
          </details>
        </div>
      )}

      <p className="disclaimer">
        AutoKeuze NL vergelijkt en rekent door op basis van jouw invoer, openbare data en de aannames die bij elke berekening staan. Dit is geen financieel
        advies en geen bemiddeling. Er zijn geen commerciële partners die de volgorde beïnvloeden. Methodiek versie {VERSIE}.
      </p>
    </main>
  );
}
