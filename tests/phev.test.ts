// Plug-in hybride: verbruik met lege accu afgeleid uit het gewogen WLTP-verbruik.
// Narekenbare voorbeelden; de RDW-gevallen hebben een officiële waarde ter controle.
import { describe, expect, it } from "vitest";
import { energiekostenPhevPerJaar, normaalafstand, utilityFactor, verbruikLegeAccu } from "@/engine";

describe("utility factor (Verordening 2023/443)", () => {
  it("kiest de normaalafstand op de emissiecode", () => {
    expect(normaalafstand("EURO 6 EA")).toBe(800);
    expect(normaalafstand("EURO 6 EB")).toBe(2200);
    expect(normaalafstand("EURO 6 EC")).toBe(4260);
    expect(normaalafstand("EURO 6 AP")).toBe(800);
    expect(normaalafstand(null)).toBe(800);
  });

  it("UF bij 50 km en 800 km normaalafstand ≈ 0,7546 (met de hand: 1 − e^−1,4048)", () => {
    expect(utilityFactor(50, 800)).toBeCloseTo(0.7546, 3);
  });

  it("strengere normaalafstand geeft een lagere UF bij dezelfde actieradius", () => {
    expect(utilityFactor(80, 2200)).toBeLessThan(utilityFactor(80, 800));
    expect(utilityFactor(80, 4260)).toBeLessThan(utilityFactor(80, 2200));
  });
});

describe("verbruik met lege accu", () => {
  // Echte RDW-kentekens waarbij RDW de officiële waarde wél publiceert.
  it.each([
    ["EURO 6 EA", 2.9, 47, 11.0, 11.0],
    ["EURO 6 AP", 1.4, 56, 6.5, 6.5],
    ["EURO 6 EB", 1.7, 145, 7.4, 7.0],
  ])("%s, gewogen %s l, %s km → %s l (officieel %s)", (niveau, gewogen, aer, verwacht, officieel) => {
    const s = verbruikLegeAccu(gewogen, aer, niveau)!;
    expect(s.lPer100).toBe(verwacht);
    expect(Math.abs(s.lPer100 / officieel - 1)).toBeLessThan(0.08);
  });

  it("geen schatting zonder actieradius of gewogen verbruik", () => {
    expect(verbruikLegeAccu(0, 60)).toBeNull();
    expect(verbruikLegeAccu(1.2, 0)).toBeNull();
  });
});

describe("energiekosten plug-in hybride", () => {
  it("15.000 km, 60% elektrisch: stroom €486 + brandstof €600", () => {
    expect(
      energiekostenPhevPerJaar({ kmPerJaar: 15000, aandeelElektrisch: 0.6, kwhPer100: 18, prijsPerKwh: 0.3, lPer100LegeAccu: 5, prijsPerLiter: 2 }),
    ).toEqual({ stroom: 486, brandstof: 600, totaal: 1086 });
  });

  it("weigert een aandeel buiten 0–1", () => {
    expect(() => energiekostenPhevPerJaar({ kmPerJaar: 1, aandeelElektrisch: 1.2, kwhPer100: 1, prijsPerKwh: 1, lPer100LegeAccu: 1, prijsPerLiter: 1 })).toThrow();
  });
});
