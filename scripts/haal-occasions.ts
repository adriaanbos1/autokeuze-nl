// Haalt per geselecteerd model en per bouwjaar de officiële specificaties op
// uit RDW Open Data (nieuwprijs van toen, gewicht, verbruik) en schrijft
// data/occasions-rdw.json. Basis voor occasions in de ranglijst (Fase 3b).
//
// Steekproef: per bouwjaar 4 × 50 kentekens (de laatste 50 toelatingen van elk
// kwartaal), zodat het hele jaar meetelt en niet alleen één periode.
// Verbruik: WLTP als RDW dat heeft; anders de oudere NEDC-waarde × de verhouding
// WLTP/NEDC, gemeten op auto's waarvoor RDW beide waarden heeft (zie `verhoudingen`).
//
// Gebruik: npx vite-node --config vitest.config.ts scripts/haal-occasions.ts

import { readFileSync, writeFileSync } from "node:fs";
import type { Aandrijvingstype } from "../src/data/types";
import { aandrijvingUitRdw as aandrijving } from "../src/data/aandrijving";
import { verbruikLegeAccu } from "../src/engine/phev";
import { mediaan, RDW, soql, vandaag } from "./rdw";

const EERSTE_BOUWJAAR = 2016;
const LAATSTE_BOUWJAAR = 2025;
const PER_KWARTAAL = 50;
const MIN_PER_AANDRIJVING = 20;

const selectie = JSON.parse(readFileSync("data/modelselectie.json", "utf8")) as {
  modellen: { id: string; merk: string; model: string; varianten: string[] }[];
};

type Rij = Record<string, string>;
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
const getal = (x: string | undefined) => (x === undefined || x === "" ? NaN : Number(x));
const afgerond = (x: number | null, decimalen = 0) => (x === null ? null : Math.round(x * 10 ** decimalen) / 10 ** decimalen);
function mediaanMetNul(xs: number[]): number | null {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (s.length === 0) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

interface Auto {
  a: Aandrijvingstype;
  v: Rij;
  b: Rij[];
}

const hoofd = (x: Auto) => (x.a === "elektrisch" ? x.b[0] : x.b.find((r) => r.brandstof_omschrijving !== "Elektriciteit") ?? x.b[0]);
const elek = (x: Auto) => x.b.find((r) => r.brandstof_omschrijving === "Elektriciteit");

// Per auto: WLTP- en NEDC-waarden naast elkaar.
const brandstofWltp = (x: Auto) => getal(hoofd(x).brandstof_verbruik_gecombineerd_wltp);
const brandstofNedc = (x: Auto) => getal(hoofd(x).brandstofverbruik_gecombineerd);
const co2Wltp = (x: Auto) => getal(hoofd(x).emissie_co2_gecombineerd_wltp ?? hoofd(x).emis_co2_gewogen_gecombineerd_wltp);
const co2Nedc = (x: Auto) => getal(hoofd(x).co2_uitstoot_gecombineerd);
const evWltp = (x: Auto) => getal(elek(x)?.elektrisch_verbruik_enkel_elektrisch_wltp) / 10;
const evNedc = (x: Auto) => getal(elek(x)?.elektriciteitsverbruik_volledig_elektrisch) / 10;
const bereikWltp = (x: Auto) => getal(elek(x)?.actie_radius_enkel_elektrisch_wltp ?? x.b.map((r) => r.actie_radius_extern_opladen_wltp).find(Boolean));
const bereikNedc = (x: Auto) => getal(elek(x)?.actieradius);

const ok = (n: number) => Number.isFinite(n) && n > 0;

const ruw: { id: string; bouwjaar: number; autos: Auto[] }[] = [];

for (const m of selectie.modellen) {
  const regel = [];
  for (let jaar = EERSTE_BOUWJAAR; jaar <= LAATSTE_BOUWJAAR; jaar++) {
    const voertuigen: Rij[] = [];
    for (const [van, tot] of [["0101", "0331"], ["0401", "0630"], ["0701", "0930"], ["1001", "1231"]]) {
      voertuigen.push(
        ...(await soql<Rij>(RDW.voertuigen, {
          $select: "kenteken,datum_eerste_toelating,catalogusprijs,massa_rijklaar,aantal_zitplaatsen,maximum_trekken_massa_geremd,lengte",
          $where: `voertuigsoort='Personenauto' AND export_indicator='Nee' AND merk=${quote(m.merk)} AND handelsbenaming in(${m.varianten.map(quote).join(",")}) AND datum_eerste_toelating between '${jaar}${van}' and '${jaar}${tot}'`,
          $order: "datum_eerste_toelating DESC, kenteken",
          $limit: String(PER_KWARTAAL),
        })),
      );
    }
    const brandstof = new Map<string, Rij[]>();
    for (let i = 0; i < voertuigen.length; i += 100) {
      const blok = voertuigen.slice(i, i + 100).map((v) => quote(v.kenteken));
      for (const r of await soql<Rij>(RDW.brandstof, { $where: `kenteken in(${blok.join(",")})`, $limit: "1000" }))
        brandstof.set(r.kenteken, [...(brandstof.get(r.kenteken) ?? []), r]);
    }
    const autos: Auto[] = [];
    for (const v of voertuigen) {
      const b = brandstof.get(v.kenteken) ?? [];
      const a = aandrijving(b);
      if (a) autos.push({ a, v, b });
    }
    ruw.push({ id: m.id, bouwjaar: jaar, autos });
    regel.push(`${jaar}:${autos.length}`);
  }
  console.log(m.id, regel.join(" "));
}

// WLTP/NEDC-verhouding per soort waarde, uit auto's waarvoor RDW beide heeft.
function verhouding(w: (x: Auto) => number, n: (x: Auto) => number, filter: (x: Auto) => boolean) {
  const r = ruw.flatMap((g) => g.autos).filter((x) => filter(x) && ok(w(x)) && ok(n(x))).map((x) => w(x) / n(x));
  return { factor: afgerond(mediaan(r), 3), paren: r.length };
}
const verbrander = (x: Auto) => x.a !== "elektrisch" && x.a !== "plug-in hybride";
const verhoudingen = {
  brandstof: verhouding(brandstofWltp, brandstofNedc, verbrander),
  co2: verhouding(co2Wltp, co2Nedc, verbrander),
  elektrisch: verhouding(evWltp, evNedc, (x) => x.a === "elektrisch"),
  bereik: verhouding(bereikWltp, bereikNedc, (x) => x.a === "elektrisch"),
};
console.log("verhoudingen WLTP/NEDC", verhoudingen);

/** Mediaan WLTP als er genoeg zijn, anders mediaan NEDC × verhouding. */
function waarde(autos: Auto[], w: (x: Auto) => number, n: (x: Auto) => number, v: { factor: number | null }, decimalen: number) {
  const ws = autos.map(w).filter(ok);
  if (ws.length >= MIN_PER_AANDRIJVING / 2) return { waarde: afgerond(mediaan(ws), decimalen), methode: "wltp" as const };
  const ns = autos.map(n).filter(ok);
  if (ns.length >= MIN_PER_AANDRIJVING / 2 && v.factor) return { waarde: afgerond(mediaan(ns)! * v.factor, decimalen), methode: "nedc-omgerekend" as const };
  return { waarde: null, methode: null };
}

const modellen: Record<string, { bouwjaar: number; uitvoeringen: unknown[] }[]> = {};
for (const g of ruw) {
  const groepen = new Map<Aandrijvingstype, Auto[]>();
  for (const x of g.autos) groepen.set(x.a, [...(groepen.get(x.a) ?? []), x]);
  const uitvoeringen = [];
  for (const [a, autos] of groepen) {
    if (autos.length < MIN_PER_AANDRIJVING) continue;
    const isEv = a === "elektrisch";
    const isPhev = a === "plug-in hybride";
    const verbruik = isEv
      ? waarde(autos, evWltp, evNedc, verhoudingen.elektrisch, 1)
      : isPhev
        ? (() => {
            // Plug-in hybride: alleen WLTP (lege accu officieel of afgeleid, zoals scripts/haal-specs.ts).
            const l = autos
              .map((x) => {
                const gewogen = getal(hoofd(x).brandstof_verbruik_gewogen_gecombineerd_wltp);
                const officieel = brandstofWltp(x);
                if (officieel > 0 && !(officieel < gewogen)) return officieel;
                return verbruikLegeAccu(gewogen, bereikWltp(x), hoofd(x).uitlaatemissieniveau)?.lPer100 ?? NaN;
              })
              .filter(ok);
            return l.length >= MIN_PER_AANDRIJVING / 2 ? { waarde: afgerond(mediaan(l), 1), methode: "wltp" as const } : { waarde: null, methode: null };
          })()
        : waarde(autos, brandstofWltp, brandstofNedc, verhoudingen.brandstof, 1);
    const co2 = isEv ? { waarde: 0, methode: "wltp" as const } : isPhev ? { waarde: afgerond(mediaan(autos.map(co2Wltp))), methode: "wltp" as const } : waarde(autos, co2Wltp, co2Nedc, verhoudingen.co2, 0);
    const bereik = isEv ? waarde(autos, bereikWltp, bereikNedc, verhoudingen.bereik, 0) : isPhev ? { waarde: afgerond(mediaan(autos.map(bereikWltp))), methode: "wltp" as const } : { waarde: null, methode: null };
    uitvoeringen.push({
      aandrijving: a,
      steekproef: autos.length,
      periode: [g.bouwjaar, g.bouwjaar],
      catalogusprijs: afgerond(mediaan(autos.map((x) => getal(x.v.catalogusprijs)))),
      massaRijklaar: afgerond(mediaan(autos.map((x) => getal(x.v.massa_rijklaar)))),
      zitplaatsen: afgerond(mediaan(autos.map((x) => getal(x.v.aantal_zitplaatsen)))),
      trekgewichtGeremd: afgerond(mediaanMetNul(autos.map((x) => getal(x.v.maximum_trekken_massa_geremd || "0")))),
      lengteCm: afgerond(mediaan(autos.map((x) => getal(x.v.lengte)))),
      vermogenKw: afgerond(mediaan(autos.map((x) => getal(hoofd(x).nettomaximumvermogen ?? hoofd(x).netto_max_vermogen_elektrisch)))),
      verbruikWltp: verbruik.waarde,
      verbruikGewogenWltp: isPhev ? afgerond(mediaan(autos.map((x) => getal(hoofd(x).brandstof_verbruik_gewogen_gecombineerd_wltp))), 1) : null,
      elektrischVerbruikWltp: isPhev ? afgerond(mediaan(autos.map((x) => getal(x.b.map((r) => r.elektrisch_verbruik_extern_opladen_wltp).find(Boolean)) / 10)), 1) : null,
      co2Wltp: co2.waarde,
      actieradiusWltpKm: bereik.waarde,
      meetmethode: { verbruik: verbruik.methode, co2: co2.methode, actieradius: bereik.methode },
    });
  }
  uitvoeringen.sort((x, y) => y.steekproef - x.steekproef);
  if (uitvoeringen.length) (modellen[g.id] ??= []).push({ bouwjaar: g.bouwjaar, uitvoeringen });
}

writeFileSync(
  "data/occasions-rdw.json",
  JSON.stringify(
    {
      bron: `${RDW.voertuigen} + ${RDW.brandstof}`,
      peildatum: vandaag(),
      methode: `Per bouwjaar (jaar van eerste toelating) de laatste ${PER_KWARTAAL} toelatingen van elk kwartaal, niet geëxporteerd; medianen per aandrijving (min. ${MIN_PER_AANDRIJVING} kentekens). Catalogusprijs = nieuwprijs van toen, incl. btw, BPM en opties. Verbruik, CO₂ en actieradius: WLTP; zonder WLTP de NEDC-waarde × de mediane verhouding WLTP/NEDC uit auto's met beide waarden.`,
      bouwjaren: [EERSTE_BOUWJAAR, LAATSTE_BOUWJAAR],
      verhoudingen,
      modellen,
    },
    null,
    1,
  ) + "\n",
);
