// ZZP'er / eenmanszaak: vier manieren om een auto te rijden (docs/methodiek.md §1.4a, §4.2).
// Alle bedragen per jaar, gemiddeld over de looptijd. Het belastingeffect komt uit een
// functie die het exacte verschil in inkomstenbelasting geeft (src/engine/inkomstenbelasting.ts).
import { regels } from "@/regels/regels-nl";
import { rond2, som, type Post } from "./geld";
import { bijtellingPerJaar, type Aandrijving } from "./bijtelling";
import { financialLease } from "./financiering";

export type ZzpVorm = "koopZakelijk" | "koopPrive" | "financialLeaseZakelijk" | "operationalLease";

export interface ZzpAuto {
  /** Aankoopprijs zoals op de factuur (incl. btw als die erop staat). */
  aankoopprijs: number;
  /** Staat er btw op de factuur? Nee bij de meeste occasions van een handelaar (bijzondere regeling). */
  btwOpFactuur: boolean;
  restwaardeEinde: number;
  looptijdJaren: number;
  cataloguswaarde: number;
  aandrijving: Aandrijving;
  jaarEersteToelating: number;
  /** Kalenderjaar van aankoop of ingebruikname. */
  startjaar: number;
  /** Per jaar, incl. btw. */
  energie: number;
  onderhoud: number;
  /** Per jaar, zonder btw. */
  mrb: number;
  verzekering: number;
}

export interface ZzpSituatie {
  zakelijkeKm: number;
  priveKm: number;
  btwPlichtig: boolean;
  /** Gemist rendement op eigen geld (bijv. 0,025). */
  rendement: number;
  /** Belastingbesparing door een aftrekpost van x euro (exact, inclusief heffingskortingen). */
  belastingvoordeel: (aftrek: number) => number;
}

export interface ZzpLease {
  financialLease: { jaarrente: number; slottermijn: number };
  /** Operational lease: offerteprijs per maand excl. btw, of null voor een schatting. */
  operationalLease: { offerteExclBtw: number | null; kapitaalrente: number; opslag: number };
}

export interface ZzpUitkomst {
  vorm: ZzpVorm;
  nettoPerJaar: number;
  nettoPerMaand: number;
  posten: Post[];
  /** Operational lease: gebruikte leaseprijs excl. btw per maand en of die geschat is. */
  leaseprijsExcl?: number;
  leaseprijsGeschat?: boolean;
}

const btw = regels.zakelijk.btwTarief.waarde;
const pct = (x: number) => `${rond2(x * 100).toLocaleString("nl-NL")}%`;
const eur = (x: number) => `€${Math.round(x).toLocaleString("nl-NL")}`;

/** Gemiddelde bijtelling per jaar over de looptijd (met de 60-maandenregel), of 0 bij ≤ 500 km privé. */
export function gemiddeldeBijtelling(a: ZzpAuto, priveKm: number): number {
  if (priveKm <= regels.bijtelling.grensPriveKm.waarde) return 0;
  let totaal = 0;
  for (let k = 0; k < a.looptijdJaren; k++)
    totaal += bijtellingPerJaar({ cataloguswaarde: a.cataloguswaarde, aandrijving: a.aandrijving, jaarEersteToelating: a.jaarEersteToelating, kalenderjaar: a.startjaar + k }).perJaar;
  return rond2(totaal / a.looptijdJaren);
}

/**
 * Gemiddelde forfaitaire btw-correctie per jaar: 2,7% van de catalogusprijs, 1,5% na het vierde jaar
 * van aanschaf of als er bij aanschaf geen btw-aftrek was. Alleen bij btw-plicht en privégebruik.
 */
export function gemiddeldeBtwCorrectie(a: ZzpAuto, s: ZzpSituatie, btwAftrekBijAanschaf: boolean): number {
  if (!s.btwPlichtig || s.priveKm <= regels.bijtelling.grensPriveKm.waarde) return 0;
  const p = regels.zakelijk.btwCorrectiePrivegebruik.waarde;
  let totaal = 0;
  for (let k = 0; k < a.looptijdJaren; k++) totaal += a.cataloguswaarde * (btwAftrekBijAanschaf && k < 4 ? p.standaard : p.naVierJaarOfZonderAftrek);
  return rond2(totaal / a.looptijdJaren);
}

const exclBtw = (bedrag: number, aftrekbaar: boolean) => (aftrekbaar ? rond2(bedrag / (1 + btw)) : bedrag);

/** Zakelijke variant: kosten aftrekbaar, bijtelling begrensd tot die kosten, plus niet-aftrekbare posten. */
function zakelijk(vorm: ZzpVorm, a: ZzpAuto, s: ZzpSituatie, aftrekbaar: Post[], nietAftrekbaar: Post[], btwAftrekBijAanschaf: boolean): ZzpUitkomst {
  const kosten = som(...aftrekbaar.map((p) => p.bedrag));
  const bijtellingVol = gemiddeldeBijtelling(a, s.priveKm);
  const bijtelling = Math.min(bijtellingVol, kosten);
  const voordeel = rond2(s.belastingvoordeel(kosten - bijtelling));
  const btwCorrectie = gemiddeldeBtwCorrectie(a, s, btwAftrekBijAanschaf);
  const posten: Post[] = [
    ...aftrekbaar,
    ...nietAftrekbaar,
    {
      label: "Bijtelling (begrensd tot kosten)",
      bedrag: bijtelling,
      uitleg: bijtellingVol === 0 ? "≤ 500 km privé: geen bijtelling" : `gemiddeld ${eur(bijtellingVol)} per jaar over de looptijd; telt niet als kosten maar verlaagt je aftrek`,
    },
    { label: "Belastingvoordeel", bedrag: -voordeel, uitleg: `minder inkomstenbelasting door ${eur(kosten - bijtelling)} aftrek (kosten − bijtelling)` },
    { label: "Btw-correctie privégebruik", bedrag: btwCorrectie, uitleg: btwCorrectie ? `${btwAftrekBijAanschaf ? "2,7% (1,5% vanaf jaar 5)" : "1,5% (geen btw-aftrek bij aanschaf)"} × catalogusprijs, gemiddeld` : "niet van toepassing" },
  ];
  const nettoPerJaar = som(kosten, ...nietAftrekbaar.map((p) => p.bedrag), -voordeel, btwCorrectie);
  return { vorm, nettoPerJaar, nettoPerMaand: rond2(nettoPerJaar / 12), posten };
}

export function zzpVarianten(a: ZzpAuto, s: ZzpSituatie, l: ZzpLease): ZzpUitkomst[] {
  const terug = s.btwPlichtig; // btw op kosten terug te vragen
  const terugAanschaf = s.btwPlichtig && a.btwOpFactuur;
  const n = a.looptijdJaren;
  const aanschaf = exclBtw(a.aankoopprijs, terugAanschaf);
  const rest = exclBtw(a.restwaardeEinde, terugAanschaf);
  const lopendZakelijk: Post[] = [
    { label: "Energie", bedrag: exclBtw(a.energie, terug), uitleg: terug ? "excl. btw" : "incl. btw" },
    { label: "MRB", bedrag: a.mrb, uitleg: "" },
    { label: "Verzekering", bedrag: a.verzekering, uitleg: "" },
    { label: "Onderhoud en banden", bedrag: exclBtw(a.onderhoud, terug), uitleg: terug ? "excl. btw" : "incl. btw" },
  ];
  const afschrijving: Post = {
    label: "Afschrijving",
    bedrag: rond2((aanschaf - rest) / n),
    uitleg: `(${eur(aanschaf)} − ${eur(rest)}) / ${n} jaar${terugAanschaf ? ", excl. btw" : a.btwOpFactuur ? "" : ", geen btw op de factuur: geen aftrek"}`,
  };
  const gemist = (kapitaal: number): Post => ({
    label: "Gemist rendement (niet aftrekbaar)",
    bedrag: rond2(kapitaal * s.rendement),
    uitleg: `gemiddeld ${eur(kapitaal)} vastgezet × ${pct(s.rendement)}`,
  });

  const uit: ZzpUitkomst[] = [];

  // 1. Kopen, auto zakelijk.
  uit.push(zakelijk("koopZakelijk", a, s, [afschrijving, ...lopendZakelijk], [gemist((aanschaf + rest) / 2)], terugAanschaf));

  // 2. Kopen, auto privé + €0,25 per zakelijke km. Geen btw terug.
  {
    const kosten: Post[] = [
      { label: "Afschrijving", bedrag: rond2((a.aankoopprijs - a.restwaardeEinde) / n), uitleg: "incl. btw" },
      { label: "Energie", bedrag: a.energie, uitleg: "incl. btw" },
      { label: "MRB", bedrag: a.mrb, uitleg: "" },
      { label: "Verzekering", bedrag: a.verzekering, uitleg: "" },
      { label: "Onderhoud en banden", bedrag: a.onderhoud, uitleg: "incl. btw" },
      gemist((a.aankoopprijs + a.restwaardeEinde) / 2),
    ];
    const aftrek = rond2(s.zakelijkeKm * regels.zakelijk.kilometervergoeding.waarde);
    const voordeel = rond2(s.belastingvoordeel(aftrek));
    const nettoPerJaar = som(...kosten.map((p) => p.bedrag), -voordeel);
    uit.push({
      vorm: "koopPrive",
      nettoPerJaar,
      nettoPerMaand: rond2(nettoPerJaar / 12),
      posten: [...kosten, { label: "Belastingvoordeel km-aftrek", bedrag: -voordeel, uitleg: `${s.zakelijkeKm.toLocaleString("nl-NL")} km × €${regels.zakelijk.kilometervergoeding.waarde.toLocaleString("nl-NL")} = ${eur(aftrek)} aftrek` }],
    });
  }

  // 3. Financial lease zakelijk: als kopen, maar gefinancierd; rente is aftrekbaar, geen eigen geld vast.
  {
    const slot = Math.min(l.financialLease.slottermijn, aanschaf);
    const f = financialLease(aanschaf, l.financialLease.jaarrente, n * 12, slot, rest);
    const rente: Post = { label: "Rente", bedrag: rond2(f.totaleRente / n), uitleg: `${pct(l.financialLease.jaarrente)} over ${eur(aanschaf)}, slottermijn ${eur(slot)}` };
    uit.push(zakelijk("financialLeaseZakelijk", a, s, [afschrijving, rente, ...lopendZakelijk], [], terugAanschaf));
  }

  // 4. Operational lease: leaseprijs (incl. MRB, verzekering, onderhoud) + energie, aftrekbaar.
  {
    const ol = l.operationalLease;
    const nieuwAanschaf = exclBtw(a.aankoopprijs, a.btwOpFactuur); // leasemaatschappij trekt btw wel af
    const nieuwRest = exclBtw(a.restwaardeEinde, a.btwOpFactuur);
    const kostprijsJaar = som(
      (nieuwAanschaf - nieuwRest) / n,
      ((nieuwAanschaf + nieuwRest) / 2) * ol.kapitaalrente,
      a.mrb,
      a.verzekering,
      exclBtw(a.onderhoud, true),
    );
    const geschat = ol.offerteExclBtw == null;
    const leaseExclPerMaand = geschat ? rond2((kostprijsJaar * (1 + ol.opslag)) / 12) : ol.offerteExclBtw!;
    const leaseJaar = rond2(leaseExclPerMaand * 12 * (terug ? 1 : 1 + btw));
    uit.push(
      zakelijk(
        "operationalLease",
        a,
        s,
        [
          {
            label: "Leaseprijs",
            bedrag: leaseJaar,
            uitleg: `${eur(leaseExclPerMaand)} per maand excl. btw${terug ? "" : " + btw (niet terug te vragen)"}${geschat ? `; geschat: kostprijs × ${1 + ol.opslag}` : ", uit je offerte"}`,
          },
          { label: "Energie", bedrag: exclBtw(a.energie, terug), uitleg: terug ? "excl. btw" : "incl. btw" },
        ],
        [],
        true,
      ),
    );
    uit[uit.length - 1].leaseprijsExcl = leaseExclPerMaand;
    uit[uit.length - 1].leaseprijsGeschat = geschat;
  }

  return uit;
}
