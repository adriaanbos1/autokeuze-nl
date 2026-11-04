/**
 * Criteria, standaardgewichten en ankers van het scoringsmodel (docs/methodiek.md §1).
 *
 * Alles hier is openbaar en geldt voor elk merk gelijk. Een anker is een vaste
 * waarde voor score 0 ("slecht") en 100 ("goed"); scores hangen dus nooit af
 * van welke andere auto's er in de lijst staan.
 */

export type Criterium = "TCO" | "BETR" | "ONDH" | "REST" | "FIT" | "DUUR" | "VEIL" | "COMF";
export type Profiel = "particulier" | "zzp" | "dga" | "leaserijder";

export const CRITERIA: Criterium[] = ["TCO", "BETR", "ONDH", "REST", "FIT", "DUUR", "VEIL", "COMF"];

export const criteriumNaam: Record<Criterium, string> = {
  TCO: "Totale kosten",
  BETR: "Betrouwbaarheid",
  ONDH: "Onderhoud en banden",
  REST: "Restwaarde",
  FIT: "Praktische fit",
  DUUR: "Duurzaamheid",
  VEIL: "Veiligheid",
  COMF: "Comfort en rijplezier",
};

/** Startgewichten per profiel (methodiek §1.3); de gebruiker past ze aan met schuifjes. */
export const standaardGewichten: Record<Profiel, Record<Criterium, number>> = {
  particulier: { TCO: 30, BETR: 15, ONDH: 10, REST: 10, FIT: 15, DUUR: 5, VEIL: 10, COMF: 5 },
  zzp: { TCO: 30, BETR: 20, ONDH: 10, REST: 10, FIT: 15, DUUR: 5, VEIL: 5, COMF: 5 },
  /** DGA: zelfde startgewichten als de ZZP'er (besluit 79); beide betalen zelf, via de onderneming. */
  dga: { TCO: 30, BETR: 20, ONDH: 10, REST: 10, FIT: 15, DUUR: 5, VEIL: 5, COMF: 5 },
  leaserijder: { TCO: 15, BETR: 5, ONDH: 0, REST: 0, FIT: 30, DUUR: 15, VEIL: 15, COMF: 20 },
};

/** Automatische, zichtbare aanpassingen op de startgewichten (methodiek §1.3). */
export const profielTweaks = {
  /** Gezin met kinderen: VEIL +5 en FIT +5, ten koste van COMF en DUUR. */
  gezin: { VEIL: 5, FIT: 5, COMF: -5, DUUR: -5 } as Partial<Record<Criterium, number>>,
  /** Alleen occasions: BETR +5 en ONDH +5; de andere wegen daardoor naar verhouding iets minder. */
  occasion: { BETR: 5, ONDH: 5 } as Partial<Record<Criterium, number>>,
};

export const ankers = {
  /** TCO per maand als factor van jouw maandbudget. */
  tco: { slecht: 2, goed: 0.5 },
  /** Onderhoud + banden in € per maand. */
  onderhoud: { slecht: 100, goed: 20 },
  /** CO₂ uit de uitlaat in g/km, bij jouw gebruik. */
  co2: { slecht: 180, goed: 0 },
  /** Lengte in cm als maat voor ruimte; telt alleen bij 3+ personen of kinderen. */
  lengteGezin: { slecht: 400, goed: 470 },
  /** Praktijkbereik gedeeld door je langste rit (enkele reis); alleen elektrisch. */
  bereikPerRit: { slecht: 1, goed: 2 },
};

/** Bij een gelijke afgeronde eindscore beslist de laagste TCO, daarna de naam (methodiek §1.4). */
export const VERSIE = "0.2 (Fase 3a, 2026-11-04)";
