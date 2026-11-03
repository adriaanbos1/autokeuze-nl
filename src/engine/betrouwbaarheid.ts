/**
 * Betrouwbaarheidsscore uit APK-gebreken (docs/methodiek.md §2.2).
 *
 * Indirecte standaardisatie: per bouwjaar en leeftijd bij keuring vergelijken we
 * het werkelijke aantal keuringen met een technisch gebrek met het aantal dat je
 * zou verwachten als het model precies zo vaak gebreken had als het landelijk
 * gemiddelde voor auto's van dat bouwjaar en die leeftijd.
 */

export interface Telling {
  keuringen: number;
  metGebrek: number;
}

/** bouwjaar → leeftijd bij keuring → telling */
export type Tellingen = Record<number, Record<number, Telling>>;

export interface BetrouwbaarheidUitkomst {
  /** Werkelijk / verwacht. 1 = gemiddeld, 0,5 = half zo vaak een gebrek. */
  verhouding: number;
  /** 0–100; 0,5× → 100, 1× → 50, 2× → 0 (logaritmisch). */
  score: number;
  keuringen: number;
  werkelijk: number;
  verwacht: number;
  zekerheid: "hoog" | "middel" | "laag";
}

/** Minimaal aantal keuringen per cel (bouwjaar × leeftijd) om mee te tellen. */
export const MIN_PER_CEL = 30;
/** Minimaal aantal keuringen in totaal; daaronder geen score ("onvoldoende data"). */
export const MIN_TOTAAL = 200;

export function scoreUitVerhouding(verhouding: number): number {
  const s = (100 * (1 - Math.log2(verhouding))) / 2;
  return Math.round(Math.min(100, Math.max(0, s)));
}

export function betrouwbaarheid(model: Tellingen, landelijk: Tellingen, bouwjaren?: number[]): BetrouwbaarheidUitkomst | null {
  let keuringen = 0;
  let werkelijk = 0;
  let verwacht = 0;
  for (const [j, perLeeftijd] of Object.entries(model)) {
    if (bouwjaren && !bouwjaren.includes(Number(j))) continue;
    for (const [l, t] of Object.entries(perLeeftijd)) {
      const ref = landelijk[Number(j)]?.[Number(l)];
      if (t.keuringen < MIN_PER_CEL || !ref || ref.keuringen < MIN_PER_CEL || ref.metGebrek === 0) continue;
      keuringen += t.keuringen;
      werkelijk += t.metGebrek;
      verwacht += (t.keuringen * ref.metGebrek) / ref.keuringen;
    }
  }
  if (keuringen < MIN_TOTAAL || verwacht === 0) return null;
  // Halve correctie bij 0 gebreken, zodat de verhouding niet 0 wordt.
  const verhouding = Math.max(werkelijk, 0.5) / verwacht;
  return {
    verhouding: Math.round(verhouding * 100) / 100,
    score: scoreUitVerhouding(verhouding),
    keuringen,
    werkelijk,
    verwacht: Math.round(verwacht * 10) / 10,
    // ruwe maat voor statistische zekerheid: aantal waargenomen gebreken
    zekerheid: werkelijk >= 100 ? "hoog" : werkelijk >= 40 ? "middel" : "laag",
  };
}
