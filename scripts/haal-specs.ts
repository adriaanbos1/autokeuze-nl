// Haalt per geselecteerd model de officiële specificaties op uit RDW Open Data
// en schrijft data/modellen-rdw.json. Per aandrijving: medianen over de
// meest recent toegelaten kentekens (steekproef), zodat het getal de huidige
// uitvoering weerspiegelt.
// Gebruik: node scripts/haal-specs.ts

import { readFileSync, writeFileSync } from "node:fs";
import type { Aandrijvingstype, ModelRdw, UitvoeringRdw } from "../src/data/types.ts";
import { aandrijvingUitRdw as aandrijving } from "../src/data/aandrijving.ts";
import { mediaan, RDW, soql, vandaag } from "./rdw.ts";

const STEEKPROEF = 400;
const MIN_PER_AANDRIJVING = 10;

const selectie = JSON.parse(readFileSync("data/modelselectie.json", "utf8")) as {
  modellen: { rang: number; id: string; merk: string; model: string; registraties: number; varianten: string[] }[];
};

type Rij = Record<string, string>;
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;


const getal = (x: string | undefined) => (x === undefined ? NaN : Number(x));
function mediaanMetNul(xs: number[]): number | null {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  if (s.length === 0) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const afgerond = (x: number | null, decimalen = 0) => (x === null ? null : Math.round(x * 10 ** decimalen) / 10 ** decimalen);

const modellen: ModelRdw[] = [];
for (const m of selectie.modellen) {
  const voertuigen = await soql<Rij>(RDW.voertuigen, {
    $select: "kenteken,datum_eerste_toelating,catalogusprijs,massa_rijklaar,aantal_zitplaatsen,maximum_trekken_massa_geremd,lengte",
    // zonder datum eerste toelating sorteren lege velden vooraan; die tellen niet mee
    $where: `voertuigsoort='Personenauto' AND datum_eerste_toelating IS NOT NULL AND merk=${quote(m.merk)} AND handelsbenaming in(${m.varianten.map(quote).join(",")})`,
    $order: "datum_eerste_toelating DESC, kenteken",
    $limit: String(STEEKPROEF),
  });

  const brandstofPerKenteken = new Map<string, Rij[]>();
  for (let i = 0; i < voertuigen.length; i += 100) {
    const blok = voertuigen.slice(i, i + 100).map((v) => quote(v.kenteken));
    const rijen = await soql<Rij>(RDW.brandstof, { $where: `kenteken in(${blok.join(",")})`, $limit: "1000" });
    for (const r of rijen) brandstofPerKenteken.set(r.kenteken, [...(brandstofPerKenteken.get(r.kenteken) ?? []), r]);
  }

  const groepen = new Map<Aandrijvingstype, { v: Rij; b: Rij[] }[]>();
  for (const v of voertuigen) {
    const b = brandstofPerKenteken.get(v.kenteken) ?? [];
    const a = aandrijving(b);
    if (a) groepen.set(a, [...(groepen.get(a) ?? []), { v, b }]);
  }

  const uitvoeringen: UitvoeringRdw[] = [];
  for (const [a, rijen] of groepen) {
    if (rijen.length < MIN_PER_AANDRIJVING) continue;
    const jaren = rijen.map((r) => Number(r.v.datum_eerste_toelating.slice(0, 4)));
    const hoofd = (b: Rij[]) => (a === "elektrisch" ? b[0] : b.find((x) => x.brandstof_omschrijving !== "Elektriciteit") ?? b[0]);
    const elek = (b: Rij[]) => b.find((x) => x.brandstof_omschrijving === "Elektriciteit");
    uitvoeringen.push({
      aandrijving: a,
      steekproef: rijen.length,
      periode: [Math.min(...jaren), Math.max(...jaren)],
      catalogusprijs: afgerond(mediaan(rijen.map((r) => getal(r.v.catalogusprijs)))),
      massaRijklaar: afgerond(mediaan(rijen.map((r) => getal(r.v.massa_rijklaar)))),
      zitplaatsen: afgerond(mediaan(rijen.map((r) => getal(r.v.aantal_zitplaatsen)))),
      // 0 kg betekent: geen trekgewicht toegestaan; dat telt mee (mediaan filtert anders nullen weg)
      trekgewichtGeremd: afgerond(mediaanMetNul(rijen.map((r) => getal(r.v.maximum_trekken_massa_geremd || "0")))),
      lengteCm: afgerond(mediaan(rijen.map((r) => getal(r.v.lengte)))),
      vermogenKw: afgerond(
        mediaan(rijen.map((r) => getal(hoofd(r.b).nettomaximumvermogen ?? hoofd(r.b).netto_max_vermogen_elektrisch))),
      ),
      verbruikWltp:
        a === "elektrisch"
          ? afgerond(mediaan(rijen.map((r) => getal(r.b[0].elektrisch_verbruik_enkel_elektrisch_wltp) / 10)), 1)
          : afgerond(mediaan(rijen.map((r) => getal(hoofd(r.b).brandstof_verbruik_gecombineerd_wltp))), 1),
      verbruikGewogenWltp: a === "plug-in hybride" ? afgerond(mediaan(rijen.map((r) => getal(hoofd(r.b).brandstof_verbruik_gewogen_gecombineerd_wltp))), 1) : null,
      elektrischVerbruikWltp:
        a === "plug-in hybride"
          ? afgerond(mediaan(rijen.map((r) => getal(r.b.map((x) => x.elektrisch_verbruik_extern_opladen_wltp).find(Boolean)) / 10)), 1)
          : null,
      co2Wltp: a === "elektrisch" ? 0 : afgerond(mediaan(rijen.map((r) => getal(hoofd(r.b).emissie_co2_gecombineerd_wltp ?? hoofd(r.b).emis_co2_gewogen_gecombineerd_wltp)))),
      actieradiusWltpKm: afgerond(
        mediaan(rijen.map((r) => getal(elek(r.b)?.actie_radius_enkel_elektrisch_wltp ?? r.b.map((x) => x.actie_radius_extern_opladen_wltp).find(Boolean)))),
      ),
    });
  }
  uitvoeringen.sort((x, y) => y.steekproef - x.steekproef);

  modellen.push({
    id: m.id,
    merk: m.merk,
    model: m.model,
    rang: m.rang,
    registratiesSinds2019: m.registraties,
    uitvoeringen,
    herkomst: {
      bron: `${RDW.voertuigen} + ${RDW.brandstof}`,
      peildatum: vandaag(),
      betrouwbaarheid: "hoog",
      methode: `Medianen over de ${voertuigen.length} meest recent toegelaten kentekens van dit model, per aandrijving (min. ${MIN_PER_AANDRIJVING}). Catalogusprijs is incl. btw en BPM, inclusief fabrieksopties van die auto's.`,
    },
  });
  console.log(m.rang, m.merk, m.model, uitvoeringen.map((u) => `${u.aandrijving}:${u.steekproef}`).join(" "));
}

writeFileSync("data/modellen-rdw.json", JSON.stringify({ peildatum: vandaag(), modellen }, null, 2) + "\n");
