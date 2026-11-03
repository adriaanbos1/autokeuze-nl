// Persona 1 uit docs/methodiek.md §4.1 — elk getal is daar met de hand na te rekenen.
import { describe, expect, it } from "vitest";
import { energiekostenPerJaar, gemiddeldeLaadprijs, rond2, tcoContant, tcoLening, tcoPrivateLease, type AutoBezit } from "@/engine";

const KM = 15000;
const BENZINE = 2.3;
const mix = gemiddeldeLaadprijs({ thuis: 0.8, publiek: 0.2, snel: 0, prijsThuis: 0.27, prijsPubliek: 0.55, prijsSnel: 0 });
const perMaand = (jaar: number) => rond2(jaar / 12);

const autoA: AutoBezit = {
  aankoopprijs: 35000,
  restwaardeEinde: 15750,
  maanden: 60,
  kmPerJaar: KM,
  rendement: 0.025,
  lopend: { energie: perMaand(energiekostenPerJaar(KM, 16, mix)), mrb: 40, verzekering: 75, onderhoudEnBanden: 45 },
};
const autoB: AutoBezit = {
  aankoopprijs: 32000,
  restwaardeEinde: 16000,
  maanden: 60,
  kmPerJaar: KM,
  rendement: 0.025,
  lopend: { energie: perMaand(energiekostenPerJaar(KM, 4.5, BENZINE)), mrb: 45, verzekering: 70, onderhoudEnBanden: 55 },
};
const autoC: AutoBezit = {
  aankoopprijs: 18000,
  restwaardeEinde: 8100,
  maanden: 60,
  kmPerJaar: KM,
  rendement: 0.025,
  lopend: { energie: perMaand(energiekostenPerJaar(KM, 6, BENZINE)), mrb: 40, verzekering: 55, onderhoudEnBanden: 85 },
};

const post = (posten: { label: string; bedrag: number }[], label: string) => posten.find((p) => p.label.startsWith(label))!.bedrag;

describe("Persona 1: particulier gezin, contant", () => {
  it("laadmix thuis 80% / publiek 20% = €0,326 per kWh", () => {
    expect(mix).toBeCloseTo(0.326, 10);
  });

  it("energie per maand: A €65,20 · B €129,38 · C €172,50", () => {
    expect(autoA.lopend.energie).toBe(65.2);
    expect(autoB.lopend.energie).toBe(129.38);
    expect(autoC.lopend.energie).toBe(172.5);
  });

  it("Auto A (EV): €598,89 per maand, €0,479 per km", () => {
    const t = tcoContant(autoA);
    expect(post(t.posten, "Afschrijving")).toBe(320.83);
    expect(post(t.posten, "Kosten van geld")).toBe(52.86);
    expect(t.perMaand).toBe(598.89);
    expect(t.perKm).toBe(0.479);
  });

  it("Auto B (hybride): €616,05 per maand, €0,493 per km", () => {
    const t = tcoContant(autoB);
    expect(post(t.posten, "Afschrijving")).toBe(266.67);
    expect(post(t.posten, "Kosten van geld")).toBe(50);
    expect(t.perMaand).toBe(616.05);
    expect(t.perKm).toBe(0.493);
  });

  it("Auto C (occasion): €544,69 per maand, €0,436 per km", () => {
    const t = tcoContant(autoC);
    expect(post(t.posten, "Afschrijving")).toBe(165);
    expect(post(t.posten, "Kosten van geld")).toBe(27.19);
    expect(t.perMaand).toBe(544.69);
    expect(t.perKm).toBe(0.436);
  });
});

describe("Persona 1: financieringsvarianten Auto A", () => {
  it("persoonlijke lening €25.000, 7,5%, 60 mnd: termijn €500,95 en TCO €651,14", () => {
    const t = tcoLening(autoA, { hoofdsom: 25000, jaarrente: 0.075, maanden: 60 });
    expect(t.maandtermijn).toBe(500.95);
    expect(post(t.posten, "Kosten van geld")).toBe(105.11);
    expect(t.perMaand).toBe(651.14);
  });

  it("private lease €489: TCO €559,20 (incl. energie en verwacht eigen risico €5)", () => {
    const t = tcoPrivateLease({ leaseprijs: 489, kmPerJaar: KM, energie: autoA.lopend.energie, eigenRisico: 500, schadesPerJaar: 0.12 });
    expect(post(t.posten, "Verwacht eigen risico")).toBe(5);
    expect(t.perMaand).toBe(559.2);
  });

  it("in dit scenario is private lease €39,69/mnd goedkoper dan contant", () => {
    const verschil = rond2(tcoContant(autoA).perMaand - tcoPrivateLease({ leaseprijs: 489, kmPerJaar: KM, energie: 65.2, eigenRisico: 500, schadesPerJaar: 0.12 }).perMaand);
    expect(verschil).toBe(39.69);
  });
});
