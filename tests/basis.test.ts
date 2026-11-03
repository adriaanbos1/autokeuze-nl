import { describe, expect, it } from "vitest";
import { annuiteit, effectiefTariefOndernemer, financialLease, gemiddeldeLaadprijs, marginaalTarief2026 } from "@/engine";

describe("financiering", () => {
  it("annuïteit zonder rente = hoofdsom / maanden", () => {
    expect(annuiteit(12000, 0, 48)).toBe(250);
  });

  it("slottermijn verlaagt de maandtermijn maar verhoogt de totale rente", () => {
    const zonder = financialLease(30000, 0.069, 60, 0, 12000);
    const met = financialLease(30000, 0.069, 60, 12000, 12000);
    expect(met.maandtermijn).toBeLessThan(zonder.maandtermijn);
    expect(met.totaleRente).toBeGreaterThan(zonder.totaleRente);
    expect(met.totaalBetaald).toBe(Math.round((met.maandtermijn * 60 + 12000) * 100) / 100);
  });

  it("restschuldrisico als de verwachte restwaarde lager is dan de slottermijn", () => {
    expect(financialLease(30000, 0.069, 60, 12000, 10000).restschuldRisico).toBe(2000);
    expect(financialLease(30000, 0.069, 60, 12000, 14000).restschuldRisico).toBe(0);
  });
});

describe("belasting box 1 (2026)", () => {
  it("schijven: 35,75% / 37,56% / 49,50%", () => {
    expect(marginaalTarief2026(30000)).toBe(0.3575);
    expect(marginaalTarief2026(38883)).toBe(0.3575);
    expect(marginaalTarief2026(50000)).toBe(0.3756);
    expect(marginaalTarief2026(100000)).toBe(0.495);
  });

  it("effectief ondernemerstarief met MKB-winstvrijstelling en aftrekbeperking", () => {
    // 37,56% × (1 − 12,7%) = 32,79%
    expect(effectiefTariefOndernemer(0.3756)).toBeCloseTo(0.3279, 4);
    // 49,5% − 12,7% × 37,56% = 44,73%
    expect(effectiefTariefOndernemer(0.495)).toBeCloseTo(0.4473, 4);
  });
});

describe("energie", () => {
  it("laadmix moet optellen tot 100%", () => {
    expect(() => gemiddeldeLaadprijs({ thuis: 0.5, publiek: 0.2, snel: 0, prijsThuis: 0.27, prijsPubliek: 0.55, prijsSnel: 0.75 })).toThrow();
  });
});
