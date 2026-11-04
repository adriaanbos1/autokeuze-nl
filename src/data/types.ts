/**
 * Datamodel van de dataset. Elk getal heeft een herkomst, zodat de app bij
 * elke waarde kan tonen waar die vandaan komt (CLAUDE.md, principe 3).
 * Er zijn bewust geen velden voor partners, marges of commissies.
 */

export type Betrouwbaarheid = "hoog" | "middel" | "laag";

export interface Herkomst {
  bron: string;
  peildatum: string;
  betrouwbaarheid: Betrouwbaarheid;
  /** Hoe de waarde is afgeleid, in gewone taal. */
  methode: string;
}

export type Aandrijvingstype = "elektrisch" | "plug-in hybride" | "hybride" | "benzine" | "diesel" | "lpg";

/** Mediane officiële specificaties van één aandrijving van een model (RDW, WLTP). */
export interface UitvoeringRdw {
  aandrijving: Aandrijvingstype;
  /** Aantal kentekens waarop de medianen zijn gebaseerd. */
  steekproef: number;
  /** Jaren van eerste toelating in de steekproef, bijv. [2025, 2026]. */
  periode: [number, number];
  catalogusprijs: number | null;
  massaRijklaar: number | null;
  zitplaatsen: number | null;
  trekgewichtGeremd: number | null;
  lengteCm: number | null;
  vermogenKw: number | null;
  /**
   * l/100 km (brandstof) of kWh/100 km (elektrisch), WLTP. Bij een plug-in
   * hybride: het brandstofverbruik zonder elektrische hulp (accu leeg), niet het
   * "gewogen" papieren verbruik.
   */
  verbruikWltp: number | null;
  /**
   * Alleen plug-in hybride: op hoeveel kentekens het verbruik met lege accu uit RDW
   * komt en op hoeveel het is afgeleid uit het gewogen verbruik (src/engine/phev.ts).
   */
  verbruikLegeAccuHerkomst?: { rdw: number; afgeleid: number } | null;
  /** Alleen plug-in hybride: gewogen WLTP-verbruik (l/100 km), zoals in folders. */
  verbruikGewogenWltp: number | null;
  /** Alleen plug-in hybride: elektrisch verbruik (kWh/100 km). */
  elektrischVerbruikWltp: number | null;
  co2Wltp: number | null;
  /** Elektrische actieradius WLTP (EV of plug-in hybride). */
  actieradiusWltpKm: number | null;
  /** Alleen occasions: of een waarde WLTP is of omgerekend uit de oudere NEDC-test. */
  meetmethode?: Partial<Record<"verbruik" | "co2" | "actieradius", "wltp" | "nedc-omgerekend" | null>>;
}

export interface ModelRdw {
  id: string;
  merk: string;
  model: string;
  rang: number;
  registratiesSinds2019: number;
  uitvoeringen: UitvoeringRdw[];
  herkomst: Herkomst;
}
