// Bestelauto's: MRB ondernemerstarief, ZE-zone-toegang en KIA. MRB-bedragen gecontroleerd met de
// rekenhulp van de Belastingdienst (4-11-2026, met de tijdelijke halvering): 1.400 kg €60, 2.000 kg €87, 3.000 kg €128.
import { describe, expect, it } from "vitest";
import { euronorm, kiaPerJaar, mrbBestelautoOndernemer, zeToegangTot } from "@/engine";

describe("MRB bestelauto ondernemer (art. 24b)", () => {
  it("2.000 kg: 104,42 + 8 × 8,76 = 174,50 per kwartaal → 174", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 2000, jaar: 2027 }).perKwartaal).toBe(174);
  });
  it("2026: twee kwartalen vol, twee gehalveerd: 174 + 174 + 87 + 87 = 522 (rekenhulp: €87 per kwartaal)", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 2000, jaar: 2026 }).perJaar).toBe(522);
  });
  it("2027: 4 × 174 = 696", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 2000, jaar: 2027 }).perJaar).toBe(696);
  });
  it("1.400 kg: 104,42 + 2 × 8,76 = 121,94; gehalveerd 60 (rekenhulp €60)", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 1400, jaar: 2026 }).perJaar).toBe(121 + 121 + 60 + 60);
  });
  it("3.000 kg: 254,79 + 2,14 = 256,93; gehalveerd 128 (rekenhulp €128)", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 3000, jaar: 2026 }).perJaar).toBe(256 + 256 + 128 + 128);
  });
  it("massa afronden op 100 kg: 1.950 → 1.900", () => {
    expect(mrbBestelautoOndernemer({ massaRijklaar: 1950, jaar: 2027 }).perKwartaal).toBe(Math.floor(104.42 + 7 * 8.76));
  });
});

describe("ZE-zones", () => {
  it("euronorm uit RDW-tekst", () => {
    expect(euronorm("EURO 6 EA")).toBe(6);
    expect(euronorm("EURO VI E")).toBe(6);
    expect(euronorm("EURO 5")).toBe(5);
    expect(euronorm(null)).toBeNull();
  });
  it("elektrisch altijd; diesel Euro 6 t/m 2027; Euro 5 t/m 2026; fossiel uit 2025 nooit", () => {
    expect(zeToegangTot({ elektrisch: true, emissieklasse: null, jaarEersteToelating: 2025 })).toBe(Infinity);
    expect(zeToegangTot({ elektrisch: false, emissieklasse: "EURO 6 EA", jaarEersteToelating: 2022 })).toBe(2027);
    expect(zeToegangTot({ elektrisch: false, emissieklasse: "EURO 5", jaarEersteToelating: 2014 })).toBe(2026);
    expect(zeToegangTot({ elektrisch: false, emissieklasse: "EURO 6 EA", jaarEersteToelating: 2025 })).toBeNull();
  });
});

describe("KIA bestelauto", () => {
  it("€40.000 excl. btw: 28% = 11.200; verkoop na 5 jaar voor €15.000 → desinvestering 28% × 15.000 = 4.200; (11.200 − 4.200) / 5 = 1.400 per jaar", () => {
    expect(kiaPerJaar(40000, 15000, 5).perJaar).toBe(1400);
  });
  it("langer dan 5 jaar houden: geen desinvesteringsbijtelling; 11.200 / 6 = 1.866,67", () => {
    expect(kiaPerJaar(40000, 12000, 6).perJaar).toBe(1866.67);
  });
});
