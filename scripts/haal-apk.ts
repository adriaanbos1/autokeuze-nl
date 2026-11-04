// Meet per model en bouwjaar welk deel van de APK-keuringen minstens één
// technisch gebrek had, en hetzelfde voor alle personenauto's (landelijk
// gemiddelde per bouwjaar). Schrijft data/apk-gebreken.json.
//
// Methode (docs/methodiek.md §2.2):
// - steekproef: per model × bouwjaar alle kentekens ophalen, sorteren op een vaste
//   hash (SHA-256) van het kenteken en de eerste N nemen: willekeurig maar
//   reproduceerbaar, en voor elk merk dezelfde regel;
//   landelijk: idem, binnen alle personenauto's van dat bouwjaar waarvan het
//   kenteken op een 7 eindigt (vaste deelverzameling, ca. 1 op 30);
// - keuringen: "APK Lichte voertuigen", "periodieke controle", in de laatste 24 maanden;
// - een keuring telt als "met gebrek" als er op die dag ≥ 1 technisch gebrek is gemeld.
// Gebruik: node scripts/haal-apk.ts

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { isTechnischGebrek } from "../src/data/gebreken.ts";
import { RDW, SOORT, soql, vandaag } from "./rdw.ts";

const MELDINGEN = "https://opendata.rdw.nl/resource/sgfe-77wx.json";
const GEBREKEN = "https://opendata.rdw.nl/resource/a34c-vvps.json";
const GEBREK_CATALOGUS = "https://opendata.rdw.nl/resource/hx2c-gt7k.json";

const BOUWJAREN = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];
const N_MODEL = 600;
const N_LANDELIJK = 3000;
const BLOK = 150;
const PARALLEL = 4;

const venster = new Date();
venster.setMonth(venster.getMonth() - 24);
const VANAF = venster.toISOString().slice(0, 10).replace(/-/g, "");

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
type Rij = Record<string, string>;

// Technische gebrekcodes uit de officiële catalogus.
const catalogus = await soql<Rij>(GEBREK_CATALOGUS, { $limit: "5000" });
const technisch = new Set(catalogus.filter((g) => isTechnischGebrek(g.gebrek_artikel_nummer, g.gebrek_identificatie)).map((g) => g.gebrek_identificatie));

async function parallel<T, U>(items: T[], f: (x: T) => Promise<U>): Promise<U[]> {
  const uit: U[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: PARALLEL }, async () => {
      while (i < items.length) {
        const j = i++;
        uit[j] = await f(items[j]);
      }
    }),
  );
  return uit;
}

/** Keuringen en keuringen-met-gebrek voor een lijst kentekens, gegroepeerd per keuringsjaar. */
async function meet(kentekens: string[], bouwjaar: number) {
  const blokken: string[][] = [];
  for (let i = 0; i < kentekens.length; i += BLOK) blokken.push(kentekens.slice(i, i + BLOK));
  const res = await parallel(blokken, async (blok) => {
    const lijst = blok.map(quote).join(",");
    const [meldingen, gebreken] = await Promise.all([
      soql<Rij>(MELDINGEN, {
        $select: "kenteken,meld_datum_door_keuringsinstantie",
        $where: `kenteken in(${lijst}) AND soort_erkenning_omschrijving='APK Lichte voertuigen' AND soort_melding_ki_omschrijving='periodieke controle' AND meld_datum_door_keuringsinstantie>='${VANAF}'`,
        $limit: "50000",
      }),
      soql<Rij>(GEBREKEN, {
        $select: "kenteken,meld_datum_door_keuringsinstantie,gebrek_identificatie",
        // datumfilter gebeurt hieronder lokaal: dat is bij RDW ~6× sneller
        $where: `kenteken in(${lijst})`,
        $limit: "50000",
      }),
    ]);
    const metGebrek = new Set(gebreken.filter((g) => g.meld_datum_door_keuringsinstantie >= VANAF && technisch.has(g.gebrek_identificatie)).map((g) => `${g.kenteken}|${g.meld_datum_door_keuringsinstantie}`));
    const perLeeftijd: Record<number, { keuringen: number; metGebrek: number }> = {};
    const gezien = new Set<string>();
    for (const m of meldingen) {
      const sleutel = `${m.kenteken}|${m.meld_datum_door_keuringsinstantie}`;
      if (gezien.has(sleutel)) continue; // herkeuring dezelfde dag telt één keer
      gezien.add(sleutel);
      const leeftijd = Number(m.meld_datum_door_keuringsinstantie.slice(0, 4)) - bouwjaar;
      const c = (perLeeftijd[leeftijd] ??= { keuringen: 0, metGebrek: 0 });
      c.keuringen++;
      if (metGebrek.has(sleutel)) c.metGebrek++;
    }
    return perLeeftijd;
  });
  const totaal: Record<number, { keuringen: number; metGebrek: number }> = {};
  for (const r of res)
    for (const [l, c] of Object.entries(r)) {
      const t = (totaal[Number(l)] ??= { keuringen: 0, metGebrek: 0 });
      t.keuringen += c.keuringen;
      t.metGebrek += c.metGebrek;
    }
  return { auto: kentekens.length, perLeeftijd: totaal };
}

const hash = (k: string) => createHash("sha256").update(k).digest("hex");

/** Alle kentekens die aan `where` voldoen (in delen van 50.000), gelot via een vaste hash; de eerste n. */
async function kentekens(where: string, n: number): Promise<string[]> {
  const alle: string[] = [];
  for (let offset = 0; ; offset += 50000) {
    const rijen = await soql<Rij>(RDW.voertuigen, { $select: "kenteken", $where: where, $order: "kenteken", $limit: "50000", $offset: String(offset) });
    alle.push(...rijen.map((r) => r.kenteken));
    if (rijen.length < 50000) break;
  }
  return alle.sort((a, b) => hash(a).localeCompare(hash(b))).slice(0, n);
}

const jaarFilter = (j: number) => `datum_eerste_toelating>=${j}0101 AND datum_eerste_toelating<=${j}1231`;

// Landelijk gemiddelde per bouwjaar: gelot uit alle personenauto's van dat bouwjaar.
// (Een eerdere versie loste binnen "kenteken eindigt op 7"; nieuwere kentekens eindigen
// op een letter, waardoor recente bouwjaren wegvielen. Daarom nu uit alle kentekens.)
const landelijk: Record<number, Awaited<ReturnType<typeof meet>>> = {};
for (const j of BOUWJAREN) {
  const k = await kentekens(`${SOORT.filter} AND ${jaarFilter(j)}`, N_LANDELIJK);
  landelijk[j] = await meet(k, j);
  console.log("landelijk", j, landelijk[j].auto, JSON.stringify(landelijk[j].perLeeftijd));
}

const selectie = JSON.parse(readFileSync(SOORT.selectie, "utf8")) as {
  modellen: { id: string; merk: string; model: string; varianten: string[] }[];
};

const alleenLandelijk = process.argv.includes("--alleen-landelijk");
const modellen: Record<string, Record<number, Awaited<ReturnType<typeof meet>>>> = alleenLandelijk
  ? JSON.parse(readFileSync(SOORT.apk, "utf8")).modellen
  : {};
for (const m of alleenLandelijk ? [] : selectie.modellen) {
  modellen[m.id] = {};
  for (const j of BOUWJAREN) {
    const k = await kentekens(
      `${SOORT.filter} AND ${jaarFilter(j)} AND merk=${quote(m.merk)} AND handelsbenaming in(${m.varianten.map(quote).join(",")})`,
      N_MODEL,
    );
    if (k.length === 0) continue;
    modellen[m.id][j] = await meet(k, j);
  }
  const s = Object.entries(modellen[m.id]).map(([j, r]) => `${j}:${Object.values(r.perLeeftijd).reduce((a, c) => a + c.keuringen, 0)}`);
  console.log(m.merk, m.model, s.join(" "));
}

writeFileSync(
  SOORT.apk,
  JSON.stringify(
    {
      bron: `${MELDINGEN} + ${GEBREKEN} + ${GEBREK_CATALOGUS} + ${RDW.voertuigen}`,
      peildatum: vandaag(),
      venster: { vanaf: VANAF, tot: vandaag().replace(/-/g, "") },
      methode: `Per model × bouwjaar ${N_MODEL} kentekens, gelot via SHA-256 van het kenteken; landelijk ${N_LANDELIJK} per bouwjaar, gelot uit alle ${SOORT.naam === "bestelauto" ? "bestelauto's (N1)" : "personenauto's"} van dat bouwjaar. Reguliere APK's (lichte voertuigen) in het venster; keuring "met gebrek" = ≥ 1 technisch gebrek (src/data/gebreken.ts).`,
      technischeGebrekcodes: technisch.size,
      landelijk,
      modellen,
    },
    null,
    1,
  ) + "\n",
);
console.log("klaar");
