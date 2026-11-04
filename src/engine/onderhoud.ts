// Onderhoud, banden en verzekering per jaar (docs/methodiek.md §2.3). Alle
// getallen komen uit src/regels/aannames.ts en zijn indicatief.
import { aannames, type OnderhoudsGroep } from "@/regels/aannames";
import { rond2, type Post } from "./geld";

export type Dekking = "wa" | "waPlus" | "allrisk";

const groep = (elektrisch: boolean): OnderhoudsGroep => (elektrisch ? "elektrisch" : "verbranding");

/** Onderhoudsbeurten per jaar: elke intervalKm of eens per jaar, wat het eerst komt. */
export function beurtenPerJaar(kmPerJaar: number): number {
  return Math.max(1, kmPerJaar / aannames.onderhoud.intervalKm.waarde);
}

export function onderhoudPerJaar(p: { elektrisch: boolean; kmPerJaar: number; leeftijdJaar: number }): Post {
  const o = aannames.onderhoud;
  const g = groep(p.elektrisch);
  const perBeurt = o.arbeidsurenPerBeurt.waarde[g] * o.uurtariefInclBtw.waarde + o.onderdelenPerBeurtInclBtw.waarde[g];
  const beurten = beurtenPerJaar(p.kmPerJaar);
  const opslag = 1 + o.leeftijdsopslagPerJaar.waarde * Math.max(0, p.leeftijdJaar - 3);
  return {
    label: "Onderhoud",
    bedrag: rond2(perBeurt * beurten * opslag),
    uitleg: `${beurten.toFixed(2)} beurt(en) × (${o.arbeidsurenPerBeurt.waarde[g]} uur × €${o.uurtariefInclBtw.waarde} + €${o.onderdelenPerBeurtInclBtw.waarde[g]} onderdelen)${opslag > 1 ? ` × ${opslag.toFixed(2)} leeftijdsopslag` : ""}`,
  };
}

export function prijsPerBand(massaRijklaar: number): number {
  const klassen = aannames.banden.prijsPerBand.waarde;
  return (klassen.find(([tm]) => massaRijklaar <= tm) ?? klassen[klassen.length - 1])[1];
}

export function bandenPerJaar(p: { elektrisch: boolean; massaRijklaar: number; kmPerJaar: number }): Post {
  const b = aannames.banden;
  const factor = p.elektrisch ? b.slijtagefactorElektrisch.waarde : 1;
  const sets = (p.kmPerJaar * factor) / b.levensduurKm.waarde;
  const band = prijsPerBand(p.massaRijklaar);
  return {
    label: "Banden",
    bedrag: rond2(sets * 4 * band),
    uitleg: `${p.kmPerJaar} km${factor !== 1 ? ` × ${factor} (snellere slijtage elektrisch)` : ""} / ${b.levensduurKm.waarde} km per set × 4 × €${band}`,
  };
}

/** Eigen premie als die is ingevuld, anders het marktgemiddelde voor de dekking. */
export function verzekeringPerJaar(p: { dekking: Dekking; eigenPremiePerMaand?: number | null }): Post {
  if (p.eigenPremiePerMaand != null)
    return { label: "Verzekering", bedrag: rond2(p.eigenPremiePerMaand * 12), uitleg: `jouw premie €${p.eigenPremiePerMaand} × 12` };
  const gem = aannames.verzekering.gemiddeldePerMaand.waarde[p.dekking];
  return { label: "Verzekering", bedrag: rond2(gem * 12), uitleg: `marktgemiddelde ${p.dekking} €${gem} × 12 (indicatief)` };
}
