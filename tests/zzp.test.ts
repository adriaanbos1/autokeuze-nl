// ZZP'er: vier varianten met een fictieve, merkloze auto. Belastingvoordeel vast op 40% zodat alles
// met de hand na te rekenen is (in de app komt het exacte voordeel uit de inkomstenbelasting 2026).
import { describe, expect, it } from "vitest";
import { gemiddeldeBtwCorrectie, zzpVarianten, type ZzpAuto, type ZzpSituatie } from "@/engine";

// €30.000 excl. btw (€36.300 incl.), na 5 jaar €12.000 excl. (€14.520 incl.).
const auto: ZzpAuto = {
  aankoopprijs: 36300,
  btwOpFactuur: true,
  restwaardeEinde: 14520,
  looptijdJaren: 5,
  cataloguswaarde: 36300,
  aandrijving: "brandstof",
  jaarEersteToelating: 2026,
  startjaar: 2026,
  energie: 2420,
  onderhoud: 605,
  mrb: 800,
  verzekering: 1200,
};
const situatie: ZzpSituatie = { zakelijkeKm: 20000, priveKm: 5000, btwPlichtig: true, rendement: 0.025, belastingvoordeel: (x) => 0.4 * x };
const lease = { financialLease: { jaarrente: 0.075, slottermijn: 9600 }, operationalLease: { offerteExclBtw: null, kapitaalrente: 0.05, opslag: 0.1 } };
const v = Object.fromEntries(zzpVarianten(auto, situatie, lease).map((x) => [x.vorm, x]));

describe("btw-correctie privégebruik", () => {
  it("4 jaar 2,7% + 1 jaar 1,5% van €36.300: (4 × 980,10 + 544,50) / 5 = 892,98", () => {
    expect(gemiddeldeBtwCorrectie(auto, situatie, true)).toBe(892.98);
  });
  it("geen btw-aftrek bij aanschaf (marge-auto): steeds 1,5% = 544,50", () => {
    expect(gemiddeldeBtwCorrectie(auto, situatie, false)).toBe(544.5);
  });
  it("≤ 500 km privé: geen correctie", () => {
    expect(gemiddeldeBtwCorrectie(auto, { ...situatie, priveKm: 400 }, true)).toBe(0);
  });
});

describe("kopen, auto zakelijk", () => {
  it("kosten 3.600 + 4.500 = 8.100; bijtelling 7.986; voordeel 40% × 114 = 45,60; + gemist rendement 525 + btw-correctie 892,98 = 9.472,38", () => {
    expect(v.koopZakelijk.nettoPerJaar).toBe(9472.38);
  });
});

describe("kopen, auto privé + km-vergoeding", () => {
  it("4.356 + 2.420 + 800 + 1.200 + 605 + 635,25 − 40% × 5.000 = 8.016,25", () => {
    expect(v.koopPrive.nettoPerJaar).toBe(8016.25);
  });
});

describe("financial lease zakelijk", () => {
  it("rente (468,77 × 60 + 9.600 − 30.000) / 5 = 1.545,24; netto 9.645,24 − 40% × 1.659,24 + 892,98 = 9.874,52", () => {
    expect(v.financialLeaseZakelijk.posten.find((p) => p.label === "Rente")!.bedrag).toBe(1545.24);
    expect(v.financialLeaseZakelijk.nettoPerJaar).toBe(9874.52);
  });
});

describe("operational lease", () => {
  it("schatting (3.600 + 1.050 + 800 + 1.200 + 500) × 1,1 / 12 = 655,42 excl. btw per maand", () => {
    expect(v.operationalLease.leaseprijsExcl).toBe(655.42);
    expect(v.operationalLease.leaseprijsGeschat).toBe(true);
  });
  it("netto 7.865,04 + 2.000 − 40% × (9.865,04 − 7.986) + 892,98 = 10.006,40", () => {
    expect(v.operationalLease.nettoPerJaar).toBe(10006.4);
  });
  it("met offerte €600 excl. btw wordt die gebruikt", () => {
    const o = zzpVarianten(auto, situatie, { ...lease, operationalLease: { ...lease.operationalLease, offerteExclBtw: 600 } }).find((x) => x.vorm === "operationalLease")!;
    expect(o.leaseprijsExcl).toBe(600);
    expect(o.leaseprijsGeschat).toBe(false);
  });
});

describe("niet btw-plichtig", () => {
  it("dan telt alles incl. btw en is er geen btw-correctie", () => {
    const n = zzpVarianten(auto, { ...situatie, btwPlichtig: false }, lease).find((x) => x.vorm === "koopZakelijk")!;
    expect(n.posten.find((p) => p.label === "Afschrijving")!.bedrag).toBe(4356);
    expect(n.posten.find((p) => p.label === "Btw-correctie privégebruik")!.bedrag).toBe(0);
  });
});
