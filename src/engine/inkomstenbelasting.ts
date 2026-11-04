// Inkomstenbelasting box 1 2026 met heffingskortingen, Vpb, box 2 en KIA.
// Alleen voor mensen onder de AOW-leeftijd, zonder fiscale partner; geen
// andere aftrekposten of kortingen dan hieronder genoemd.
import { regels } from "@/regels/regels-nl";
import { rond2 } from "./geld";

/** Belasting volgens een schijventabel [bovengrens t/m (null = geen), tarief]. */
export function schijvenBelasting(bedrag: number, schijven: [number | null, number][]): number {
  let rest = Math.max(0, bedrag);
  let vorige = 0;
  let totaal = 0;
  for (const [tm, tarief] of schijven) {
    const breedte = tm === null ? rest : Math.min(rest, tm - vorige);
    totaal += breedte * tarief;
    rest -= breedte;
    if (tm !== null) vorige = tm;
    if (rest <= 0) break;
  }
  return rond2(totaal);
}

export function algemeneHeffingskorting2026(verzamelinkomen: number): number {
  const a = regels.box1.algemeneHeffingskorting2026.waarde;
  if (verzamelinkomen <= a.afbouwVanaf) return a.maximaal;
  if (verzamelinkomen >= a.nulVanaf) return 0;
  return rond2(Math.max(0, a.maximaal - a.afbouwPercentage * (verzamelinkomen - a.afbouwVanaf)));
}

export function arbeidskorting2026(arbeidsinkomen: number): number {
  const tabel = regels.box1.arbeidskorting2026.waarde;
  const [vanaf, basis, pct] = [...tabel].reverse().find(([v]) => arbeidsinkomen >= v)!;
  return rond2(Math.max(0, basis + pct * (arbeidsinkomen - vanaf)));
}

export interface Box1Uitkomst {
  tarief: number;
  algemeneHeffingskorting: number;
  arbeidskorting: number;
  /** Te betalen, niet onder 0. */
  totaal: number;
}

/** Box 1 2026: schijventarief min algemene heffingskorting en arbeidskorting (niet onder nul). */
export function box1Belasting2026(p: { belastbaarInkomen: number; arbeidsinkomen: number }): Box1Uitkomst {
  const tarief = schijvenBelasting(p.belastbaarInkomen, regels.box1.schijven2026.waarde);
  const ahk = algemeneHeffingskorting2026(p.belastbaarInkomen);
  const ak = arbeidskorting2026(p.arbeidsinkomen);
  return { tarief, algemeneHeffingskorting: ahk, arbeidskorting: ak, totaal: rond2(Math.max(0, tarief - ahk - ak)) };
}

/** Werknemer: belasting over loon (incl. bijtelling); loon telt ook als arbeidsinkomen. */
export const belastingWerknemer2026 = (loon: number) => box1Belasting2026({ belastbaarInkomen: loon, arbeidsinkomen: loon }).totaal;

/**
 * IB-ondernemer: winst − zelfstandigenaftrek (bij urencriterium), daarna 12,7% MKB-winstvrijstelling.
 * Arbeidsinkomen voor de arbeidskorting = de winst (vóór aftrekken).
 */
export function belastingOndernemer2026(winst: number, urencriterium = true): number {
  const za = urencriterium ? Math.min(Math.max(0, winst), regels.box1.zelfstandigenaftrek2026.waarde) : 0;
  const belastbaar = (winst - za) * (1 - regels.box1.mkbWinstvrijstelling.waarde);
  return box1Belasting2026({ belastbaarInkomen: belastbaar, arbeidsinkomen: Math.max(0, winst) }).totaal;
}

/**
 * Effectief tarief over een extra post (bijv. bijtelling of aftrekbare kosten): het verschil in belasting
 * gedeeld door de post. Bevat zo ook de afbouw van de heffingskortingen.
 */
export function effectiefTarief(belasting: (inkomen: number) => number, inkomen: number, post: number): number {
  if (post === 0) return 0;
  return (belasting(inkomen + post) - belasting(inkomen)) / post;
}

export const vpb2026 = (winst: number) => schijvenBelasting(winst, regels.vpb.tarieven2026.waarde);
export const box2Belasting2026 = (uitkering: number) => schijvenBelasting(uitkering, regels.box2.tarieven2026.waarde);

/** Kleinschaligheidsinvesteringsaftrek 2026 over het totaal van de investeringen in een jaar. */
export function kia2026(investering: number): number {
  const tabel = regels.kia.tabel2026.waarde;
  const [, vast, pct, boven] = [...tabel].reverse().find(([meerDan]) => investering > meerDan) ?? tabel[0];
  return rond2(Math.max(0, vast + pct * (investering - boven)));
}
