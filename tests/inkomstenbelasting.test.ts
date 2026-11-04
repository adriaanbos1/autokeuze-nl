// Inkomstenbelasting 2026, Vpb, box 2, KIA en de 60-maandenregel van de bijtelling.
// Bedragen zijn met de hand na te rekenen met de tabellen van de Belastingdienst (docs/regels-nl.md).
import { describe, expect, it } from "vitest";
import {
  algemeneHeffingskorting2026,
  arbeidskorting2026,
  belastingOndernemer2026,
  belastingWerknemer2026,
  bijtellingPerJaar,
  box1Belasting2026,
  box2Belasting2026,
  effectiefTarief,
  kia2026,
  periodeStartjaar,
  schijvenBelasting,
  vpb2026,
} from "@/engine";
import { regels } from "@/regels/regels-nl";

describe("box 1 2026", () => {
  it("schijven: 38.883 × 35,75% + 11.117 × 37,56% = 18.076,22 bij €50.000", () => {
    expect(schijvenBelasting(50000, regels.box1.schijven2026.waarde)).toBe(18076.22);
  });
  it("algemene heffingskorting: 3.115 − 6,398% × (50.000 − 29.736) = 1.818,51", () => {
    expect(algemeneHeffingskorting2026(50000)).toBe(1818.51);
    expect(algemeneHeffingskorting2026(20000)).toBe(3115);
    expect(algemeneHeffingskorting2026(80000)).toBe(0);
  });
  it("arbeidskorting: 5.685 − 6,51% × (50.000 − 45.592) = 5.398,04", () => {
    expect(arbeidskorting2026(50000)).toBe(5398.04);
  });
  it("arbeidskorting sluit aan op de schijfgrenzen", () => {
    expect(arbeidskorting2026(11965)).toBe(996);
    expect(arbeidskorting2026(25845)).toBe(5300);
    expect(arbeidskorting2026(132919)).toBe(0.01);
    expect(arbeidskorting2026(140000)).toBe(0);
  });
  it("totaal werknemer €50.000: 18.076,22 − 1.818,51 − 5.398,04 = 10.859,67", () => {
    expect(box1Belasting2026({ belastbaarInkomen: 50000, arbeidsinkomen: 50000 }).totaal).toBe(10859.67);
  });
  it("effectief tarief over extra loon tussen €60.000 en €66.600: 37,56% + 6,398% + 6,51% = 50,468%", () => {
    expect(effectiefTarief(belastingWerknemer2026, 60000, 6600)).toBeCloseTo(0.50468, 4);
  });
  it("ondernemer €60.000 winst: (60.000 − 1.200) × 87,3% = 51.332,40 belastbaar", () => {
    const verwacht = box1Belasting2026({ belastbaarInkomen: 51332.4, arbeidsinkomen: 60000 }).totaal;
    expect(belastingOndernemer2026(60000)).toBe(verwacht);
  });
});

describe("Vpb en box 2 2026", () => {
  it("Vpb €250.000: 200.000 × 19% + 50.000 × 25,8% = 50.900", () => {
    expect(vpb2026(250000)).toBe(50900);
  });
  it("box 2 €100.000: 68.843 × 24,5% + 31.157 × 31% = 26.525,21", () => {
    expect(box2Belasting2026(100000)).toBeCloseTo(26525.21, 1);
  });
});

describe("KIA 2026", () => {
  it("tot en met €2.900 geen aftrek", () => expect(kia2026(2900)).toBe(0));
  it("€50.000: 28% = 14.000", () => expect(kia2026(50000)).toBe(14000));
  it("€100.000: vast 20.072", () => expect(kia2026(100000)).toBe(20072));
  it("€200.000: 20.072 − 7,56% × 67.254 = 14.987,60", () => expect(kia2026(200000)).toBe(14987.6));
  it("boven €398.236 geen aftrek", () => expect(kia2026(400000)).toBe(0));
});

describe("bijtelling: 60-maandenregel", () => {
  it("eerste toelating 2019: periode 2019–2023, daarna nieuwe periode vanaf 2024", () => {
    expect(periodeStartjaar(2019, 2023)).toBe(2019);
    expect(periodeStartjaar(2019, 2024)).toBe(2024);
    expect(periodeStartjaar(2019, 2026)).toBe(2024);
  });
  it("EV €40.000 uit 2019: in 2023 4% (cap €50.000) = 1.600; in 2026 regels 2024: 16% × 30.000 + 22% × 10.000 = 7.000", () => {
    expect(bijtellingPerJaar({ cataloguswaarde: 40000, aandrijving: "batterij", jaarEersteToelating: 2019, kalenderjaar: 2023 }).perJaar).toBe(1600);
    expect(bijtellingPerJaar({ cataloguswaarde: 40000, aandrijving: "batterij", jaarEersteToelating: 2019, kalenderjaar: 2026 }).perJaar).toBe(7000);
  });
  it("EV €50.000 uit 2021 in 2025: 12% × 40.000 + 22% × 10.000 = 7.000", () => {
    expect(bijtellingPerJaar({ cataloguswaarde: 50000, aandrijving: "batterij", jaarEersteToelating: 2021, kalenderjaar: 2025 }).perJaar).toBe(7000);
  });
});
