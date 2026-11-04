// Ranglijst op de echte dataset: harde eisen, kosten en merkneutraliteit.
import { describe, expect, it } from "vitest";
import { alleModellen, kostenNieuw, rangschik, type Intake } from "@/data/ranking";
import { startGewichten } from "@/engine";
import type { ModelRdw, UitvoeringRdw } from "@/data/types";

const basis: Intake = {
  profiel: "particulier",
  kmPerJaar: 15000,
  langsteRitKm: 150,
  maandbudget: 750,
  maxAankoopprijs: null,
  personen: 4,
  kinderen: true,
  thuisladen: true,
  trekgewicht: 0,
  provincie: "utrecht",
  looptijdMaanden: 60,
  aandrijvingen: ["benzine", "hybride", "plug-in hybride", "elektrisch", "diesel", "lpg"],
  dekking: "allrisk",
  eigenPremiePerMaand: null,
  startjaar: 2026,
};
const g = startGewichten("particulier", { gezin: true });

describe("merkneutraliteit van de ranglijst", () => {
  it("merk- en modelnamen vervangen door nummers verandert geen enkele score", () => {
    const blind: ModelRdw[] = alleModellen.map((m, n) => ({ ...m, merk: `MERK ${n}`, model: `MODEL ${n}` }));
    const echt = rangschik(basis, g).lijst.map((r) => [r.id, r.uitvoering.aandrijving, r.eind.score, r.kosten.tco.perMaand]);
    const zonderNaam = rangschik(basis, g, blind).lijst.map((r) => [r.id, r.uitvoering.aandrijving, r.eind.score, r.kosten.tco.perMaand]);
    const opId = (l: unknown[][]) => [...l].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    expect(opId(zonderNaam)).toEqual(opId(echt));
  });

  it("de volgorde van de dataset maakt niet uit", () => {
    const omgekeerd = [...alleModellen].reverse();
    expect(rangschik(basis, g, omgekeerd).lijst.map((r) => r.id)).toEqual(rangschik(basis, g).lijst.map((r) => r.id));
  });

  it("restwaarde en comfort tellen voor niemand mee (geen data per model)", () => {
    for (const r of rangschik(basis, g).lijst) {
      expect(r.scores.REST).toBeNull();
      expect(r.scores.COMF).toBeNull();
    }
  });
});

describe("harde eisen", () => {
  it("7 personen: alleen auto's met 7 zitplaatsen", () => {
    const r = rangschik({ ...basis, personen: 7 }, g);
    for (const x of r.lijst) expect(x.uitvoering.zitplaatsen).toBeGreaterThanOrEqual(7);
  });
  it("trekgewicht 1500 kg", () => {
    for (const x of rangschik({ ...basis, trekgewicht: 1500 }, g).lijst) expect(x.uitvoering.trekgewichtGeremd).toBeGreaterThanOrEqual(1500);
  });
  it("alleen elektrisch gekozen", () => {
    const r = rangschik({ ...basis, aandrijvingen: ["elektrisch"] }, g);
    expect(r.lijst.length).toBeGreaterThan(0);
    for (const x of r.lijst) expect(x.uitvoering.aandrijving).toBe("elektrisch");
  });
  it("modellen die niet meer nieuw geregistreerd worden vallen af", () => {
    expect(rangschik(basis, g).lijst.map((r) => r.id)).not.toContain("toyota-aygo");
  });
  it("top 3 bestaat uit drie verschillende modellen, eerst wat binnen budget past", () => {
    const { top } = rangschik(basis, g);
    expect(new Set(top.map((t) => t.id)).size).toBe(top.length);
    const eersteErboven = top.findIndex((t) => !t.binnenBudget);
    if (eersteErboven >= 0) expect(top.slice(eersteErboven).every((t) => !t.binnenBudget)).toBe(true);
  });
});

describe("kosten van een fictieve voorbeeldauto (met de hand na te rekenen)", () => {
  // Merkloze benzineauto: €30.000, 1.200 kg, 5,0 l/100 km.
  const u: UitvoeringRdw = {
    aandrijving: "benzine",
    steekproef: 100,
    periode: [2026, 2026],
    catalogusprijs: 30000,
    massaRijklaar: 1200,
    zitplaatsen: 5,
    trekgewichtGeremd: 1000,
    lengteCm: 420,
    vermogenKw: 85,
    verbruikWltp: 5,
    verbruikGewogenWltp: null,
    elektrischVerbruikWltp: null,
    co2Wltp: 114,
    actieradiusWltpKm: null,
  };
  const k = kostenNieuw(u, basis)!;
  it("energie: 15.000 km × 5 l/100 km × €2,412 = €1.809 per jaar", () => {
    expect(k.energiePerJaar).toBe(1809);
  });
  it("afschrijving: 60 maanden → 64,52% + 0 km-correctie → restwaarde €10.644", () => {
    expect(k.restwaardeEinde).toBe(10644);
  });
  it("TCO is de som van de getoonde posten", () => {
    const som = k.tco.posten.reduce((s, p) => s + p.bedrag, 0);
    expect(k.tco.perMaand).toBeCloseTo(som, 2);
  });
});
