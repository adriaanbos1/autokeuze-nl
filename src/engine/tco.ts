import { rond2, som, type Post } from "./geld";
import { financialLease, persoonlijkeLening } from "./financiering";

/** Lopende kosten per maand die bij elke financieringsvorm gelijk zijn (behalve wat lease al dekt). */
export interface LopendeKosten {
  energie: number;
  mrb: number;
  verzekering: number;
  onderhoudEnBanden: number;
}

export interface AutoBezit {
  aankoopprijs: number;
  restwaardeEinde: number;
  maanden: number;
  kmPerJaar: number;
  lopend: LopendeKosten;
  /** Netto rendement dat je mist op geld dat in de auto zit (bijv. 0,025). */
  rendement: number;
}

export interface TcoUitkomst {
  perMaand: number;
  perKm: number;
  posten: Post[];
}

function afronden(posten: Post[], kmPerJaar: number): TcoUitkomst {
  const perMaand = som(...posten.map((p) => p.bedrag));
  return { perMaand, perKm: Math.round((perMaand * 12 * 1000) / kmPerJaar) / 1000, posten };
}

function afschrijving(a: AutoBezit): Post {
  return {
    label: "Afschrijving",
    bedrag: rond2((a.aankoopprijs - a.restwaardeEinde) / a.maanden),
    uitleg: `(${a.aankoopprijs} − ${a.restwaardeEinde}) / ${a.maanden} maanden`,
  };
}

function lopendePosten(l: LopendeKosten): Post[] {
  return [
    { label: "Energie", bedrag: l.energie, uitleg: "brandstof of laden" },
    { label: "Motorrijtuigenbelasting", bedrag: l.mrb, uitleg: "MRB incl. provinciale opcenten" },
    { label: "Verzekering", bedrag: l.verzekering, uitleg: "indicatief" },
    { label: "Onderhoud en banden", bedrag: l.onderhoudEnBanden, uitleg: "indicatief" },
  ];
}

/** Contant kopen: kosten van geld = gemiddeld vastgezet kapitaal × rendement. */
export function tcoContant(a: AutoBezit): TcoUitkomst {
  const gemKapitaal = (a.aankoopprijs + a.restwaardeEinde) / 2;
  return afronden(
    [
      afschrijving(a),
      {
        label: "Kosten van geld (gemist rendement)",
        bedrag: rond2((gemKapitaal * a.rendement) / 12),
        uitleg: `gemiddeld kapitaal ${gemKapitaal} × ${a.rendement * 100}% / 12`,
      },
      ...lopendePosten(a.lopend),
    ],
    a.kmPerJaar,
  );
}

/** Deels lenen: rente op de lening + gemist rendement op het eigen geld. */
export function tcoLening(
  a: AutoBezit,
  lening: { hoofdsom: number; jaarrente: number; maanden: number },
): TcoUitkomst & { maandtermijn: number } {
  const l = persoonlijkeLening(lening.hoofdsom, lening.jaarrente, lening.maanden);
  const eigenGeld = a.aankoopprijs - lening.hoofdsom;
  const rente = rond2((l.totaleRente / a.maanden));
  const gemist = rond2((eigenGeld * a.rendement) / 12);
  return {
    ...afronden(
      [
        afschrijving(a),
        {
          label: "Kosten van geld (rente + gemist rendement)",
          bedrag: som(rente, gemist),
          uitleg: `rente ${l.totaleRente} / ${a.maanden} = ${rente}; eigen geld ${eigenGeld} × ${a.rendement * 100}% / 12 = ${gemist}`,
        },
        ...lopendePosten(a.lopend),
      ],
      a.kmPerJaar,
    ),
    maandtermijn: l.maandtermijn,
  };
}

/** Financial lease / huurkoop met slottermijn (particulier). */
export function tcoFinancialLease(
  a: AutoBezit,
  fl: { hoofdsom: number; jaarrente: number; slottermijn: number },
): TcoUitkomst & { maandtermijn: number; restschuldRisico: number } {
  const u = financialLease(fl.hoofdsom, fl.jaarrente, a.maanden, fl.slottermijn, a.restwaardeEinde);
  const eigenGeld = a.aankoopprijs - fl.hoofdsom;
  const gemist = rond2((eigenGeld * a.rendement) / 12);
  return {
    ...afronden(
      [
        afschrijving(a),
        {
          label: "Kosten van geld (rente + gemist rendement)",
          bedrag: som(u.rentePerMaand, gemist),
          uitleg: `rente incl. slottermijn ${u.totaleRente} / ${a.maanden}; eigen geld ${eigenGeld} × ${a.rendement * 100}% / 12`,
        },
        ...lopendePosten(a.lopend),
      ],
      a.kmPerJaar,
    ),
    maandtermijn: u.maandtermijn,
    restschuldRisico: u.restschuldRisico,
  };
}

export interface PrivateLease {
  leaseprijs: number;
  kmPerJaar: number;
  energie: number;
  eigenRisico: number;
  /** Verwacht aantal schades per jaar (aanname, standaard 0,12). */
  schadesPerJaar: number;
  /** Verwachte meer-km-kosten per maand (0 als je binnen je bundel blijft). */
  meerKmPerMaand?: number;
}

/** Private lease: leaseprijs dekt afschrijving, rente, MRB, verzekering en onderhoud. */
export function tcoPrivateLease(p: PrivateLease): TcoUitkomst {
  return afronden(
    [
      { label: "Leaseprijs", bedrag: p.leaseprijs, uitleg: "incl. MRB, verzekering, onderhoud, banden" },
      { label: "Energie", bedrag: p.energie, uitleg: "niet in leaseprijs" },
      {
        label: "Verwacht eigen risico",
        bedrag: rond2((p.schadesPerJaar * p.eigenRisico) / 12),
        uitleg: `${p.schadesPerJaar} schade/jaar × €${p.eigenRisico} / 12`,
      },
      { label: "Meer-km-kosten", bedrag: p.meerKmPerMaand ?? 0, uitleg: "boven je km-bundel" },
    ],
    p.kmPerJaar,
  );
}
