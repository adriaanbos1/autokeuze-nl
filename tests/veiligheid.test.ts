import { describe, expect, it } from "vitest";
import { geldendeUitslag, gecorrigeerdeSterren, veiligheidsScore } from "@/engine";

const u = (sterren: number, testjaar: number, verlopen = false, veiligheidspakket = false) => ({ sterren, testjaar, verlopen, veiligheidspakket });

describe("veiligheidsscore uit Euro NCAP", () => {
  it("5 sterren, test vorig jaar → 100", () => expect(veiligheidsScore(u(5, 2025), 2026)).toBe(100));
  it("5 sterren uit 2022 → 4,5 na correctie → 83", () => {
    expect(gecorrigeerdeSterren(u(5, 2022), 2026)).toBe(4.5);
    expect(veiligheidsScore(u(5, 2022), 2026)).toBe(83);
  });
  it("verlopen uitslag telt hoogstens 50", () => expect(veiligheidsScore(u(5, 2019, true), 2026)).toBe(50));
  it("3 sterren uit 2024 → 33", () => expect(veiligheidsScore(u(3, 2024), 2026)).toBe(33));
  it("2 sterren of minder → 0", () => expect(veiligheidsScore(u(2, 2025), 2026)).toBe(0));

  it("geldende uitslag: nieuwste test, bij gelijk jaar de standaarduitvoering", () => {
    expect(geldendeUitslag([u(5, 2022, false, true), u(4, 2022)])).toEqual(u(4, 2022));
    expect(geldendeUitslag([u(5, 2019, true), u(4, 2025)])).toEqual(u(4, 2025));
    expect(geldendeUitslag([])).toBeNull();
  });
});
