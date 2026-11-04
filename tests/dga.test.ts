// DGA met een bv, fictieve merkloze auto. Vaste percentages zodat alles met de hand na te rekenen is:
// Vpb 19%, box 2 24,5%, loonheffing over de bijtelling 50% (in de app: exact).
import { describe, expect, it } from "vitest";
import { dgaVarianten, type DgaSituatie, type ZzpAuto } from "@/engine";

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
const s: DgaSituatie = {
  zakelijkeKm: 20000,
  priveKm: 5000,
  btwPlichtigBv: true,
  rendement: 0.025,
  vpbVoordeel: (x) => 0.19 * x,
  box2Voordeel: (x) => 0.245 * x,
  extraLoonheffing: (x) => 0.5 * x,
  pseudoEindheffing: 4356,
  pseudoEindheffingAftrekbaar: false,
};
const v = Object.fromEntries(dgaVarianten(auto, s).map((x) => [x.vorm, x]));

describe("auto in de bv", () => {
  it("bv: 8.100 kosten − 19% Vpb (1.539) + 525 rendement + 892,98 btw-correctie + 4.356 pseudo-eindheffing = 12.334,98", () => {
    const p = v.autoInBv.posten;
    expect(p.find((x) => x.label === "Minder Vpb")!.bedrag).toBe(-1539);
    expect(p.find((x) => x.label.startsWith("Minder box 2"))!.uitleg).toContain("12.335");
  });
  it("privé: 12.334,98 − 24,5% box 2 (3.022,07) + 50% × 7.986 bijtelling (3.993) = 13.305,91", () => {
    expect(v.autoInBv.nettoPerJaar).toBe(13305.91);
  });
  it("elektrisch zonder pseudo-eindheffing scheelt precies die 4.356 × (1 − 24,5%)", () => {
    const zonder = dgaVarianten(auto, { ...s, pseudoEindheffing: 0 }).find((x) => x.vorm === "autoInBv")!;
    expect(Math.round((v.autoInBv.nettoPerJaar - zonder.nettoPerJaar) * 100) / 100).toBe(3288.78);
  });
});

describe("auto privé + km-vergoeding van de bv", () => {
  it("10.016,25 kosten − 5.000 vergoeding + (5.000 − 950 Vpb) − 24,5% × 4.050 box 2 = 8.074", () => {
    expect(v.autoPriveKmVergoeding.nettoPerJaar).toBe(8074);
  });
});
