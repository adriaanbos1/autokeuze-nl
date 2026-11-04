// Onderhoud, banden en verzekering: narekenbaar met de waarden uit src/regels/aannames.ts.
import { describe, expect, it } from "vitest";
import { bandenPerJaar, onderhoudPerJaar, prijsPerBand, verzekeringPerJaar } from "@/engine";

describe("onderhoud", () => {
  it("benzine, 15.000 km, 2 jaar oud: 1 beurt × (1,5 × €82 + €120) = €243", () => {
    expect(onderhoudPerJaar({ elektrisch: false, kmPerJaar: 15000, leeftijdJaar: 2 }).bedrag).toBe(243);
  });
  it("benzine, 30.000 km, 6 jaar oud: 1,5 beurt × €243 × 1,18 = €430,11", () => {
    expect(onderhoudPerJaar({ elektrisch: false, kmPerJaar: 30000, leeftijdJaar: 6 }).bedrag).toBe(430.11);
  });
  it("elektrisch, 15.000 km, nieuw: 1 × (1 × €82 + €50) = €132", () => {
    expect(onderhoudPerJaar({ elektrisch: true, kmPerJaar: 15000, leeftijdJaar: 0 }).bedrag).toBe(132);
  });
});

describe("banden", () => {
  it("prijsklasse op gewicht", () => {
    expect(prijsPerBand(1100)).toBe(90);
    expect(prijsPerBand(1600)).toBe(120);
    expect(prijsPerBand(2500)).toBe(210);
  });
  it("1.500 kg benzine, 15.000 km: 0,375 set × 4 × €120 = €180", () => {
    expect(bandenPerJaar({ elektrisch: false, massaRijklaar: 1500, kmPerJaar: 15000 }).bedrag).toBe(180);
  });
  it("2.000 kg elektrisch, 15.000 km: 0,45 set × 4 × €160 = €288", () => {
    expect(bandenPerJaar({ elektrisch: true, massaRijklaar: 2000, kmPerJaar: 15000 }).bedrag).toBe(288);
  });
});

describe("verzekering", () => {
  it("zonder eigen premie: marktgemiddelde allrisk €111,49 × 12", () => {
    expect(verzekeringPerJaar({ dekking: "allrisk" }).bedrag).toBe(1337.88);
  });
  it("eigen premie gaat voor", () => {
    expect(verzekeringPerJaar({ dekking: "allrisk", eigenPremiePerMaand: 45 }).bedrag).toBe(540);
  });
});
