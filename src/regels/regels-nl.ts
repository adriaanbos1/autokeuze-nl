/**
 * Centrale fiscale en wettelijke parameters voor Nederland.
 *
 * Elke waarde heeft een bron, een ingangsdatum (`geldigVanaf`), een peildatum
 * (wanneer wij het controleerden) en een status. De reken-engine leest alleen
 * uit dit bestand; nergens anders in de code staan belastingbedragen.
 *
 * Uitleg in gewone taal: docs/regels-nl.md
 */

export type Status =
  | "vastgesteld" // in wet of besluit
  | "aangekondigd" // in wetsvoorstel / Belastingplan, nog niet definitief
  | "onzeker"; // bronnen spreken elkaar tegen of alleen secundaire bron

export interface Regel<T> {
  waarde: T;
  status: Status;
  bron: string;
  geldigVanaf: string; // ISO-datum
  peildatum: string; // ISO-datum waarop wij de waarde controleerden
  toelichting?: string;
}

const PEIL = "2026-11-03";

export type Provincie =
  | "groningen"
  | "friesland"
  | "drenthe"
  | "overijssel"
  | "flevoland"
  | "gelderland"
  | "utrecht"
  | "noord-holland"
  | "zuid-holland"
  | "zeeland"
  | "noord-brabant"
  | "limburg";

/** Tabel met vaste bedragen per gewichtsklasse, daarna een lineaire staffel. */
export interface Staffel {
  /** [massa t/m (kg), bedrag per kwartaal] — oplopend; de eerste geldt ook voor alles lichter. */
  klassen: [number, number][];
  /** Vanaf deze massa: basis + perHonderdKg × aantal 100 kg boven `vanaf`. */
  lineair: { vanaf: number; basis: number; perHonderdKg: number }[];
}

export const regels = {
  // ───────────────────────────── MRB ─────────────────────────────
  mrb: {
    /** Rijksdeel personenauto per kwartaal, op massa rijklaar (art. 23 lid 1 Wet MRB 1994). */
    personenautoBasis: {
      waarde: {
        klassen: [
          [600, 21.46],
          [700, 29.12],
          [800, 37.0],
          [900, 48.3],
        ],
        lineair: [
          { vanaf: 1000, basis: 64.24, perHonderdKg: 17.27 },
          { vanaf: 3400, basis: 474.12, perHonderdKg: 12.0 },
        ],
      } satisfies Staffel,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324 (art. 23 lid 1, versie geldend vanaf 01-07-2026)",
      geldigVanaf: "2026-07-01",
      peildatum: PEIL,
      toelichting:
        "Sinds 1 juli 2026 op massa rijklaar (daarvoor eigen massa = rijklaar − 100 kg, met gelijke bedragen).",
    } as Regel<Staffel>,

    /** Brandstoftoeslag diesel per kwartaal (art. 23 lid 2 onderdeel a). */
    toeslagDiesel: {
      waarde: {
        klassen: [
          [600, 84.14],
          [700, 99.59],
          [800, 115.03],
          [900, 130.76],
        ],
        lineair: [{ vanaf: 1000, basis: 153.0, perHonderdKg: 16.57 }],
      } satisfies Staffel,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324 (art. 23 lid 2a)",
      geldigVanaf: "2026-07-01",
      peildatum: PEIL,
    } as Regel<Staffel>,

    /** Brandstoftoeslag overige brandstoffen (o.a. LPG zonder af-fabriek-installatie), art. 23 lid 2b. */
    toeslagOverig: {
      waarde: {
        klassen: [
          [600, 98.71],
          [700, 118.32],
          [800, 137.95],
          [900, 157.54],
        ],
        lineair: [{ vanaf: 1000, basis: 172.08, perHonderdKg: 18.22 }],
      } satisfies Staffel,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324 (art. 23 lid 2b)",
      geldigVanaf: "2026-07-01",
      peildatum: PEIL,
    } as Regel<Staffel>,

    /** Fijnstoftoeslag diesel zonder (geregistreerd) roetfilter: +19% op rijksdeel + brandstoftoeslag. */
    fijnstoftoeslagDiesel: {
      waarde: 0.19,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324 (art. 23 lid 4 en 5)",
      geldigVanaf: "2026-07-01",
      peildatum: PEIL,
    } as Regel<number>,

    /** Bestelauto van een btw-ondernemer, per kwartaal op massa rijklaar (art. 24b Wet MRB). Geen provinciale opcenten. */
    bestelautoOndernemer: {
      waarde: {
        klassen: [[600, 51.97]],
        lineair: [
          { vanaf: 700, basis: 63.55, perHonderdKg: 8.15 },
          { vanaf: 1200, basis: 104.42, perHonderdKg: 8.76 },
          { vanaf: 2200, basis: 192.46, perHonderdKg: 9.43 },
          { vanaf: 2900, basis: 254.79, perHonderdKg: 2.14 },
        ],
      } satisfies Staffel,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324/2026-07-01 (art. 24b, gelezen 4-11-2026); opcenten alleen voor personenauto's en motorrijwielen: https://wetten.overheid.nl/BWBR0005645/2026-07-01 (art. 222 Provinciewet)",
      geldigVanaf: "2026-07-01",
      peildatum: "2026-11-04",
      toelichting:
        "Gecontroleerd met de rekenhulp van de Belastingdienst (4-11-2026): elektrische bestelauto 2.000 kg = €87 per kwartaal (= helft van €174,50, tijdelijke verlaging). Geen korting voor elektrische bestelauto's: art. 23b geldt voor het tarief van art. 23 en 23a. Fijnstoftoeslag diesel 12 jaar en ouder (15%) niet opgenomen.",
    } as Regel<Staffel>,

    /** Tijdelijke halvering voor bestelauto's met ondernemerstarief. */
    bestelautoTijdelijkeVerlaging: {
      waarde: { van: "2026-07-01", tot: "2027-01-01", factor: 0.5 },
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/berichten/nieuws/tijdelijke-verlaging-mrb-bestelautos-vrachtautos",
      geldigVanaf: "2026-07-01",
      peildatum: "2026-11-04",
    } as Regel<{ van: string; tot: string; factor: number }>,

    /** Grondslag provinciale opcenten per kwartaal (art. 222 lid 3 Provinciewet). */
    opcentenGrondslag: {
      waarde: {
        klassen: [
          [600, 14.5],
          [700, 17.33],
          [800, 20.4],
          [900, 26.98],
          [1000, 34.12],
        ],
        lineair: [{ vanaf: 1100, basis: 45.81, perHonderdKg: 11.68 }],
      } satisfies Staffel,
      status: "vastgesteld",
      bron: "art. 222 lid 3 Provinciewet, via https://mijnkentekenchecker.nl/scanners/wegenbelasting; gecontroleerd tegen de MRB-rekentool van de Belastingdienst (tests/mrb-belastingdienst.test.ts)",
      geldigVanaf: "2026-07-01",
      peildatum: PEIL,
      toelichting:
        "Wetstekst zelf niet ingezien, maar de uitkomst klopt voor 1.631 van 1.632 combinaties (12 provincies × gewicht 651–4.050 kg × 4 brandstoffen) met de Belastingdienst. Klasse ≤ 650 kg wijkt hooguit €1 af. Opcenten gaan niet over de brandstoftoeslag.",
    } as Regel<Staffel>,

    /** Opcenten per provincie 2026. */
    opcenten2026: {
      waarde: {
        groningen: 95.7,
        friesland: 92.1,
        drenthe: 92.0,
        overijssel: 82.2,
        flevoland: 84.7,
        gelderland: 98.3,
        utrecht: 86.4,
        "noord-holland": 82.1,
        "zuid-holland": 104.4,
        zeeland: 84.4,
        "noord-brabant": 87.0,
        limburg: 88.5,
      } satisfies Record<Provincie, number>,
      status: "vastgesteld",
      bron: "https://opendata.cbs.nl/ODataApi/OData/80889ned (CBS, tarieven opcenten motorrijtuigenbelasting)",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting: "Friesland per 4 maart 2026 verlaagd naar 92,1. Gelderland incl. eenmalige korting.",
    } as Regel<Record<Provincie, number>>,

    /**
     * Percentage van de normale MRB dat een volledig elektrische (of waterstof)
     * personenauto betaalt, per kalenderjaar. Geldt ook voor de opcenten.
     * Na 2029 vervalt art. 23b: 100%.
     */
    emissievrijPercentage: {
      waarde: { 2026: 0.7, 2027: 0.7, 2028: 0.7, 2029: 0.75 } as Record<number, number>,
      status: "vastgesteld",
      bron: "https://wetten.overheid.nl/BWBR0006324 (art. 23b, vervalt 01-01-2030)",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting:
        "Doorwerking in opcenten volgens wegenbelastingwijzer.nl. Een correctie voor het accugewicht is niet vastgelegd.",
    } as Regel<Record<number, number>>,
  },

  // ───────────────────────────── BPM ─────────────────────────────
  bpm: {
    emissievrijVastBedrag: {
      waarde: 687,
      status: "vastgesteld",
      bron: "https://www.anwb.nl/auto/autobelastingen/bpm",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting:
        "BPM voor brandstofauto's (CO₂-schijven, dieseltoeslag) is nog niet opgenomen: bronnen spreken elkaar tegen. In v1 is de catalogusprijs (incl. BPM) leidend.",
    } as Regel<number>,

    /**
     * Forfaitaire afschrijvingstabel voor gebruikte motorrijtuigen (art. 10 lid 2 Wet BPM 1992).
     * Per rij: [vanaf maand, afschrijving % bij begin, % erbij per begonnen maand daarna].
     * Wij gebruiken deze tabel ook als algemene restwaardecurve (docs/methodiek.md §2.1).
     */
    forfaitaireAfschrijving: {
      waarde: [
        [0, 0, 12],
        [1, 12, 4],
        [3, 20, 3.5],
        [5, 27, 1.5],
        [9, 33, 1],
        [18, 42, 0.75],
        [30, 51, 0.5],
        [42, 57, 0.42],
        [54, 62, 0.42],
        [66, 67, 0.42],
        [78, 72, 0.25],
        [90, 75, 0.25],
        [102, 78, 0.25],
        [114, 81, 0.19],
      ] as [number, number, number][],
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl/wps/wcm/connect/nl/bpm/content/bpm-afschrijving-koerslijst-taxatierapport-forfaitaire-tabel",
      geldigVanaf: "2012-07-01",
      peildatum: "2026-11-04",
      toelichting:
        "Elke maand die gedeeltelijk of helemaal voorbij is telt mee. Rekenvoorbeeld Belastingdienst: ruim 14 maanden → 33% + 6 × 1% = 39%. Vanaf 17 jaar en 10 maanden 100%. Laatst aangepast per 1-7-2012 (secundaire bron: Taxence; kamerbrief noemt de tabel 'uit 2012').",
    } as Regel<[number, number, number][]>,
  },

  // ─────────────────────────── Bijtelling ───────────────────────────
  bijtelling: {
    standaardPercentage: {
      waarde: 0.22,
      status: "vastgesteld",
      bron: "https://www.sra.nl/nieuws/000000/advieswijzers/advieswijzer-auto-zakelijk-of-prive-2026",
      geldigVanaf: "2017-01-01",
      peildatum: PEIL,
    } as Regel<number>,

    /**
     * Korting voor emissievrije auto's, op basis van het jaar van eerste toelating
     * (60-maandenregel: ligt daarna 60 maanden vast).
     * `cap` = null betekent: korting over de hele cataloguswaarde (waterstof/zonnecel).
     */
    emissievrij: {
      waarde: {
        2016: { batterij: { percentage: 0.04, cap: null }, waterstof: { percentage: 0.04, cap: null } },
        2017: { batterij: { percentage: 0.04, cap: null }, waterstof: { percentage: 0.04, cap: null } },
        2018: { batterij: { percentage: 0.04, cap: null }, waterstof: { percentage: 0.04, cap: null } },
        2019: { batterij: { percentage: 0.04, cap: 50000 }, waterstof: { percentage: 0.04, cap: null } },
        2020: { batterij: { percentage: 0.08, cap: 45000 }, waterstof: { percentage: 0.08, cap: null } },
        2021: { batterij: { percentage: 0.12, cap: 40000 }, waterstof: { percentage: 0.12, cap: null } },
        2022: { batterij: { percentage: 0.16, cap: 35000 }, waterstof: { percentage: 0.16, cap: null } },
        2023: { batterij: { percentage: 0.16, cap: 30000 }, waterstof: { percentage: 0.16, cap: null } },
        2024: { batterij: { percentage: 0.16, cap: 30000 }, waterstof: { percentage: 0.16, cap: null } },
        2025: { batterij: { percentage: 0.17, cap: 30000 }, waterstof: { percentage: 0.17, cap: null } },
        2026: { batterij: { percentage: 0.18, cap: 30000 }, waterstof: { percentage: 0.18, cap: null } },
        2027: { batterij: { percentage: 0.2, cap: 30000 }, waterstof: { percentage: 0.2, cap: null } },
      } as Record<number, Record<"batterij" | "waterstof", { percentage: number; cap: number | null }>>,
      // Wettelijk vastgesteld, maar door ons alleen uit (consistente) secundaire bronnen overgenomen.
      status: "onzeker",
      bron: "2016–2026: https://www.salarisvanmorgen.nl/2026/02/12/overzicht-bijtellingspercentages-auto-2011-2026/ (op basis van Forum Salaris) en https://www.sra.nl/nieuws/004501/2025/02/nieuw-overzicht-bijtelling-privegebruik-auto-van-de-zaak (caps 2020–2025 gelijk); 2027: https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/",
      geldigVanaf: "2016-01-01",
      peildatum: "2026-11-04",
      toelichting:
        "Sleutel = jaar waarin de (lopende) periode van 60 maanden begon. Na 60 maanden gelden de regels van het jaar waarin de nieuwe periode begint. 2016: op basis van datum eerste tenaamstelling. Vanaf eerste toelating 2028: geen korting meer, 22% over alles. Geen primaire bron (Belastingdienst-tabel) gevonden; twee secundaire bronnen zijn consistent.",
    } as Regel<Record<number, Record<"batterij" | "waterstof", { percentage: number; cap: number | null }>>>,

    looptijdVastMaanden: {
      waarde: 60,
      status: "vastgesteld",
      bron: "SRA advieswijzer 2026",
      geldigVanaf: "2017-01-01",
      peildatum: PEIL,
    } as Regel<number>,

    /** Grens privé-km per jaar waaronder geen bijtelling geldt (met sluitende rittenadministratie). */
    grensPriveKm: {
      waarde: 500,
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/auto-van-de-zaak-of-prive/",
      geldigVanaf: "2000-01-01",
      peildatum: PEIL,
    } as Regel<number>,
  },

  /** Werkgever betaalt per jaar een % van de catalogusprijs voor nieuwe auto's mét CO₂-uitstoot die privé mogen worden gebruikt. */
  /** Overgangsregeling: auto's die vóór 2027 al ter beschikking stonden, vallen er pas later onder. */
  pseudoEindheffingOvergang: {
    waarde: { vanafJaar: 2031 },
    status: "onzeker",
    bron: "https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/",
    geldigVanaf: "2027-01-01",
    peildatum: "2026-11-04",
    toelichting: "Datum onzeker: bronnen noemen 17-9-2030 of 1-1-2031; het kabinet wil 1-1-2031. Wij rekenen met 2031 (docs/regels-nl.md §3).",
  } as Regel<{ vanafJaar: number }>,

  pseudoEindheffing: {
    waarde: { percentage: 0.12, vanafJaar: 2027 },
    status: "vastgesteld",
    bron: "https://www.athlon.com/nl/kennisbank/belastingplan-2027-autobelastingen-en-mobiliteit/",
    geldigVanaf: "2027-01-01",
    peildatum: PEIL,
    toelichting:
      "Geldt ook voor de DGA/bv, niet voor de IB-ondernemer zelf. Auto's die vóór 2027 al ter beschikking stonden: pas later (overgangsregeling).",
  } as Regel<{ percentage: number; vanafJaar: number }>,

  // ─────────────────────────── Zakelijk ───────────────────────────
  zakelijk: {
    kilometervergoeding: {
      waarde: 0.25,
      status: "vastgesteld",
      bron: "https://www.accountancyvanmorgen.nl/2026/05/27/belastingdienst-licht-verwerking-hogere-onbelaste-kilometervergoeding-in-loonaangifte-toe/",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting: "Met terugwerkende kracht per 1-1-2026 via beleidsbesluit; wettelijke verankering in Belastingplan 2027.",
    } as Regel<number>,

    btwCorrectiePrivegebruik: {
      waarde: { standaard: 0.027, naVierJaarOfZonderAftrek: 0.015 },
      status: "vastgesteld",
      bron: "https://www.sra.nl/nieuws/000000/advieswijzers/advieswijzer-auto-zakelijk-of-prive-2026",
      geldigVanaf: "2011-07-01",
      peildatum: PEIL,
      toelichting:
        "Forfait over de catalogusprijs incl. btw en BPM. 1,5% \"na het vierde jaar van aanschaf of ingeval bij de aanschaf geen recht op aftrek van btw bestond\" (SRA). Woon-werk telt voor de btw als privé.",
    } as Regel<{ standaard: number; naVierJaarOfZonderAftrek: number }>,

    btwTarief: {
      waarde: 0.21,
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl (algemeen btw-tarief)",
      geldigVanaf: "2012-10-01",
      peildatum: PEIL,
    } as Regel<number>,
  },

  // ──────────────────── Inkomstenbelasting box 1 ────────────────────
  box1: {
    schijven2026: {
      /** [inkomen t/m, tarief] — laatste schijf heeft `null` als bovengrens. */
      waarde: [
        [38883, 0.3575],
        [78426, 0.3756],
        [null, 0.495],
      ] as [number | null, number][],
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/ ; https://www.sra.nl/nieuws/000000/2025/09/nieuwe-belastingtarieven--kortingen-en-faciliteiten-2026",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
      toelichting:
        "Niet-AOW-gerechtigden. Eén bron (Auren) noemt €79.137 als tweede grens; KVK en SRA €78.426. Heffingskortingen (afbouw) zitten hier niet in.",
    } as Regel<[number | null, number][]>,

    mkbWinstvrijstelling: {
      waarde: 0.127,
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
    } as Regel<number>,

    /** Maximaal tarief waartegen ondernemersaftrek en MKB-winstvrijstelling werken (aftrekbeperking). */
    /** Algemene heffingskorting 2026, tot de AOW-leeftijd. Afbouw over het verzamelinkomen. */
    algemeneHeffingskorting2026: {
      waarde: { maximaal: 3115, afbouwVanaf: 29736, afbouwPercentage: 0.06398, nulVanaf: 78426 },
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
    } as Regel<{ maximaal: number; afbouwVanaf: number; afbouwPercentage: number; nulVanaf: number }>,

    /**
     * Arbeidskorting 2026, tot de AOW-leeftijd: [arbeidsinkomen vanaf, basisbedrag, percentage over (inkomen − vanaf)].
     * Laatste regel: vanaf €132.920 is de korting €0.
     */
    arbeidskorting2026: {
      waarde: [
        [0, 0, 0.08324],
        [11965, 996, 0.31009],
        [25845, 5300, 0.0195],
        [45592, 5685, -0.0651],
        [132920, 0, 0],
      ] as [number, number, number][],
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Het Belastingplan 2026 noemde een maximum van €5.712; de Belastingdienst-tabel gebruikt €5.685 en die sluit aan op de schijven.",
    } as Regel<[number, number, number][]>,

    zelfstandigenaftrek2026: {
      waarde: 1200,
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Alleen bij het urencriterium (1.225 uur per jaar). Startersaftrek niet opgenomen.",
    } as Regel<number>,

    maxAftrektarief: {
      waarde: 0.3756,
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/",
      geldigVanaf: "2026-01-01",
      peildatum: PEIL,
    } as Regel<number>,
  },
  // ─────────────────────── Zero-emissiezones ───────────────────────
  zezone: {
    /** Overgangsregeling bestelauto's: laatste kalenderjaar met toegang. */
    overgang: {
      waarde: { euro5TotEnMet: 2026, euro6TotEnMet: 2027, fossielNieuwVanaf: 2025 },
      status: "aangekondigd",
      bron: "https://www.kvk.nl/duurzaamheid/zero-emissiezones-kom-je-straks-de-stad-nog-in-met-je-auto/ ; https://www.eerstekamer.nl/brief_in/20261022/verlenging_overgangsregeling_nul/f=/vn20fauaq8hf.pdf",
      geldigVanaf: "2025-01-01",
      peildatum: "2026-11-04",
      toelichting:
        "Euro 5 tot 1-1-2027, Euro 6 tot 1-1-2028 (kabinet wil verlengen tot 1-1-2029, nog niet vastgesteld). Fossiele bestelauto's met eerste inschrijving vanaf 2025: geen toegang. Per gemeente eigen zone en invoerdatum (opwegnaarzes.nl).",
    } as Regel<{ euro5TotEnMet: number; euro6TotEnMet: number; fossielNieuwVanaf: number }>,
  },

  // ─────────────────────────── DGA ───────────────────────────
  dga: {
    /** Normbedrag gebruikelijk loon (het hoogste van drie maatstaven; dit is de ondergrens zonder tegenbewijs). */
    gebruikelijkLoon2026: {
      waarde: 58000,
      status: "vastgesteld",
      bron: "https://www.sra.nl/nieuws/000000/2025/12/gebruikelijk-loon-dga-in-2026-naar-58000 ; https://www.eerstekamer.nl/behandeling/20260303/brief_regering_vervolgonderzoek/document3/f=/vmvpimjir0z5.pdf",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Lager mag als het loon uit de meest vergelijkbare dienstbetrekking aantoonbaar lager is.",
    } as Regel<number>,
  },

  // ─────────────────── Vennootschapsbelasting en box 2 ───────────────────
  vpb: {
    /** [winst t/m, tarief]; laatste schijf zonder bovengrens. */
    tarieven2026: {
      waarde: [
        [200000, 0.19],
        [null, 0.258],
      ] as [number | null, number][],
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
    } as Regel<[number | null, number][]>,
  },

  box2: {
    /** [uitkering t/m, tarief]; per belastingplichtige (zonder partnerverdeling). */
    tarieven2026: {
      waarde: [
        [68843, 0.245],
        [null, 0.31],
      ] as [number | null, number][],
      status: "vastgesteld",
      bron: "https://www.kvk.nl/geldzaken/belastingtarieven-2026/",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Of de schijfgrens met een fiscale partner verdubbelt, staat niet op de bronpagina; we rekenen zonder partner.",
    } as Regel<[number | null, number][]>,
  },

  // ─────────────────────── Investeringsaftrek ───────────────────────
  kia: {
    /** KIA 2026: [investering vanaf (meer dan), vast bedrag, percentage, percentage geldt over deel boven]. */
    tabel2026: {
      waarde: [
        [0, 0, 0, 0],
        [2900, 0, 0.28, 0],
        [71683, 20072, 0, 0],
        [132746, 20072, -0.0756, 132746],
        [398236, 0, 0, 0],
      ] as [number, number, number, number][],
      status: "vastgesteld",
      bron: "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/inkomstenbelasting/veranderingen-inkomstenbelasting-2026/investeringsaftrek-2026/kleinschaligheidsinvesteringsaftrek-2026",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Over het totaal van de investeringen in een jaar. Per bedrijfsmiddel minimaal €450 (art. 3.45 lid 2 Wet IB 2001).",
    } as Regel<[number, number, number, number][]>,

    /** Personenauto's die niet bestemd zijn voor beroepsvervoer over de weg zijn uitgesloten (art. 3.45 lid 1 onderdeel d Wet IB 2001). */
    personenautoUitgesloten: {
      waarde: true,
      status: "onzeker",
      bron: "https://wetten.overheid.nl/BWBR0011353/2026-01-01 (art. 3.45 lid 1 onderdeel d, gelezen 4-11-2026)",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting:
        "Secundaire bronnen (o.a. Bridgefund, MKB Servicedesk) noemen een uitzondering voor emissievrije personenauto's; die staat niet in de wettekst en is niet gevonden in een primaire bron. We rekenen daarom zonder KIA voor personenauto's. Bestelauto's vallen er wel onder.",
    } as Regel<boolean>,
  },

  // ─────────────────────── Consumptief krediet ───────────────────────
  krediet: {
    /** Maximale kredietvergoeding (jaarrente) voor consumptief krediet: wettelijke rente 4% + 8 procentpunt. */
    maximaleKredietvergoeding: {
      waarde: 0.12,
      status: "vastgesteld",
      bron: "https://www.rijksoverheid.nl/onderwerpen/bescherming-van-consumenten/vraag-en-antwoord/wat-is-kredietvergoeding-en-wat-is-het-maximale-kredietvergoedingspercentage",
      geldigVanaf: "2026-01-01",
      peildatum: "2026-11-04",
      toelichting: "Daalde van 14% naar 12% doordat de wettelijke rente per 1-1-2026 van 6% naar 4% ging. Geldt voor alle consumptieve kredieten, ook huurkoop/financial lease.",
    } as Regel<number>,
  },

  // ──────────────── WLTP: plug-in hybrides (utility factor) ────────────────
  wltp: {
    /**
     * Utility factor (UF): het deel van de kilometers dat de WLTP-regels aannemen als
     * elektrisch gereden, afhankelijk van de elektrische actieradius d:
     * UF(d) = 1 − exp(−Σ Cᵢ · (d / dn)ⁱ), i = 1…10.
     */
    utilityFactor: {
      waarde: {
        coefficienten: [26.25, -38.94, -631.05, 5964.83, -25095, 60380.2, -87517, 75513.8, -35749, 7154.94],
        /** Normaalafstand dn (km) per emissiecode, zoals RDW die toont in `uitlaatemissieniveau`. */
        normaalafstand: { EA: 800, EB: 2200, EC: 4260, ouder: 800 },
      },
      status: "vastgesteld",
      bron: "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R0443 (Verordening (EU) 2023/443, bijlage XXI punt 3.2, tabel A8.App5/1)",
      geldigVanaf: "2025-01-01",
      peildatum: "2026-11-04",
      toelichting:
        "dnea 800 km (Euro 6e), dneb 2 200 km vanaf 1-1-2025 (Euro 6e-bis), dnec 4 260 km vanaf 1-1-2027 (Euro 6e-bis-FCM); keuze volgt de emissiecode EA/EB/EC van de auto. Oudere Euro 6-auto's: zelfde coëfficiënten met 800 km. De vergelijking staat in de verordening als afbeelding; wij gebruiken de standaardvorm uit VN-GTR 15 en controleerden die tegen 2 178 RDW-auto's met een officieel verbruik bij lege accu (docs/methodiek.md §2.4).",
    } as Regel<{ coefficienten: number[]; normaalafstand: { EA: number; EB: number; EC: number; ouder: number } }>,
  },
} as const;
