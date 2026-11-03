"use client";

import { useState, type ReactNode } from "react";
import {
  bijtellingPerJaar,
  energiekostenPerJaar,
  gemiddeldeLaadprijs,
  mrbPersonenauto,
  nettoBijtellingWerknemer,
  pseudoEindheffing,
  rond2,
  tcoContant,
  tcoFinancialLease,
  tcoLening,
  tcoPrivateLease,
  zzpPrive,
  zzpZakelijk,
  type Aandrijving,
  type AutoBezit,
  type Brandstof,
  type Post,
} from "@/engine";
import { regels, type Provincie } from "@/regels/regels-nl";
import { Nav } from "./nav";

const eur = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });
const eurKm = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 3 });

function Getal({ label, waarde, zet, stap = 1 }: { label: string; waarde: number; zet: (n: number) => void; stap?: number }) {
  return (
    <label>
      {label}
      <input type="number" step={stap} value={waarde} onChange={(e) => zet(Number(e.target.value))} />
    </label>
  );
}

function Keuze<T extends string>({ label, waarde, zet, opties }: { label: string; waarde: T; zet: (v: T) => void; opties: [T, string][] }) {
  return (
    <label>
      {label}
      <select value={waarde} onChange={(e) => zet(e.target.value as T)}>
        {opties.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Kaart({ titel, bedrag, sub, posten, extra }: { titel: string; bedrag: number; sub?: string; posten?: Post[]; extra?: ReactNode }) {
  return (
    <div className="kaart">
      <h3>{titel}</h3>
      <div className="groot">{eur(bedrag)}</div>
      {sub && <div className="uitleg">{sub}</div>}
      {extra}
      {posten && (
        <details>
          <summary>Hoe is dit berekend?</summary>
          <table>
            <tbody>
              {posten.map((p) => (
                <tr key={p.label}>
                  <td>
                    {p.label}
                    {p.uitleg && <div className="uitleg">{p.uitleg}</div>}
                  </td>
                  <td className="b">{eur(p.bedrag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

const provincies = Object.keys(regels.mrb.opcenten2026.waarde).map((p) => [p, p.replace(/(^|-)\w/g, (s) => s.toUpperCase())]) as [Provincie, string][];

export default function Rekenpagina() {
  // ── Auto en gebruik
  const [prijs, setPrijs] = useState(35000);
  const [restPct, setRestPct] = useState(45);
  const [maanden, setMaanden] = useState(60);
  const [km, setKm] = useState(15000);
  const [brandstof, setBrandstof] = useState<Brandstof>("elektrisch");
  const [verbruik, setVerbruik] = useState(16);
  const [prijsBenzine, setPrijsBenzine] = useState(2.3);
  const [thuisPct, setThuisPct] = useState(80);
  const [massa, setMassa] = useState(1650);
  const [provincie, setProvincie] = useState<Provincie>("utrecht");
  const [verzekering, setVerzekering] = useState(75);
  const [onderhoud, setOnderhoud] = useState(45);
  const [rendement, setRendement] = useState(2.5);
  // ── Financiering
  const [leenBedrag, setLeenBedrag] = useState(25000);
  const [rente, setRente] = useState(7.5);
  const [slot, setSlot] = useState(12000);
  const [leaseprijs, setLeaseprijs] = useState(489);
  const [eigenRisico, setEigenRisico] = useState(500);
  // ── Zakelijk
  const [jaarToelating, setJaarToelating] = useState(2026);
  const [tarief, setTarief] = useState(49.5);
  const [eigenBijdrage, setEigenBijdrage] = useState(0);
  const [zakKm, setZakKm] = useState(10000);
  const [zzpTarief, setZzpTarief] = useState(35);

  const isEv = brandstof === "elektrisch" || brandstof === "waterstof";
  const eenheidsprijs = isEv
    ? gemiddeldeLaadprijs({ thuis: thuisPct / 100, publiek: 1 - thuisPct / 100, snel: 0, prijsThuis: 0.27, prijsPubliek: 0.55, prijsSnel: 0 })
    : prijsBenzine;
  const energieJaar = energiekostenPerJaar(km, verbruik, eenheidsprijs);
  const mrb = mrbPersonenauto({ massaRijklaar: massa, brandstof, provincie, jaar: 2026 });
  const restwaarde = rond2((prijs * restPct) / 100);

  const auto: AutoBezit = {
    aankoopprijs: prijs,
    restwaardeEinde: restwaarde,
    maanden,
    kmPerJaar: km,
    rendement: rendement / 100,
    lopend: { energie: rond2(energieJaar / 12), mrb: rond2(mrb.perJaar / 12), verzekering, onderhoudEnBanden: onderhoud },
  };

  const geldig = prijs > 0 && maanden > 0 && km > 0 && leenBedrag <= prijs;
  const contant = tcoContant(auto);
  const lening = geldig ? tcoLening(auto, { hoofdsom: leenBedrag, jaarrente: rente / 100, maanden }) : null;
  const fl = geldig ? tcoFinancialLease(auto, { hoofdsom: leenBedrag, jaarrente: rente / 100, slottermijn: slot }) : null;
  const pl = tcoPrivateLease({ leaseprijs, kmPerJaar: km, energie: auto.lopend.energie, eigenRisico, schadesPerJaar: 0.12 });

  const aandrijving: Aandrijving = brandstof === "elektrisch" ? "batterij" : brandstof === "waterstof" ? "waterstof" : "brandstof";
  const bijt = bijtellingPerJaar({ cataloguswaarde: prijs, aandrijving, jaarEersteToelating: jaarToelating });
  const netto = nettoBijtellingWerknemer(bijt.perJaar, tarief / 100, eigenBijdrage * 12);
  const pseudo = pseudoEindheffing(prijs, aandrijving, jaarToelating);

  const zzpInvoer = {
    aankoopprijsIncl: prijs,
    restwaardeEindeIncl: restwaarde,
    looptijdJaren: maanden / 12,
    cataloguswaarde: prijs,
    aandrijving,
    jaarEersteToelating: jaarToelating,
    energieIncl: energieJaar,
    onderhoudIncl: onderhoud * 12,
    mrb: mrb.perJaar,
    verzekering: verzekering * 12,
    zakelijkeKm: Math.min(zakKm, km),
    priveKm: Math.max(0, km - zakKm),
    tarief: zzpTarief / 100,
    btwPlichtig: true,
  };
  const zZak = zzpZakelijk(zzpInvoer);
  const zPriv = zzpPrive(zzpInvoer);

  return (
    <main>
      <Nav />
      <h1>AutoKeuze NL: rekenpagina</h1>
      <p className="sub">Testversie van de reken-engine (Fase 1). Vul waarden in en klap per bedrag de berekening open.</p>

      <h2>Auto en gebruik</h2>
      <div className="velden">
        <Getal label="Aankoopprijs / cataloguswaarde (€)" waarde={prijs} zet={setPrijs} stap={500} />
        <Getal label="Restwaarde aan het eind (% van prijs)" waarde={restPct} zet={setRestPct} />
        <Getal label="Looptijd (maanden)" waarde={maanden} zet={setMaanden} stap={12} />
        <Getal label="Km per jaar" waarde={km} zet={setKm} stap={1000} />
        <Keuze
          label="Brandstof"
          waarde={brandstof}
          zet={setBrandstof}
          opties={[
            ["elektrisch", "Elektrisch"],
            ["benzine", "Benzine / hybride"],
            ["diesel", "Diesel"],
            ["waterstof", "Waterstof"],
            ["overig", "LPG / overig"],
          ]}
        />
        <Getal label={isEv ? "Verbruik (kWh/100 km)" : "Verbruik (l/100 km)"} waarde={verbruik} zet={setVerbruik} stap={0.1} />
        {isEv ? (
          <Getal label="Thuisladen (%), rest publiek" waarde={thuisPct} zet={(n) => setThuisPct(Math.min(100, Math.max(0, n)))} />
        ) : (
          <Getal label="Brandstofprijs (€/l)" waarde={prijsBenzine} zet={setPrijsBenzine} stap={0.01} />
        )}
        <Getal label="Massa rijklaar (kg)" waarde={massa} zet={setMassa} stap={10} />
        <Keuze label="Provincie" waarde={provincie} zet={setProvincie} opties={provincies} />
        <Getal label="Verzekering (€/mnd)" waarde={verzekering} zet={setVerzekering} />
        <Getal label="Onderhoud + banden (€/mnd)" waarde={onderhoud} zet={setOnderhoud} />
        <Getal label="Gemist rendement spaargeld (%/jr)" waarde={rendement} zet={setRendement} stap={0.1} />
      </div>

      <div className="kaarten">
        <Kaart
          titel="Motorrijtuigenbelasting"
          bedrag={mrb.perKwartaal}
          sub={
            `per kwartaal · ${eur(mrb.perJaar)} per jaar (2026)` +
            (mrb.posten.kortingFactor < 1 ? ` · emissievrij: je betaalt ${Math.round(mrb.posten.kortingFactor * 100)}% van het totaal` : "")
          }
          posten={[
            { label: "Rijksdeel", bedrag: mrb.posten.rijksdeel, uitleg: "art. 23 Wet MRB" },
            { label: "Brandstoftoeslag", bedrag: mrb.posten.brandstoftoeslag, uitleg: "" },
            { label: "Fijnstoftoeslag", bedrag: mrb.posten.fijnstoftoeslag, uitleg: "diesel zonder roetfilter" },
            { label: "Provinciale opcenten", bedrag: mrb.posten.opcenten, uitleg: `${regels.mrb.opcenten2026.waarde[provincie]} opcenten` },
          ]}
        />
        <Kaart titel="Energie" bedrag={auto.lopend.energie} sub={`per maand · ${eur(energieJaar)} per jaar · ${eenheidsprijs.toFixed(3)} per eenheid`} />
      </div>

      <h2>Financieringsvormen (totale kosten per maand)</h2>
      <div className="velden">
        <Getal label="Te lenen / financieren (€)" waarde={leenBedrag} zet={setLeenBedrag} stap={500} />
        <Getal label="Rente (%/jr)" waarde={rente} zet={setRente} stap={0.1} />
        <Getal label="Slottermijn financial lease (€)" waarde={slot} zet={setSlot} stap={500} />
        <Getal label="Private-leaseprijs (€/mnd)" waarde={leaseprijs} zet={setLeaseprijs} />
        <Getal label="Eigen risico lease (€)" waarde={eigenRisico} zet={setEigenRisico} stap={50} />
      </div>
      {!geldig && <p className="uitleg">Het te lenen bedrag mag niet hoger zijn dan de aankoopprijs.</p>}
      <div className="kaarten">
        <Kaart titel="Contant" bedrag={contant.perMaand} sub={`${eurKm(contant.perKm)} per km`} posten={contant.posten} />
        {lening && (
          <Kaart titel="Persoonlijke lening" bedrag={lening.perMaand} sub={`termijn ${eur(lening.maandtermijn)} · ${eurKm(lening.perKm)} per km`} posten={lening.posten} />
        )}
        {fl && (
          <Kaart
            titel="Financial lease (slottermijn)"
            bedrag={fl.perMaand}
            sub={`termijn ${eur(fl.maandtermijn)} + slottermijn ${eur(slot)}`}
            posten={fl.posten}
            extra={fl.restschuldRisico > 0 ? <div className="uitleg">Let op: slottermijn ligt {eur(fl.restschuldRisico)} boven de verwachte restwaarde.</div> : undefined}
          />
        )}
        <Kaart titel="Private lease" bedrag={pl.perMaand} sub={`${eurKm(pl.perKm)} per km`} posten={pl.posten} />
      </div>

      <h2>Auto van de zaak (leaserijder)</h2>
      <div className="velden">
        <Getal label="Jaar eerste toelating" waarde={jaarToelating} zet={setJaarToelating} />
        <Getal label="Marginaal belastingtarief (%)" waarde={tarief} zet={setTarief} stap={0.01} />
        <Getal label="Eigen bijdrage (€/mnd)" waarde={eigenBijdrage} zet={setEigenBijdrage} />
      </div>
      <div className="kaarten">
        <Kaart titel="Bijtelling" bedrag={bijt.perJaar} sub={`per jaar · ${bijt.uitleg}`} />
        <Kaart titel="Netto kosten voor jou" bedrag={netto.perMaand} sub={`per maand · ${eur(netto.perJaar)} per jaar`} />
        <Kaart titel="Pseudo-eindheffing werkgever" bedrag={pseudo} sub="per jaar · vanaf 2027, alleen auto's met CO₂-uitstoot" />
      </div>

      <h2>ZZP'er: auto zakelijk of privé</h2>
      <div className="velden">
        <Getal label="Zakelijke km per jaar (rest = privé)" waarde={zakKm} zet={setZakKm} stap={1000} />
        <Getal label="Effectief belastingtarief (%)" waarde={zzpTarief} zet={setZzpTarief} stap={0.1} />
      </div>
      <div className="kaarten">
        <Kaart titel="Auto zakelijk" bedrag={zZak.nettoPerMaand} sub={`netto per maand · ${eur(zZak.nettoPerJaar)} per jaar`} posten={zZak.posten} />
        <Kaart titel="Auto privé + €0,25/km" bedrag={zPriv.nettoPerMaand} sub={`netto per maand · ${eur(zPriv.nettoPerJaar)} per jaar`} posten={zPriv.posten} />
      </div>

      <p className="disclaimer">
        Testversie. Uitkomsten zijn scenario's op basis van jouw invoer en de aannames die bij elke berekening staan. Dit is geen financieel advies.
        Fiscale waarden komen uit src/regels/regels-nl.ts (met bron en peildatum). BPM voor brandstofauto's is nog niet opgenomen.
      </p>
    </main>
  );
}
