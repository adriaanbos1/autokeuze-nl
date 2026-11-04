// Veiligheidsscore uit Euro NCAP-sterren (docs/methodiek.md §1.2, §2.5).

export interface NcapUitslag {
  sterren: number;
  testjaar: number;
  /** Door Euro NCAP zelf als verlopen gemarkeerd (na 6 jaar). */
  verlopen: boolean;
  /** Uitslag geldt alleen met een optioneel veiligheidspakket. */
  veiligheidspakket: boolean;
}

/** Sterren na correctie voor de leeftijd van de test: −0,5 ster per volle 3 jaar. */
export function gecorrigeerdeSterren(u: NcapUitslag, peiljaar: number): number {
  return Math.max(0, u.sterren - 0.5 * Math.floor(Math.max(0, peiljaar - u.testjaar) / 3));
}

/** 2 sterren = 0, 5 sterren = 100 (lineair, begrensd); verlopen uitslag maximaal 50. */
export function veiligheidsScore(u: NcapUitslag, peiljaar: number): number {
  const s = Math.round(Math.min(100, Math.max(0, (100 * (gecorrigeerdeSterren(u, peiljaar) - 2)) / 3)));
  return u.verlopen ? Math.min(s, 50) : s;
}

/**
 * De uitslag die voor het model telt: de nieuwste test; bij twee uitslagen in
 * hetzelfde jaar de standaarduitvoering (zonder optioneel veiligheidspakket).
 */
export function geldendeUitslag<T extends NcapUitslag>(uitslagen: T[]): T | null {
  const s = [...uitslagen].sort((a, b) => b.testjaar - a.testjaar || Number(a.veiligheidspakket) - Number(b.veiligheidspakket));
  return s[0] ?? null;
}
