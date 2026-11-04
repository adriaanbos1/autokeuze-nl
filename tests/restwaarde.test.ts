// Restwaarde: forfaitaire BPM-tabel (Belastingdienst) + km-correctie (aanname 1,5% per 10.000 km).
import { describe, expect, it } from "vitest";
import { afschrijvingOverLooptijd, afschrijvingsPercentage, begonnenMaanden, geschatteWaarde } from "@/engine";

describe("forfaitaire afschrijvingstabel", () => {
  it("rekenvoorbeeld Belastingdienst: 25-4-2025 → 8-7-2026 = 15 begonnen maanden = 39%", () => {
    expect(begonnenMaanden("2025-04-25", "2026-07-08")).toBe(15);
    expect(afschrijvingsPercentage(15)).toBe(39);
  });
  it("31 januari → 28 februari telt als 1 maand", () => {
    expect(begonnenMaanden("2026-01-31", "2026-02-28")).toBe(1);
  });
  it("tabelgrenzen", () => {
    expect(afschrijvingsPercentage(0)).toBe(0);
    expect(afschrijvingsPercentage(1)).toBe(12);
    expect(afschrijvingsPercentage(36)).toBe(54); // 51 + 6 × 0,5
    expect(afschrijvingsPercentage(60)).toBe(64.52); // 62 + 6 × 0,42
  });
  it("vanaf 17 jaar en 10 maanden (214 maanden) 100%", () => {
    expect(afschrijvingsPercentage(214)).toBe(100);
    expect(afschrijvingsPercentage(213)).toBeLessThan(100);
  });
});

describe("geschatte waarde", () => {
  it("€40.000, 36 maanden, normaal 45.000 km → 46% van nieuw = €18.400", () => {
    expect(geschatteWaarde({ nieuwprijs: 40000, leeftijdMaanden: 36, km: 45000 }).waarde).toBe(18400);
  });
  it("20.000 km meer dan normaal → 3% lager: €17.200", () => {
    expect(geschatteWaarde({ nieuwprijs: 40000, leeftijdMaanden: 36, km: 65000 }).waarde).toBe(17200);
  });
});

describe("afschrijving over de looptijd", () => {
  it("nieuw €40.000, 60 maanden, 15.000 km/jr → eindwaarde €14.192, €430,13 per maand", () => {
    const a = afschrijvingOverLooptijd({ nieuwprijs: 40000, leeftijdNuMaanden: 0, kmNu: 0, looptijdMaanden: 60, kmPerJaar: 15000 });
    expect(a.waardeEinde).toBe(14192); // 40.000 × (1 − 64,52%)
    expect(a.perMaand.bedrag).toBe(430.13); // (40.000 − 14.192) / 60 = 25.808 / 60
  });
  it("occasion van 3 jaar met 45.000 km, 24 maanden houden → van €18.400 naar €14.192", () => {
    const a = afschrijvingOverLooptijd({ nieuwprijs: 40000, leeftijdNuMaanden: 36, kmNu: 45000, looptijdMaanden: 24, kmPerJaar: 15000 });
    expect(a.waardeNu).toBe(18400);
    expect(a.waardeEinde).toBe(14192);
  });
});
