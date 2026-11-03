// Betrouwbaarheidsscore — voorbeelden zijn met de hand na te rekenen.
import { describe, expect, it } from "vitest";
import { betrouwbaarheid, scoreUitVerhouding, type Tellingen } from "@/engine/betrouwbaarheid";

// Landelijk: bouwjaar 2018 op leeftijd 6 → 40% met gebrek; leeftijd 7 → 50%.
const landelijk: Tellingen = {
  2018: { 6: { keuringen: 1000, metGebrek: 400 }, 7: { keuringen: 1000, metGebrek: 500 } },
};

describe("score uit verhouding (logaritmisch)", () => {
  it("0,5× = 100, 1× = 50, 2× = 0", () => {
    expect(scoreUitVerhouding(0.5)).toBe(100);
    expect(scoreUitVerhouding(1)).toBe(50);
    expect(scoreUitVerhouding(2)).toBe(0);
  });
  it("√2× ≈ 25 en 1/√2× ≈ 75", () => {
    expect(scoreUitVerhouding(Math.SQRT2)).toBe(25);
    expect(scoreUitVerhouding(Math.SQRT1_2)).toBe(75);
  });
  it("begrensd tot 0–100", () => {
    expect(scoreUitVerhouding(0.1)).toBe(100);
    expect(scoreUitVerhouding(10)).toBe(0);
  });
});

describe("betrouwbaarheid met leeftijdscorrectie", () => {
  it("model met precies het gemiddelde → verhouding 1, score 50", () => {
    const m: Tellingen = { 2018: { 6: { keuringen: 200, metGebrek: 80 }, 7: { keuringen: 100, metGebrek: 50 } } };
    expect(betrouwbaarheid(m, landelijk)).toMatchObject({ verhouding: 1, score: 50, keuringen: 300, werkelijk: 130, verwacht: 130 });
  });

  it("half zo vaak een gebrek → score 100", () => {
    // verwacht = 200 × 0,4 + 100 × 0,5 = 130; werkelijk 65
    const m: Tellingen = { 2018: { 6: { keuringen: 200, metGebrek: 40 }, 7: { keuringen: 100, metGebrek: 25 } } };
    expect(betrouwbaarheid(m, landelijk)).toMatchObject({ verhouding: 0.5, score: 100 });
  });

  it("een ouder model wordt niet gestraft omdat het ouder is: vergelijking per leeftijd", () => {
    // Alleen keuringen op leeftijd 7 (landelijk 50%), model ook 50% → gemiddeld
    const m: Tellingen = { 2018: { 7: { keuringen: 300, metGebrek: 150 } } };
    expect(betrouwbaarheid(m, landelijk)?.score).toBe(50);
  });

  it("cellen met < 30 keuringen tellen niet mee", () => {
    const m: Tellingen = { 2018: { 6: { keuringen: 250, metGebrek: 100 }, 7: { keuringen: 20, metGebrek: 20 } } };
    expect(betrouwbaarheid(m, landelijk)).toMatchObject({ keuringen: 250, verhouding: 1 });
  });

  it("minder dan 200 keuringen in totaal → geen score", () => {
    const m: Tellingen = { 2018: { 6: { keuringen: 150, metGebrek: 60 } } };
    expect(betrouwbaarheid(m, landelijk)).toBeNull();
  });

  it("filter op bouwjaren (voor een occasion van een bepaald jaar)", () => {
    const m: Tellingen = {
      2018: { 6: { keuringen: 250, metGebrek: 100 } },
      2017: { 7: { keuringen: 250, metGebrek: 250 } },
    };
    expect(betrouwbaarheid(m, landelijk, [2018])?.verhouding).toBe(1);
  });

  it("zekerheid volgt het aantal waargenomen gebreken", () => {
    const m: Tellingen = { 2018: { 6: { keuringen: 250, metGebrek: 30 } } };
    expect(betrouwbaarheid(m, landelijk)?.zekerheid).toBe("laag");
  });
});
