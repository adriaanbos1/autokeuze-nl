// Financieringsvormen naast elkaar voor één auto (docs/methodiek.md §3.2–3.3).
// Alleen rekenwerk: welke vorm "beter" is, zegt de app niet; ze toont per
// scenario de kosten, de betalingen en wat je aan het eind hebt.
import { rond2, som, type Post } from "./geld";
import { tcoContant, tcoFinancialLease, tcoLening, tcoPrivateLease, type AutoBezit, type LopendeKosten, type TcoUitkomst } from "./tco";

export type Vorm = "contant" | "lening" | "financialLease" | "privateLease";

export interface ScenarioInvoer {
  bezit: AutoBezit;
  lening: { eigenGeld: number; jaarrente: number };
  financialLease: { aanbetaling: number; jaarrente: number; slottermijn: number };
  privateLease: {
    /** Maandprijs uit een echte offerte; null = eigen schatting. */
    offerte: number | null;
    kapitaalrente: number;
    opslag: number;
    eigenRisico: number;
    schadesPerJaar: number;
  };
}

export interface Scenario {
  vorm: Vorm;
  /** Wat het je per maand echt kost, inclusief waardeverlies (TCO). */
  tco: TcoUitkomst;
  /** Eenmalig bij de start. */
  nuBetalen: number;
  /** Wat je elke maand betaalt: termijn of leaseprijs plus de kosten die je zelf draagt. */
  perMaandBetalen: number;
  /** Eenmalig aan het eind (slottermijn). */
  eindeBetalen: number;
  /** Waarde van de auto die je aan het eind bezit (0 bij lease). */
  bezitEinde: number;
  /** Alleen lening en financial lease. */
  maandtermijn?: number;
  totaleRente?: number;
  /** Financial lease: hoeveel de slottermijn boven de verwachte waarde ligt. */
  restschuldRisico?: number;
  /** Private lease: de gebruikte leaseprijs en of die geschat is. */
  leaseprijs?: number;
  leaseprijsGeschat?: boolean;
  leaseprijsPosten?: Post[];
}

const lopendTotaal = (l: LopendeKosten) => som(l.energie, l.mrb, l.verzekering, l.onderhoudEnBanden);

/**
 * Indicatieve private-leaseprijs op kostprijsbasis: afschrijving + rente over
 * het gemiddelde kapitaal + MRB + verzekering + onderhoud en banden, plus een
 * opslag voor overhead, risico en winst. Energie zit niet in een leaseprijs.
 */
export function privateLeaseSchatting(p: {
  aankoopprijs: number;
  restwaardeEinde: number;
  maanden: number;
  lopend: LopendeKosten;
  kapitaalrente: number;
  opslag: number;
}): { leaseprijs: number; posten: Post[] } {
  const gemKapitaal = (p.aankoopprijs + p.restwaardeEinde) / 2;
  const kosten: Post[] = [
    { label: "Afschrijving", bedrag: rond2((p.aankoopprijs - p.restwaardeEinde) / p.maanden), uitleg: `(${p.aankoopprijs} − ${p.restwaardeEinde}) / ${p.maanden}` },
    { label: "Rente leasemaatschappij", bedrag: rond2((gemKapitaal * p.kapitaalrente) / 12), uitleg: `gemiddeld kapitaal ${gemKapitaal} × ${p.kapitaalrente * 100}% / 12` },
    { label: "Motorrijtuigenbelasting", bedrag: p.lopend.mrb, uitleg: "zoals bij kopen" },
    { label: "Verzekering", bedrag: p.lopend.verzekering, uitleg: "zoals bij kopen" },
    { label: "Onderhoud en banden", bedrag: p.lopend.onderhoudEnBanden, uitleg: "zoals bij kopen" },
  ];
  const kostprijs = som(...kosten.map((k) => k.bedrag));
  const opslag = rond2(kostprijs * p.opslag);
  return {
    leaseprijs: som(kostprijs, opslag),
    posten: [...kosten, { label: "Opslag (overhead, risico, winst)", bedrag: opslag, uitleg: `${p.opslag * 100}% van ${kostprijs}` }],
  };
}

export function financieringsScenarios(s: ScenarioInvoer): Scenario[] {
  const a = s.bezit;
  const lopend = lopendTotaal(a.lopend);
  const uit: Scenario[] = [];

  uit.push({ vorm: "contant", tco: tcoContant(a), nuBetalen: a.aankoopprijs, perMaandBetalen: lopend, eindeBetalen: 0, bezitEinde: a.restwaardeEinde });

  const leenbedrag = rond2(a.aankoopprijs - s.lening.eigenGeld);
  if (leenbedrag > 0) {
    const l = tcoLening(a, { hoofdsom: leenbedrag, jaarrente: s.lening.jaarrente, maanden: a.maanden });
    uit.push({
      vorm: "lening",
      tco: l,
      nuBetalen: rond2(s.lening.eigenGeld),
      perMaandBetalen: som(l.maandtermijn, lopend),
      eindeBetalen: 0,
      bezitEinde: a.restwaardeEinde,
      maandtermijn: l.maandtermijn,
      totaleRente: rond2(l.maandtermijn * a.maanden - leenbedrag),
    });
  }

  const flBedrag = rond2(a.aankoopprijs - s.financialLease.aanbetaling);
  if (flBedrag > 0) {
    const slot = Math.min(s.financialLease.slottermijn, flBedrag);
    const f = tcoFinancialLease(a, { hoofdsom: flBedrag, jaarrente: s.financialLease.jaarrente, slottermijn: slot });
    uit.push({
      vorm: "financialLease",
      tco: f,
      nuBetalen: rond2(s.financialLease.aanbetaling),
      perMaandBetalen: som(f.maandtermijn, lopend),
      eindeBetalen: slot,
      bezitEinde: a.restwaardeEinde,
      maandtermijn: f.maandtermijn,
      totaleRente: rond2(f.maandtermijn * a.maanden + slot - flBedrag),
      restschuldRisico: f.restschuldRisico,
    });
  }

  const schatting = privateLeaseSchatting({ ...a, lopend: a.lopend, kapitaalrente: s.privateLease.kapitaalrente, opslag: s.privateLease.opslag });
  const leaseprijs = s.privateLease.offerte ?? schatting.leaseprijs;
  const pl = tcoPrivateLease({
    leaseprijs,
    kmPerJaar: a.kmPerJaar,
    energie: a.lopend.energie,
    eigenRisico: s.privateLease.eigenRisico,
    schadesPerJaar: s.privateLease.schadesPerJaar,
  });
  uit.push({
    vorm: "privateLease",
    tco: pl,
    nuBetalen: 0,
    perMaandBetalen: pl.perMaand,
    eindeBetalen: 0,
    bezitEinde: 0,
    leaseprijs,
    leaseprijsGeschat: s.privateLease.offerte == null,
    leaseprijsPosten: s.privateLease.offerte == null ? schatting.posten : undefined,
  });

  return uit;
}
