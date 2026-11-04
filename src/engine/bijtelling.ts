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
  /** Kalenderjaar waarvoor je de bijtelling wilt weten; standaard het jaar van eerste toelating. */
  kalenderjaar?: number;
}

/**
 * Begin van de lopende periode van 60 maanden. Na 60 maanden gelden de regels van het
 * jaar waarin de nieuwe periode begint. Op jaarbasis: we rekenen niet per maand.
 */
export function periodeStartjaar(jaarEersteToelating: number, kalenderjaar: number): number {
  const perioden = Math.floor(Math.max(0, kalenderjaar - jaarEersteToelating) / 5);
  return jaarEersteToelating + 5 * perioden;
}

export interface BijtellingUitkomst {
  perJaar: number;
  uitleg: string;
}

/** Bijtelling per jaar (binnen de eerste 60 maanden na eerste toelating). */
export function bijtellingPerJaar(b: BijtellingInvoer): BijtellingUitkomst {
  const std = regels.bijtelling.standaardPercentage.waarde;
  const start = periodeStartjaar(b.jaarEersteToelating, b.kalenderjaar ?? b.jaarEersteToelating);
  const korting = b.aandrijving === "brandstof" ? undefined : regels.bijtelling.emissievrij.waarde[start]?.[b.aandrijving];

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
 * Pseudo-eindheffing voor de werkgever (of de bv van de DGA) in een kalenderjaar: vanaf 2027
 * 12% van de catalogusprijs per jaar voor nieuw ter beschikking gestelde auto's
 * met CO₂-uitstoot die privé gebruikt mogen worden.
 */
export function pseudoEindheffing(cataloguswaarde: number, aandrijving: Aandrijving, jaarTerBeschikking: number, kalenderjaar = jaarTerBeschikking): number {
  const { percentage, vanafJaar } = regels.pseudoEindheffing.waarde;
  if (aandrijving !== "brandstof" || kalenderjaar < vanafJaar) return 0;
  // Overgangsregeling: al vóór 2027 ter beschikking → pas vanaf het overgangsjaar.
  if (jaarTerBeschikking < vanafJaar && kalenderjaar < regels.pseudoEindheffingOvergang.waarde.vanafJaar) return 0;
  return rond2(cataloguswaarde * percentage);
}
