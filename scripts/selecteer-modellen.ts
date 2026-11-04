// Kiest de modellen voor de dataset op basis van RDW-registraties, zonder
// handmatige selectie (docs/beslissingen.md #8).
//
// Regel: personenauto's met datum eerste toelating sinds 2019-01-01, niet
// geëxporteerd; tellen per modelfamilie; de N grootste families gaan mee.
// Gebruik: node scripts/selecteer-modellen.ts [N=50] [--bestel]

import { writeFileSync } from "node:fs";
import { modelSleutel } from "../src/data/normaliseer.ts";
import { RDW, SOORT, soql, vandaag } from "./rdw.ts";

const N = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 50);
const VANAF = "20190101";

const rijen = await soql<{ merk: string; handelsbenaming: string; n: string }>(RDW.voertuigen, {
  $select: "merk,handelsbenaming,count(*) as n",
  $where: `${SOORT.filter} AND datum_eerste_toelating>=${VANAF} AND export_indicator='Nee'`,
  $group: "merk,handelsbenaming",
  $order: "n DESC",
  $limit: "5000",
});

const families = new Map<string, { merk: string; familie: string; n: number; varianten: { naam: string; n: number }[] }>();
for (const r of rijen) {
  const sleutel = modelSleutel(r.merk, r.handelsbenaming);
  const [merk, familie] = sleutel.split("|");
  const f = families.get(sleutel) ?? { merk, familie, n: 0, varianten: [] };
  f.n += Number(r.n);
  f.varianten.push({ naam: r.handelsbenaming, n: Number(r.n) });
  families.set(sleutel, f);
}

const totaal = rijen.reduce((s, r) => s + Number(r.n), 0);
// Gelijke aantallen: alfabetisch, zodat de volgorde voorspelbaar en merkneutraal is.
const gesorteerd = [...families.values()].sort((a, b) => b.n - a.n || `${a.merk} ${a.familie}`.localeCompare(`${b.merk} ${b.familie}`));
const gekozen = gesorteerd.slice(0, N);

const uit = {
  bron: RDW.voertuigen,
  peildatum: vandaag(),
  regel: `${SOORT.naam === "bestelauto" ? "Bedrijfsauto categorie N1" : "Personenauto"}, datum eerste toelating ≥ ${VANAF}, export_indicator = Nee; top ${N} modelfamilies op aantal registraties (normalisatie: src/data/normaliseer.ts).`,
  aantalRegistratiesGeteld: totaal,
  dekkingGekozen: Math.round((gekozen.reduce((s, f) => s + f.n, 0) / totaal) * 1000) / 10,
  modellen: gekozen.map((f, i) => ({
    rang: i + 1,
    id: `${f.merk}-${f.familie}`.toLowerCase().replace(/[^a-z0-9.]+/g, "-"),
    merk: f.merk,
    model: f.familie,
    registraties: f.n,
    // varianten met ≥ 50 registraties; daarmee haalt het specs-script de juiste kentekens op
    varianten: f.varianten.filter((v) => v.n >= 50).map((v) => v.naam),
  })),
};

writeFileSync(SOORT.selectie, JSON.stringify(uit, null, 2) + "\n");
console.log(`${gekozen.length} modellen, ${uit.dekkingGekozen}% van ${totaal} registraties`);
for (const m of uit.modellen) console.log(String(m.rang).padStart(2), m.registraties, m.merk, m.model);
