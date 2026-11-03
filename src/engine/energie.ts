import { rond2 } from "./geld";

export interface LaadMix {
  /** Aandeel thuis/publiek/snelladen; moeten samen 1 zijn. */
  thuis: number;
  publiek: number;
  snel: number;
  prijsThuis: number;
  prijsPubliek: number;
  prijsSnel: number;
}

/** Gewogen gemiddelde prijs per kWh over de laadmix. */
export function gemiddeldeLaadprijs(mix: LaadMix): number {
  const totaal = mix.thuis + mix.publiek + mix.snel;
  if (Math.abs(totaal - 1) > 1e-9) throw new Error(`Laadmix telt op tot ${totaal}, moet 1 zijn`);
  return mix.thuis * mix.prijsThuis + mix.publiek * mix.prijsPubliek + mix.snel * mix.prijsSnel;
}

/**
 * Energiekosten per jaar.
 * @param verbruikPer100 liter of kWh per 100 km (EV: inclusief laadverlies)
 * @param prijsPerEenheid € per liter of per kWh
 */
export function energiekostenPerJaar(kmPerJaar: number, verbruikPer100: number, prijsPerEenheid: number): number {
  return rond2(((kmPerJaar * verbruikPer100) / 100) * prijsPerEenheid);
}
