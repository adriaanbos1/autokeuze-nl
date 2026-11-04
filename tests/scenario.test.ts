// Financieringsvormen naast elkaar (docs/methodiek.md §3.2–3.3), met een fictieve, merkloze auto.
import { describe, expect, it } from "vitest";
import { financieringsScenarios, privateLeaseSchatting, type AutoBezit, type ScenarioInvoer } from "@/engine";

// €30.000, na 60 maanden €12.000 waard; lopende kosten €340 per maand.
const bezit: AutoBezit = {
  aankoopprijs: 30000,
  restwaardeEinde: 12000,
  maanden: 60,
  kmPerJaar: 15000,
  rendement: 0.025,
  lopend: { energie: 150, mrb: 50, verzekering: 100, onderhoudEnBanden: 40 },
};
const invoer: ScenarioInvoer = {
  bezit,
  lening: { eigenGeld: 0, jaarrente: 0.075 },
  financialLease: { aanbetaling: 0, jaarrente: 0.075, slottermijn: 9600 },
  privateLease: { offerte: null, kapitaalrente: 0.05, opslag: 0.1, eigenRisico: 500, schadesPerJaar: 0.12 },
};
const s = Object.fromEntries(financieringsScenarios(invoer).map((x) => [x.vorm, x]));

describe("contant", () => {
  it("afschrijving 300 + gemist rendement 21.000 × 2,5% / 12 = 43,75 + lopend 340 = 683,75", () => {
    expect(s.contant.tco.perMaand).toBe(683.75);
    expect(s.contant.nuBetalen).toBe(30000);
    expect(s.contant.perMaandBetalen).toBe(340);
    expect(s.contant.bezitEinde).toBe(12000);
  });
});

describe("persoonlijke lening", () => {
  it("€30.000 in 60 maanden tegen 7,5%: termijn €601,14", () => {
    expect(s.lening.maandtermijn).toBe(601.14);
  });
  it("totale rente 601,14 × 60 − 30.000 = 6.068,40; TCO 300 + 101,14 + 340 = 741,14", () => {
    expect(s.lening.totaleRente).toBe(6068.4);
    expect(s.lening.tco.perMaand).toBe(741.14);
    expect(s.lening.perMaandBetalen).toBe(941.14);
  });
  it("alles eigen geld → geen leningscenario", () => {
    const v = financieringsScenarios({ ...invoer, lening: { eigenGeld: 30000, jaarrente: 0.075 } }).map((x) => x.vorm);
    expect(v).not.toContain("lening");
  });
});

describe("financial lease met slottermijn", () => {
  it("slottermijn €9.600: termijn (30.000 − 9.600 / 1,00625^60) × 0,00625 / (1 − 1,00625^−60) = €468,77", () => {
    expect(s.financialLease.maandtermijn).toBe(468.77);
    expect(s.financialLease.eindeBetalen).toBe(9600);
    expect(s.financialLease.restschuldRisico).toBe(0);
  });
  it("slottermijn boven de verwachte waarde → restschuldrisico", () => {
    const f = financieringsScenarios({ ...invoer, financialLease: { aanbetaling: 0, jaarrente: 0.075, slottermijn: 15000 } }).find((x) => x.vorm === "financialLease")!;
    expect(f.restschuldRisico).toBe(3000);
  });
});

describe("private lease", () => {
  it("schatting: 300 + 21.000 × 5% / 12 (87,50) + 50 + 100 + 40 = 577,50 + 10% opslag 57,75 = 635,25", () => {
    const p = privateLeaseSchatting({ ...bezit, kapitaalrente: 0.05, opslag: 0.1 });
    expect(p.leaseprijs).toBe(635.25);
    expect(s.privateLease.leaseprijsGeschat).toBe(true);
  });
  it("TCO = leaseprijs + energie 150 + verwacht eigen risico 0,12 × 500 / 12 = 5 → 790,25", () => {
    expect(s.privateLease.tco.perMaand).toBe(790.25);
    expect(s.privateLease.bezitEinde).toBe(0);
  });
  it("met offerte €499 wordt die gebruikt", () => {
    const p = financieringsScenarios({ ...invoer, privateLease: { ...invoer.privateLease, offerte: 499 } }).find((x) => x.vorm === "privateLease")!;
    expect(p.leaseprijs).toBe(499);
    expect(p.leaseprijsGeschat).toBe(false);
    expect(p.tco.perMaand).toBe(654);
  });
});
