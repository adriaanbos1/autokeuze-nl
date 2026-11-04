// Ranglijst op de echte dataset: harde eisen, kosten en merkneutraliteit.
import { describe, expect, it } from "vitest";
import { alleModellen, STANDAARD_ZAKELIJK, hardeEisen, kosten, kostenNieuw, occasionVan, rangschik, type Intake } from "@/data/ranking";
import { startGewichten } from "@/engine";
import type { ModelRdw, UitvoeringRdw } from "@/data/types";

const basis: Intake = {
  profiel: "particulier",
  soort: "nieuw",
  maxLeeftijdJaar: 8,
  maxKmStand: null,
  zakelijk: STANDAARD_ZAKELIJK,
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

describe("occasions", () => {
  const u = {
    aandrijving: "benzine" as const,
    steekproef: 100,
    periode: [2021, 2021] as [number, number],
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
  it("bouwjaar 2021 gekocht in 2026: 60 maanden oud, 75.000 km (15.000 per jaar)", () => {
    expect(occasionVan(2021, 2026)).toEqual({ bouwjaar: 2021, leeftijdMaanden: 60, kmNu: 75000 });
  });
  it("prijs: nieuwprijs €30.000 × (1 − 64,52%) = €10.644; na nog 5 jaar (120 mnd: 81 + 6 × 0,19 = 82,14%) €5.358", () => {
    const k = kosten(u, basis, occasionVan(2021, 2026))!;
    expect(k.aankoopprijs).toBe(10644);
    expect(k.restwaardeEinde).toBe(5358);
  });
  it("leeftijd en kilometerstand zijn harde eisen", () => {
    const occ = occasionVan(2019, 2026);
    expect(hardeEisen(u, { ...basis, maxLeeftijdJaar: 5 }, null, occ)).toContain("ouder dan 5 jaar");
    expect(hardeEisen(u, { ...basis, maxKmStand: 100000 }, null, occ)).toContain("ca. 105.000 km");
  });
  it("een occasion valt niet af omdat het model niet meer nieuw verkocht wordt", () => {
    expect(hardeEisen(u, basis, null, occasionVan(2021, 2026)).some((r) => r.includes("nieuw geregistreerd"))).toBe(false);
  });
  it("soort occasion: alleen occasions binnen de leeftijdsgrens; soort nieuw: alleen nieuw", () => {
    const occ = rangschik({ ...basis, soort: "occasion", maxLeeftijdJaar: 6 }, g).lijst;
    expect(occ.length).toBeGreaterThan(0);
    for (const r of occ) expect(2026 - r.occasion!.bouwjaar).toBeLessThanOrEqual(6);
    for (const r of rangschik(basis, g).lijst) expect(r.occasion).toBeNull();
  });
  it("merkblind ook voor occasions", () => {
    const i = { ...basis, soort: "beide" as const };
    const blind = alleModellen.map((m, n) => ({ ...m, merk: `MERK ${n}`, model: `MODEL ${n}` }));
    const vorm = (l: ReturnType<typeof rangschik>["lijst"]) => l.map((r) => [r.id, r.occasion?.bouwjaar ?? 0, r.eind.score]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    expect(vorm(rangschik(i, g, blind).lijst)).toEqual(vorm(rangschik(i, g).lijst));
  });
});

describe("zakelijke profielen (basis)", () => {
  const benzine = {
    aandrijving: "benzine" as const,
    steekproef: 100,
    periode: [2026, 2026] as [number, number],
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
  const ev = { ...benzine, aandrijving: "elektrisch" as const, verbruikWltp: 15, co2Wltp: 0, actieradiusWltpKm: 400 };
  const lease = { ...basis, profiel: "leaserijder" as const };

  it("leaserijder, benzine €30.000, inkomen €60.000 (37,56%): 22% × 30.000 = 6.600 × 0,3756 / 12 = €206,58", () => {
    expect(kostenNieuw(benzine, lease)!.profiel!.perMaand).toBe(206.58);
  });
  it("leaserijder, EV €30.000 in 2026: 18% × 30.000 = 5.400 × 0,3756 / 12 = €169,02", () => {
    expect(kostenNieuw(ev, lease)!.profiel!.perMaand).toBe(169.02);
  });
  it("leaserijder in 2027: benzine geeft de werkgever 12% pseudo-eindheffing (€3.600 per jaar)", () => {
    const k = kostenNieuw(benzine, { ...lease, zakelijk: { ...STANDAARD_ZAKELIJK, jaarIngebruikname: 2027 } })!;
    expect(k.profiel!.pseudoEindheffingWerkgever).toBe(3600);
  });
  it("ZZP'er: de score rekent met de goedkoopste van zakelijk en privé", () => {
    const k = kostenNieuw(benzine, { ...basis, profiel: "zzp" })!;
    const [zak, pri] = k.profiel!.varianten!;
    expect(k.profiel!.perMaand).toBe(Math.min(zak.perMaand, pri.perMaand));
    expect([zak.naam, pri.naam]).toEqual(["Auto zakelijk", "Auto privé + km-vergoeding"]);
  });
  it("zakelijke profielen: alleen nieuwe auto's, ook als 'allebei' is gekozen", () => {
    for (const r of rangschik({ ...lease, soort: "beide" }, startGewichten("leaserijder", { gezin: false })).lijst) expect(r.occasion).toBeNull();
  });
});
