// Scoringsmodel (docs/methodiek.md §1). Alle verwachte waarden zijn met de hand na te rekenen.
import { describe, expect, it } from "vitest";
import { eindscore, grootsteAchterstand, lineaireScore, startGewichten, sterkEnZwak, vergelijk, type Gewichten, type Scores } from "@/engine";

const s = (score: number) => ({ score, waarde: "", uitleg: "" });
const leeg: Scores = { TCO: null, BETR: null, ONDH: null, REST: null, FIT: null, DUUR: null, VEIL: null, COMF: null };
const gelijk: Gewichten = { TCO: 10, BETR: 10, ONDH: 10, REST: 10, FIT: 10, DUUR: 10, VEIL: 10, COMF: 10 };

describe("lineaireScore", () => {
  it("TCO €600 bij budget €500: slecht 1000, goed 250 → 100 × (600 − 1000) / (250 − 1000) = 53,3", () => {
    expect(lineaireScore(600, 1000, 250)).toBe(53.3);
  });
  it("begrenst op 0 en 100", () => {
    expect(lineaireScore(1200, 1000, 250)).toBe(0);
    expect(lineaireScore(100, 1000, 250)).toBe(100);
  });
  it("oplopende schaal: lengte 435 cm tussen 400 en 470 → 50", () => {
    expect(lineaireScore(435, 400, 470)).toBe(50);
  });
});

describe("startGewichten", () => {
  it("particulier zonder gezin = tabel §1.3", () => {
    expect(startGewichten("particulier", { gezin: false })).toEqual({ TCO: 30, BETR: 15, ONDH: 10, REST: 10, FIT: 15, DUUR: 5, VEIL: 10, COMF: 5 });
  });
  it("gezin: VEIL +5, FIT +5, COMF −5, DUUR −5 (nooit onder 0)", () => {
    const g = startGewichten("particulier", { gezin: true });
    expect([g.VEIL, g.FIT, g.COMF, g.DUUR]).toEqual([15, 20, 0, 0]);
  });
  it("occasion: BETR +5 en ONDH +5", () => {
    const g = startGewichten("particulier", { gezin: false, occasion: true });
    expect([g.BETR, g.ONDH, g.TCO]).toEqual([20, 15, 30]);
  });
});

describe("eindscore", () => {
  it("telt alleen criteria met data en herschaalt de gewichten", () => {
    // TCO 80 (gewicht 30) en VEIL 50 (gewicht 10); de rest heeft geen data.
    const e = eindscore({ ...leeg, TCO: s(80), VEIL: s(50) }, { ...gelijk, TCO: 30, VEIL: 10 });
    expect(e.score).toBe(72.5); // (30 × 80 + 10 × 50) / 40
    expect(e.effectieveGewichten).toEqual({ TCO: 75, VEIL: 25 });
    expect(e.datadekking).toBeCloseTo(40 / 100); // 30 + 10 van 30 + 6 × 10
  });
  it("gewicht 0 telt niet mee, ook niet als er data is", () => {
    expect(eindscore({ ...leeg, TCO: s(80), VEIL: s(0) }, { ...gelijk, VEIL: 0 }).score).toBe(80);
  });
  it("geen enkele score → 0 met dekking 0", () => {
    expect(eindscore(leeg, gelijk)).toEqual({ score: 0, datadekking: 0, effectieveGewichten: {} });
  });
});

describe("volgorde (merkneutrale tie-break)", () => {
  it("hogere afgeronde score eerst", () => {
    expect(vergelijk({ naam: "B", eindscore: 71.6, tcoPerMaand: 900 }, { naam: "A", eindscore: 70.4, tcoPerMaand: 500 })).toBeLessThan(0);
  });
  it("zelfde afgeronde score (70,6 en 71,4 → 71): laagste TCO eerst", () => {
    expect(vergelijk({ naam: "B", eindscore: 70.6, tcoPerMaand: 500 }, { naam: "A", eindscore: 71.4, tcoPerMaand: 600 })).toBeLessThan(0);
  });
  it("ook TCO gelijk: alfabetisch", () => {
    expect(vergelijk({ naam: "A", eindscore: 70, tcoPerMaand: 500 }, { naam: "B", eindscore: 70, tcoPerMaand: 500 })).toBeLessThan(0);
  });
});

describe("toelichting", () => {
  const sc: Scores = { ...leeg, TCO: s(90), BETR: s(40), ONDH: s(70), FIT: s(60), VEIL: s(100), DUUR: s(20) };
  it("3 sterkste en 2 zwakste punten (zwakste eerst)", () => {
    expect(sterkEnZwak(sc, gelijk)).toEqual({ sterk: ["VEIL", "TCO", "ONDH"], zwak: ["DUUR", "BETR"] });
  });
  it("grootste gewogen achterstand op nummer 1", () => {
    const eerste: Scores = { ...sc, BETR: s(90), DUUR: s(30) };
    // BETR: (90 − 40) × 10 / 80 = 6,25 → 6,3; DUUR: (30 − 20) × 10 / 80 = 1,25
    expect(grootsteAchterstand(sc, eerste, gelijk)).toEqual({ criterium: "BETR", punten: 6.3 });
  });
});
