/**
 * Kostenaannames zonder wettelijke basis: onderhoud, banden, verzekering.
 *
 * Hiervoor bestaat geen open bron per model (docs/databronnen.md §2.11–2.12).
 * Waar een openbare bron een getal geeft, staat die erbij ("bron"); de rest is
 * onze eigen aanname ("aanname"), openbaar en aanpasbaar. De app toont deze
 * posten altijd als indicatief.
 */
import type { Regel } from "./regels-nl";

export type Soort = "bron" | "aanname";

export interface Aanname<T> extends Omit<Regel<T>, "status"> {
  soort: Soort;
}

const PEIL = "2026-11-04";
const EIGEN = "eigen aanname AutoKeuze NL (docs/methodiek.md §2.3)";

export type OnderhoudsGroep = "verbranding" | "elektrisch";

export const aannames = {
  onderhoud: {
    uurtariefInclBtw: {
      waarde: 82,
      soort: "bron",
      bron: "https://www.anwb.nl/auto/autokosten/onderhoudskosten-auto (AMT-enquête 2024 onder 200 garagebedrijven, gepubliceerd 1-11-2025)",
      geldigVanaf: "2024-01-01",
      peildatum: PEIL,
      toelichting: "Gemiddeld ca. €82 per uur incl. btw, spreiding €61–165. Dealers rekenen volgens dezelfde pagina meer dan €100 excl. btw.",
    } as Aanname<number>,

    intervalKm: {
      waarde: 20000,
      soort: "bron",
      bron: "https://www.anwb.nl/auto/autokosten/onderhoudskosten-auto",
      geldigVanaf: "2025-11-01",
      peildatum: PEIL,
      toelichting: "ANWB-advies: elke 20.000 km of eens per jaar, wat het eerst komt. Fabrieksschema's verschillen per model.",
    } as Aanname<number>,

    arbeidsurenPerBeurt: {
      waarde: { verbranding: 1.5, elektrisch: 1.0 } as Record<OnderhoudsGroep, number>,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Verbranding (ook hybride en plug-in hybride): olie, filters, controle. Elektrisch: geen olie of bougies, wel controle, remvloeistof en interieurfilter.",
    } as Aanname<Record<OnderhoudsGroep, number>>,

    onderdelenPerBeurtInclBtw: {
      waarde: { verbranding: 120, elektrisch: 50 } as Record<OnderhoudsGroep, number>,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
    } as Aanname<Record<OnderhoudsGroep, number>>,

    leeftijdsopslagPerJaar: {
      waarde: 0.06,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Per jaar boven 3 jaar oud komt er 6% bij voor slijtagedelen en reparaties (bandbreedte in de methodiek: 5–8%).",
    } as Aanname<number>,
  },

  banden: {
    levensduurKm: {
      waarde: 40000,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Gemiddelde levensduur van een set van vier, bij normaal rijgedrag. Geen winter/zomerwissel.",
    } as Aanname<number>,

    slijtagefactorElektrisch: {
      waarde: 1.2,
      soort: "bron",
      bron: "https://www.moveelectric.com/nl-nl/e-cars/slijten-de-banden-van-elektrische-autos-sneller (Michelin: tot 20% snellere slijtage)",
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Secundaire bron; Emissions Analytics noemt ca. 20% extra slijtage per 450 kg extra gewicht.",
    } as Aanname<number>,

    /** [massa rijklaar t/m (kg), prijs per band incl. montage en btw]; laatste klasse geldt ook voor alles zwaarder. */
    prijsPerBand: {
      waarde: [
        [1200, 90],
        [1600, 120],
        [2000, 160],
        [Infinity, 210],
      ] as [number, number][],
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Middenklasse merkband. RDW publiceert geen bandenmaat; gewicht is hier de benadering voor de maat.",
    } as Aanname<[number, number][]>,
  },

  verzekering: {
    /** Gemiddelde maandpremie per dekking, H1 2026. */
    gemiddeldePerMaand: {
      waarde: { wa: 109.57, waPlus: 100.17, allrisk: 111.49 },
      soort: "bron",
      bron: "https://www.geld.nl/autoverzekering/service/datamonitor-autoverzekering (gepubliceerd 7-7-2026)",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting:
        "Gemiddelden uit vergelijkingen op Geld.nl, zonder uitsplitsing naar leeftijd, woonplaats of schadevrije jaren. WA-auto's zijn daar gemiddeld 15 jaar oud, allrisk 7 jaar. Laagste aanbiedingen beginnen rond €20 per maand (Overstappen.nl, oktober 2026). Vul daarom bij voorkeur je eigen premie in.",
    } as Aanname<{ wa: number; waPlus: number; allrisk: number }>,
  },
} as const;
