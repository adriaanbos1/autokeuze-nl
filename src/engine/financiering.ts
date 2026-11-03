import { rond2 } from "./geld";

/**
 * Maandtermijn van een annuïteit, optioneel met slottermijn.
 * Met slottermijn S: termijn = (P − S/(1+r)^n) × r / (1 − (1+r)^−n).
 */
export function annuiteit(hoofdsom: number, jaarrente: number, maanden: number, slottermijn = 0): number {
  if (maanden <= 0) throw new Error("Looptijd moet minimaal 1 maand zijn");
  const r = jaarrente / 12;
  if (r === 0) return rond2((hoofdsom - slottermijn) / maanden);
  const disc = Math.pow(1 + r, -maanden);
  return rond2(((hoofdsom - slottermijn * disc) * r) / (1 - disc));
}

export interface LeningUitkomst {
  maandtermijn: number;
  totaalBetaald: number;
  totaleRente: number;
  rentePerMaand: number;
}

/** Persoonlijke lening (annuïtair, zonder slottermijn). */
export function persoonlijkeLening(hoofdsom: number, jaarrente: number, maanden: number): LeningUitkomst {
  const maandtermijn = annuiteit(hoofdsom, jaarrente, maanden);
  const totaalBetaald = rond2(maandtermijn * maanden);
  const totaleRente = rond2(totaalBetaald - hoofdsom);
  return { maandtermijn, totaalBetaald, totaleRente, rentePerMaand: rond2(totaleRente / maanden) };
}

export interface FinancialLeaseUitkomst extends LeningUitkomst {
  slottermijn: number;
  /** Positief = verwachte restwaarde is lager dan de slottermijn: risico op een restschuld. */
  restschuldRisico: number;
}

/**
 * Financial lease / huurkoop met slottermijn. De slottermijn betaal je aan het eind
 * (of je herfinanciert of verkoopt de auto); hij telt mee in het totaal betaalde bedrag.
 */
export function financialLease(
  hoofdsom: number,
  jaarrente: number,
  maanden: number,
  slottermijn: number,
  verwachteRestwaarde: number,
): FinancialLeaseUitkomst {
  const maandtermijn = annuiteit(hoofdsom, jaarrente, maanden, slottermijn);
  const totaalBetaald = rond2(maandtermijn * maanden + slottermijn);
  const totaleRente = rond2(totaalBetaald - hoofdsom);
  return {
    maandtermijn,
    totaalBetaald,
    totaleRente,
    rentePerMaand: rond2(totaleRente / maanden),
    slottermijn,
    restschuldRisico: rond2(Math.max(0, slottermijn - verwachteRestwaarde)),
  };
}
