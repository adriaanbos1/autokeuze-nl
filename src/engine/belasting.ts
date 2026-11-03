import { regels } from "@/regels/regels-nl";

/** Marginaal box 1-tarief 2026 bij een belastbaar inkomen (zonder heffingskortingen). */
export function marginaalTarief2026(belastbaarInkomen: number): number {
  for (const [tm, tarief] of regels.box1.schijven2026.waarde) {
    if (tm === null || belastbaarInkomen <= tm) return tarief;
  }
  throw new Error("onbereikbaar");
}

/**
 * Effectief tarief voor een IB-ondernemer over één euro extra winst (of kosten).
 * De MKB-winstvrijstelling stelt 12,7% vrij, maar die vrijstelling werkt
 * maximaal tegen 37,56% (aftrekbeperking). Netto: t − mkb × min(t, 37,56%).
 * Afbouw van heffingskortingen zit hier niet in.
 */
export function effectiefTariefOndernemer(marginaal: number): number {
  const mkb = regels.box1.mkbWinstvrijstelling.waarde;
  const max = regels.box1.maxAftrektarief.waarde;
  return marginaal - mkb * Math.min(marginaal, max);
}
