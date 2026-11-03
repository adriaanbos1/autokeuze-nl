// MRB-voorbeelden. Bron van de verwachte bedragen: rekenvoorbeelden op
// wegenbelastingwijzer.nl en allesberekenen.nl (tarieven vanaf 1-7-2026).
// ⚠ Nog te bevestigen met de rekentool van de Belastingdienst.
import { describe, expect, it } from "vitest";
import { mrbPersonenauto, rondMassa } from "@/engine";

describe("massa afronden (art. 22 Wet MRB)", () => {
  it("naar het naaste honderdtal; precies 50 kg naar beneden", () => {
    expect(rondMassa(1250)).toBe(1200);
    expect(rondMassa(1251)).toBe(1300);
    expect(rondMassa(1249)).toBe(1200);
    expect(rondMassa(1300)).toBe(1300);
  });
});

describe("MRB personenauto per kwartaal (2026)", () => {
  it("benzine 1.000 kg, Noord-Holland: €92", () => {
    expect(mrbPersonenauto({ massaRijklaar: 1000, brandstof: "benzine", provincie: "noord-holland", jaar: 2026 }).perKwartaal).toBe(92);
  });

  it("benzine 1.000 kg, Zuid-Holland: €99", () => {
    expect(mrbPersonenauto({ massaRijklaar: 1000, brandstof: "benzine", provincie: "zuid-holland", jaar: 2026 }).perKwartaal).toBe(99);
  });

  it("benzine 2.000 kg, Noord-Holland: €360", () => {
    expect(mrbPersonenauto({ massaRijklaar: 2000, brandstof: "benzine", provincie: "noord-holland", jaar: 2026 }).perKwartaal).toBe(360);
  });

  it("benzine 1.400 kg, Zuid-Holland: €217 (rijksdeel 133,32 + opcenten 80,85 × 104,4%)", () => {
    const u = mrbPersonenauto({ massaRijklaar: 1400, brandstof: "benzine", provincie: "zuid-holland", jaar: 2026 });
    expect(u.posten.rijksdeel).toBe(133.32);
    expect(u.perKwartaal).toBe(217);
  });

  it("diesel 1.000 kg, Noord-Holland: €245", () => {
    expect(mrbPersonenauto({ massaRijklaar: 1000, brandstof: "diesel", provincie: "noord-holland", jaar: 2026 }).perKwartaal).toBe(245);
  });

  it("elektrisch 1.000 kg, Noord-Holland: €64 (70% van €92,25)", () => {
    expect(mrbPersonenauto({ massaRijklaar: 1000, brandstof: "elektrisch", provincie: "noord-holland", jaar: 2026 }).perKwartaal).toBe(64);
  });

  it("EV-korting loopt af: 2029 75%, 2030 geen korting", () => {
    const ev = (jaar: number) => mrbPersonenauto({ massaRijklaar: 1000, brandstof: "elektrisch", provincie: "noord-holland", jaar }).perKwartaal;
    expect(ev(2029)).toBe(69); // 92,25 × 0,75 = 69,19
    expect(ev(2030)).toBe(92);
  });

  it("diesel zonder roetfilter: +19% op rijksdeel en brandstoftoeslag", () => {
    const u = mrbPersonenauto({ massaRijklaar: 1000, brandstof: "diesel", provincie: "noord-holland", jaar: 2026, dieselZonderRoetfilter: true });
    expect(u.posten.fijnstoftoeslag).toBe(41.28); // (64,24 + 153,00) × 0,19 = 41,2756
    expect(u.perKwartaal).toBe(286);
  });

  it("lichte auto (≤ 600 kg) gebruikt de vaste laagste klasse", () => {
    const u = mrbPersonenauto({ massaRijklaar: 550, brandstof: "benzine", provincie: "utrecht", jaar: 2026 });
    expect(u.posten.rijksdeel).toBe(21.46);
  });
});
