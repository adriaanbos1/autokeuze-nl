// Haalt per model de Euro NCAP-sterren op uit de openbare uitslagpagina's
// (www.euroncap.com/assessments/<merk>/<model>/<nummer>/). Schrijft data/euro-ncap.json.
//
// - We gebruiken alleen pagina's die robots.txt toestaat (niet /api/) en wachten
//   tussen verzoeken.
// - We nemen alleen feiten over: sterren, testjaar, publicatiedatum, of Euro NCAP
//   de uitslag als verlopen markeert, waarvoor de uitslag geldt, en de link.
//   Geen logo's, teksten of beelden (voorwaarden Euro NCAP, zie docs/databronnen.md §2.2).
// - Paginanummers met een achtervoegsel: "sp" = met optioneel veiligheidspakket,
//   "pm" = uitslag overgenomen van een technisch gelijk model (zie geteestModel),
//   "a" = rijassistentie (geen sterren, wordt overgeslagen).
// Gebruik: node scripts/haal-ncap.ts

import { readFileSync, writeFileSync } from "node:fs";
import { vandaag } from "./rdw.ts";

const BASIS = "https://www.euroncap.com";
const WACHT_MS = 1500;

// Hoe Euro NCAP onze modelfamilies noemt (alleen waar dat afwijkt van "model in kleine letters").
const MERK_SLUG: Record<string, string> = { "LYNK&CO": "lynk+-+co", "MERCEDES-BENZ": "mercedes-benz" };
const MODEL_SLUGS: Record<string, string[]> = {
  "bmw-3-serie": ["3+series"],
  "mercedes-benz-a-klasse": ["a-class"],
  "lynk-co-01": ["1"],
  "opel-crossland": ["crossland+x", "crossland"],
  "skoda-enyaq": ["enyaq", "enyaq+iv"],
  "mini-cooper": ["cooper", "cooper+e"],
  "fiat-500": ["500", "500e"],
};

// Uitslagen op dezelfde Euro NCAP-modelnaam die niet bij onze modelfamilie horen.
const UITSLUITEN: Record<string, string> = {
  "/toyota/c-hr/1206/": "C-HR+ is een apart elektrisch model, niet de C-HR",
};

const standaardSlug = (s: string) => s.toLowerCase().replace(/ /g, "+").replace(/!$/, "-");

type Uitslag = {
  url: string;
  sterren: number;
  testjaar: number;
  publicatiedatum: string | null;
  verlopen: boolean;
  veiligheidspakket: boolean;
  geldtVoor: string | null;
  geteestModel: string | null;
};

function leesUitslag(url: string, html: string): Uitslag | null {
  const t = html.replace(/\\"/g, '"');
  const i = t.indexOf('"resultApplicability"');
  const sterren = /"starRating":(\d)/.exec(t);
  const jaar = /"safetyPerformance":\{[^{}]*?"ratingYear":(\d{4})/.exec(t);
  if (i < 0 || !sterren || !jaar) return null; // bijv. een pagina over rijassistentie
  const voor = t.slice(Math.max(0, i - 6000), i);
  const na = t.slice(i, i + 3000);
  const datum = [...voor.matchAll(/"publicationDate":"(\d{4}-\d{2}-\d{2})/g)].pop();
  const tags = /"assessmentTags":\[([^\]]*)\]/.exec(na)?.[1] ?? "";
  return {
    url,
    sterren: Number(sterren[1]),
    testjaar: Number(jaar[1]),
    publicatiedatum: datum ? datum[1] : null,
    verlopen: tags.includes("RATING_EXPIRED"),
    veiligheidspakket: /"hasSafetyPack":true/.test(t) || /"safetyPackName":"[^"]+"/.test(t),
    geldtVoor: /"resultApplicability":"([^"]*)"/.exec(na)?.[1] ?? null,
    geteestModel: /"testedModel":"([^"]*)"/.exec(t)?.[1] ?? null,
  };
}

const selectie = JSON.parse(readFileSync("data/modelselectie.json", "utf8")) as {
  modellen: { id: string; merk: string; model: string }[];
};

const sitemap = await (await fetch(`${BASIS}/sitemap.xml`)).text();
const paginas = [...sitemap.matchAll(/<loc>(https:\/\/www\.euroncap\.com\/assessments\/([^/]+)\/([^/]+)\/(\d+[a-z]*)\/)<\/loc>/g)].map((m) => ({
  url: m[1],
  merk: m[2],
  model: m[3],
}));

const modellen: Record<string, { gezocht: string[]; uitslagen: Uitslag[] }> = {};
for (const m of selectie.modellen) {
  const merk = MERK_SLUG[m.merk] ?? m.merk.toLowerCase();
  const slugs = MODEL_SLUGS[m.id] ?? [standaardSlug(m.model)];
  const gezocht = slugs.map((s) => `${merk}/${s}`);
  const uitslagen: Uitslag[] = [];
  for (const p of paginas.filter((p) => gezocht.includes(`${p.merk}/${p.model}`) && !Object.keys(UITSLUITEN).some((u) => p.url.endsWith(u)))) {
    await new Promise((r) => setTimeout(r, WACHT_MS));
    const res = await fetch(p.url, { headers: { "User-Agent": "AutoKeuzeNL-datacheck/0.1 (eenmalige ophaalactie, contact via site)" } });
    if (!res.ok) throw new Error(`${p.url}: ${res.status}`);
    const u = leesUitslag(p.url, await res.text());
    if (u) uitslagen.push(u);
  }
  uitslagen.sort((a, b) => b.testjaar - a.testjaar || (b.publicatiedatum ?? "").localeCompare(a.publicatiedatum ?? ""));
  modellen[m.id] = { gezocht, uitslagen };
  console.log(m.id, uitslagen.map((u) => `${u.testjaar}:${u.sterren}${u.verlopen ? "(verlopen)" : ""}${u.veiligheidspakket ? "(pakket)" : ""}`).join(" ") || "—");
}

writeFileSync(
  "data/euro-ncap.json",
  JSON.stringify(
    {
      bron: `${BASIS}/assessments/ (openbare uitslagpagina's, via ${BASIS}/sitemap.xml)`,
      peildatum: vandaag(),
      uitgesloten: UITSLUITEN,
      voorwaarden: "Alleen feiten (sterren, testjaar, link). Geen logo's, teksten of beelden zonder toestemming van Euro NCAP.",
      modellen,
    },
    null,
    1,
  ) + "\n",
);
console.log("klaar");
