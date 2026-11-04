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

  restwaarde: {
    kmCorrectiePer10000: {
      waarde: 0.015,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Per 10.000 km boven of onder het normale aantal (15.000 km per jaar) gaat de waarde 1,5% van de nieuwprijs omlaag of omhoog (bandbreedte in de methodiek: 1–2%).",
    } as Aanname<number>,

    normKmPerJaar: {
      waarde: 15000,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
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

  energie: {
    /** Gemiddelde pompprijs per liter incl. btw en accijns, 30 dagen 27-9 t/m 26-10-2026. */
    pompprijs: {
      waarde: { benzine: 2.412, diesel: 2.481, lpg: 0.97 },
      soort: "bron",
      bron: "https://opendata.cbs.nl/ODataApi/odata/80416NED (CBS, pompprijzen motorbrandstoffen per dag)",
      geldigVanaf: "2026-10-26",
      peildatum: PEIL,
      toelichting:
        "Gemiddelde van de CBS-dagprijzen over de laatste 30 beschikbare dagen. CBS baseert dit op transacties van Travelcard; de prijs aan de snelweg is hoger, bij onbemande stations lager.",
    } as Aanname<{ benzine: number; diesel: number; lpg: number }>,

    /** Prijs per extra kWh thuis: variabel leveringstarief + energiebelasting, incl. btw. */
    stroomThuisPerKwh: {
      waarde: 0.26,
      soort: "bron",
      bron: "https://opendata.cbs.nl/ODataApi/odata/85592NED (CBS, gemiddelde energietarieven consumenten, september 2026: €0,1487 levering + €0,11085 energiebelasting incl. btw)",
      geldigVanaf: "2026-09-01",
      peildatum: PEIL,
      toelichting:
        "Alleen het deel dat meestijgt met je verbruik; vaste kosten en de vermindering energiebelasting veranderen niet door laden. Met een dynamisch contract of zonnepanelen kan het veel lager zijn.",
    } as Aanname<number>,

    publiekLadenPerKwh: {
      waarde: 0.5,
      soort: "aanname",
      bron: "eigen aanname, binnen de bandbreedte €0,25–0,55 van https://www.athlon.com/nl/kennisbank/tarieven-elektrische-auto-opladen/",
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Er is geen officieel gemiddelde. Tarieven verschillen sterk per gemeente en laadpas.",
    } as Aanname<number>,

    snelladenPerKwh: {
      waarde: 0.7,
      soort: "aanname",
      bron: "eigen aanname, bovenkant van de bandbreedte €0,50–0,70 van https://www.athlon.com/nl/kennisbank/tarieven-elektrische-auto-opladen/",
      geldigVanaf: PEIL,
      peildatum: PEIL,
    } as Aanname<number>,

    /** Verdeling thuis / publiek / snel, met en zonder eigen laadpunt. */
    laadmix: {
      waarde: {
        metThuisladen: { thuis: 0.8, publiek: 0.1, snel: 0.1 },
        zonderThuisladen: { thuis: 0, publiek: 0.8, snel: 0.2 },
      },
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Snelladen vooral op lange ritten. Wie altijd thuis laadt, betaalt minder.",
    } as Aanname<Record<"metThuisladen" | "zonderThuisladen", { thuis: number; publiek: number; snel: number }>>,

    phevAandeelElektrischZonderThuisladen: {
      waarde: 0,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting:
        "Zonder eigen laadpunt rekenen we een plug-in hybride alsof hij op brandstof rijdt. Met thuisladen gebruiken we het officiële WLTP-aandeel, en dat is volgens praktijkonderzoek vaak te optimistisch.",
    } as Aanname<number>,

    actieradiusPraktijkfactor: {
      waarde: 0.8,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Het bereik in de praktijk is lager dan de WLTP-opgave, vooral in de winter en op de snelweg. We rekenen met 80%.",
    } as Aanname<number>,
  },

  geld: {
    /** Rendement dat je mist op geld dat in de auto zit. */
    gemistRendement: {
      waarde: 0.025,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: PEIL,
      peildatum: PEIL,
      toelichting: "Ongeveer wat je op een spaarrekening krijgt. Niet geverifieerd tegen een actuele bron; vul gerust je eigen percentage in.",
    } as Aanname<number>,
  },

  financiering: {
    leningRente: {
      waarde: 0.075,
      soort: "aanname",
      bron: "eigen aanname binnen de bandbreedte van vergelijkers (vanaf ca. 4,1%, vaak 7–12%; https://financer.nl/leningen/laagste-rente-persoonlijke-lening/) en onder het wettelijk maximum van 12%",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Je rente hangt af van bedrag, looptijd en je situatie. Vul de rente uit je eigen offerte in. Geen officieel gemiddelde gevonden.",
    } as Aanname<number>,

    financialLeaseRente: {
      waarde: 0.075,
      soort: "aanname",
      bron: "eigen aanname; gelijk aan de persoonlijke lening, onder het wettelijk maximum van 12%",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Dealers en merkfinanciers bieden soms acties met lage rente. Vul je eigen offerte in.",
    } as Aanname<number>,

    slottermijnAandeelRestwaarde: {
      waarde: 0.8,
      soort: "aanname",
      bron: "eigen aanname (docs/methodiek.md §3.2)",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Startwaarde voor de slottermijn: 80% van de geschatte waarde aan het eind, zodat de verkoop van de auto de slottermijn waarschijnlijk dekt.",
    } as Aanname<number>,
  },

  zakelijk: {
    /** Een zakelijk gekochte occasion is meestal een marge-auto: geen btw-aftrek op de aankoop. */
    occasionMargeregeling: {
      waarde: true,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Bij een marge-auto staat er geen btw op de factuur, dus is er geen aftrek en geldt de btw-correctie van 1,5%. Koop je een occasion met btw op de factuur, dan valt het voordeliger uit.",
    } as Aanname<boolean>,

    /** DGA: de bv keert de winst na Vpb uit als dividend; elke euro die de bv aan de auto uitgeeft, scheelt dus dividend. */
    bvKeertWinstUit: {
      waarde: true,
      soort: "aanname",
      bron: EIGEN,
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Laat je de winst in de bv staan, dan betaal je de box 2-belasting pas later; het voordeel van de auto in de bv is dan anders.",
    } as Aanname<boolean>,

    /** Pseudo-eindheffing telt niet als aftrekbare kosten voor de Vpb. */
    pseudoEindheffingNietAftrekbaar: {
      waarde: true,
      soort: "aanname",
      bron: "eigen aanname; geen bron gevonden over de aftrekbaarheid in de Vpb",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Voorzichtige aanname. Is de heffing wel aftrekbaar, dan valt de auto in de bv iets gunstiger uit.",
    } as Aanname<boolean>,

    /** Operational lease: we passen dezelfde forfaitaire btw-correctie toe als bij een gekochte auto. */
    btwCorrectieLeaseauto: {
      waarde: true,
      soort: "aanname",
      bron: "eigen aanname; de SRA-advieswijzer noemt leaseauto's niet apart",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Niet geverifieerd in een primaire bron. Laat dit bij een definitief besluit nakijken.",
    } as Aanname<boolean>,
  },

  privateLease: {
    /** Rente die een leasemaatschappij over het geld in de auto rekent. */
    kapitaalrente: {
      waarde: 0.05,
      soort: "aanname",
      bron: "eigen aanname (docs/methodiek.md §3.3)",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
    } as Aanname<number>,

    /** Opslag op de kostprijs voor overhead, risico en winst; inkoopkorting van de leasemaatschappij verrekenen we niet. */
    opslag: {
      waarde: 0.1,
      soort: "aanname",
      bron: "eigen aanname (docs/methodiek.md §3.3); geen openbare bron gevonden voor de opbouw van leaseprijzen",
      geldigVanaf: "2026-11-04",
      peildatum: "2026-11-04",
      toelichting: "Leasemaatschappijen kopen met korting in en verzekeren goedkoper; daar staan overhead, risico en winst tegenover. Een echte offerte kan dus flink afwijken, naar boven én naar beneden.",
    } as Aanname<number>,

    eigenRisico: {
      waarde: 500,
      soort: "aanname",
      bron: "eigen aanname binnen de bandbreedte €250–500 per schade (docs/methodiek.md §3.1)",
      geldigVanaf: "2026-11-03",
      peildatum: "2026-11-04",
    } as Aanname<number>,

    schadesPerJaar: {
      waarde: 0.12,
      soort: "aanname",
      bron: "eigen aanname (docs/methodiek.md §3.1)",
      geldigVanaf: "2026-11-03",
      peildatum: "2026-11-04",
    } as Aanname<number>,
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
