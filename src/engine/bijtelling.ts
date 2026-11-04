import { regels } from "@/regels/regels-nl";
import { rond2 } from "./geld";

const eur = (x: number) => `€${x.toLocaleString("nl-NL")}`;

export type Aandrijving = "brandstof" | "batterij" | "waterstof";

export interface BijtellingInvoer {
  /** Cataloguswaarde incl. btw en BPM. */
  cataloguswaarde: number;
  aandrijving: Aandrijving;
  /** Jaar van eerste toelating; het percentage ligt daarna 60 maanden vast. */
  jaarEersteToelating: number;
}

export interface BijtellingUitkomst {
  perJaar: number;
  uitleg: string;
}

/** Bijtelling per jaar (binnen de eerste 60 maanden na eerste toelating). */
export function bijtellingPerJaar(b: BijtellingInvoer): BijtellingUitkomst {
  const std = regels.bijtelling.standaardPercentage.waarde;
  const korting = b.aandrijving === "brandstof" ? undefined : regels.bijtelling.emissievrij.waarde[b.jaarEersteToelating]?.[b.aandrijving];

  if (!korting) {
    return { perJaar: rond2(b.cataloguswaarde * std), uitleg: `${std * 100}% × ${eur(b.cataloguswaarde)}` };
  }
  const deelLaag = korting.cap === null ? b.cataloguswaarde : Math.min(b.cataloguswaarde, korting.cap);
  const deelHoog = b.cataloguswaarde - deelLaag;
  return {
    perJaar: rond2(deelLaag * korting.percentage + deelHoog * std),
    uitleg: `${korting.percentage * 100}% × ${eur(deelLaag)}` + (deelHoog > 0 ? ` + ${std * 100}% × ${eur(deelHoog)}` : ""),
  };
}

/**
 * Netto kosten voor een werknemer (leaserijder): bijtelling minus eigen bijdrage,
 * belast tegen het marginale tarief, plus de eigen bijdrage zelf.
 */
export function nettoBijtellingWerknemer(
  bijtelling: number,
  marginaalTarief: number,
  eigenBijdragePerJaar = 0,
): { perJaar: number; perMaand: number } {
  const belast = Math.max(0, bijtelling - eigenBijdragePerJaar);
  const perJaar = rond2(belast * marginaalTarief + eigenBijdragePerJaar);
  return { perJaar, perMaand: rond2(perJaar / 12) };
}

/**
 * Pseudo-eindheffing voor de werkgever (of de bv van de DGA): vanaf 2027
 * 12% van de catalogusprijs per jaar voor nieuw ter beschikking gestelde auto's
 * met CO₂-uitstoot die privé gebruikt mogen worden.
 */
export function pseudoEindheffing(cataloguswaarde: number, aandrijving: Aandrijving, jaarTerBeschikking: number): number {
  const { percentage, vanafJaar } = regels.pseudoEindheffing.waarde;
  if (aandrijving !== "brandstof" || jaarTerBeschikking < vanafJaar) return 0;
  return rond2(cataloguswaarde * percentage);
}
