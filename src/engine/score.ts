// Scoringsmodel (docs/methodiek.md §1): vaste ankers, gewichten, herschaling
// bij ontbrekende data en een voorspelbare, merkneutrale volgorde.
import { CRITERIA, profielTweaks, standaardGewichten, type Criterium, type Profiel } from "@/regels/methodiek";

export type Gewichten = Record<Criterium, number>;

/** Score van één criterium; null = onvoldoende data of niet van toepassing. */
export interface CriteriumScore {
  score: number;
  /** Korte, leesbare waarde, bijv. "€ 412 per maand" of "5 sterren (2022)". */
  waarde: string;
  uitleg: string;
}

export type Scores = Record<Criterium, CriteriumScore | null>;

/** 100 × (waarde − slecht) / (goed − slecht), begrensd tot 0–100. Werkt ook als "goed" lager is dan "slecht". */
export function lineaireScore(waarde: number, slecht: number, goed: number): number {
  const s = (100 * (waarde - slecht)) / (goed - slecht);
  return Math.round(Math.min(100, Math.max(0, s)) * 10) / 10;
}

/** Startgewichten voor een profiel, met de automatische gezinsaanpassing. Nooit onder 0. */
export function startGewichten(profiel: Profiel, opties: { gezin: boolean }): Gewichten {
  const g = { ...standaardGewichten[profiel] };
  if (opties.gezin) for (const [c, d] of Object.entries(profielTweaks.gezin) as [Criterium, number][]) g[c] = Math.max(0, g[c] + d);
  return g;
}

export interface Eindscore {
  score: number;
  /** Aandeel van het totale gewicht waarvoor data was (0–1). */
  datadekking: number;
  /** Gewicht per criterium na herschaling (telt op tot 100), alleen criteria met data. */
  effectieveGewichten: Partial<Gewichten>;
}

/**
 * Eindscore = Σ (gewicht × score) / Σ gewichten, alleen over criteria met data.
 * Een criterium zonder data krijgt dus geen gok; de andere wegen naar verhouding zwaarder.
 */
export function eindscore(scores: Scores, gewichten: Gewichten): Eindscore {
  const totaal = CRITERIA.reduce((s, c) => s + gewichten[c], 0);
  const metData = CRITERIA.filter((c) => scores[c] !== null && gewichten[c] > 0);
  const som = metData.reduce((s, c) => s + gewichten[c], 0);
  if (som === 0) return { score: 0, datadekking: 0, effectieveGewichten: {} };
  const effectieveGewichten: Partial<Gewichten> = {};
  for (const c of metData) effectieveGewichten[c] = Math.round((1000 * gewichten[c]) / som) / 10;
  const score = metData.reduce((s, c) => s + gewichten[c] * scores[c]!.score, 0) / som;
  return { score: Math.round(score * 10) / 10, datadekking: totaal ? som / totaal : 0, effectieveGewichten };
}

export interface Kandidaat {
  naam: string;
  eindscore: number;
  tcoPerMaand: number;
}

/** Hoogste afgeronde eindscore eerst; gelijk → laagste TCO; daarna alfabetisch op naam. */
export function vergelijk(a: Kandidaat, b: Kandidaat): number {
  return (
    Math.round(b.eindscore) - Math.round(a.eindscore) ||
    a.tcoPerMaand - b.tcoPerMaand ||
    a.naam.localeCompare(b.naam, "nl")
  );
}

/** De 3 sterkste en 2 zwakste criteria die meetellen (gewicht > 0 en data aanwezig). */
export function sterkEnZwak(scores: Scores, gewichten: Gewichten): { sterk: Criterium[]; zwak: Criterium[] } {
  const mee = CRITERIA.filter((c) => scores[c] !== null && gewichten[c] > 0).sort(
    (a, b) => scores[b]!.score - scores[a]!.score || CRITERIA.indexOf(a) - CRITERIA.indexOf(b),
  );
  const sterk = mee.slice(0, 3);
  const zwak = mee.slice(3).slice(-2).reverse();
  return { sterk, zwak };
}

/**
 * Waar een auto het meest achterloopt op de nummer 1: het criterium met het
 * grootste gewogen verschil in het nadeel van deze auto.
 */
export function grootsteAchterstand(eigen: Scores, eerste: Scores, gewichten: Gewichten): { criterium: Criterium; punten: number } | null {
  let beste: { criterium: Criterium; punten: number } | null = null;
  const totaal = CRITERIA.reduce((s, c) => s + gewichten[c], 0) || 1;
  for (const c of CRITERIA) {
    const a = eigen[c];
    const b = eerste[c];
    if (!a || !b || gewichten[c] === 0) continue;
    const punten = ((b.score - a.score) * gewichten[c]) / totaal;
    if (punten > 0 && (!beste || punten > beste.punten)) beste = { criterium: c, punten: Math.round(punten * 10) / 10 };
  }
  return beste;
}
