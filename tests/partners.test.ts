// Invariantietest partners (docs/methodiek.md §7): partnerlinks mogen de ranglijst nooit veranderen.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { STANDAARD_ZAKELIJK, rangschik, type Intake } from "@/data/ranking";
import { startGewichten } from "@/engine";
import { NEUTRALE_OPTIE, controleerUrl, partnerBlokken, partners, type Partner } from "@/partners";

const basis: Intake = {
  profiel: "particulier",
  voertuig: "personenauto",
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

const gevallen: [string, Intake][] = [
  ["particulier nieuw", basis],
  ["particulier occasion", { ...basis, soort: "occasion" }],
  ["zzp beide", { ...basis, profiel: "zzp", soort: "beide", kinderen: false, personen: 1 }],
  ["dga nieuw", { ...basis, profiel: "dga", kinderen: false, personen: 2 }],
  ["leaserijder", { ...basis, profiel: "leaserijder", maandbudget: 300 }],
  ["zzp bestelauto", { ...basis, profiel: "zzp", voertuig: "bestelauto", kinderen: false, personen: 2 }],
];

// "Agressieve" neppartners: voor elk model, met een eigen voorkeursmodel. Ze mogen niets uitmaken.
const nepPartners: Partner[] = [
  { naam: "Zeta Lease", soort: "private lease", url: "https://voorbeeld.invalid/lease?auto={model}" },
  { naam: "Alfa Financiering", soort: "financiering", url: "https://voorbeeld.invalid/lenen" },
  { naam: "Voorkeursdealer", soort: "dealer", url: "https://voorbeeld.invalid/dealer/{model}", modellen: ["kia-niro"] },
];

const diepBevroren = <T,>(x: T): T => {
  if (x && typeof x === "object" && !Object.isFrozen(x)) {
    Object.freeze(x);
    for (const v of Object.values(x)) diepBevroren(v);
  }
  return x;
};

describe("ranking-invariantie: met en zonder partners identiek", () => {
  it.each(gevallen)("%s", (_, intake) => {
    const g = startGewichten(intake.profiel, { gezin: intake.kinderen || intake.personen >= 3, occasion: intake.soort === "occasion" });
    const zonder = JSON.stringify(rangschik(intake, g));
    // Partnerblok draait op een bevroren ranglijst: elke poging tot wijzigen geeft een fout.
    const ranglijst = diepBevroren(rangschik(intake, g));
    const blokken = partnerBlokken(ranglijst.top.map((r) => r.id), nepPartners);
    expect(JSON.stringify(ranglijst)).toBe(zonder);
    expect(JSON.stringify(rangschik(intake, g))).toBe(zonder);
    // Partnerblok volgt exact de volgorde van de ranglijst (en er is echt iets getoond).
    expect(ranglijst.top.length).toBeGreaterThan(0);
    expect(blokken.map((b) => b.modelId)).toEqual(ranglijst.top.map((r) => r.id));
  });
});

describe("partnerblok", () => {
  const blokken = partnerBlokken(["kia-niro", "toyota-yaris"], nepPartners);
  it("elke link heet 'Partnerlink' en er is altijd een neutrale optie", () => {
    for (const b of blokken) {
      expect(b.neutraal).toBe(NEUTRALE_OPTIE);
      for (const l of b.links) expect(l.label).toBe("Partnerlink");
    }
  });
  it("volgorde alfabetisch op naam, niet op invoervolgorde of vergoeding", () => {
    expect(blokken[1].links.map((l) => l.naam)).toEqual(["Alfa Financiering", "Zeta Lease"]);
  });
  it("alleen de model-id gaat mee in de URL", () => {
    expect(blokken[0].links.find((l) => l.naam === "Voorkeursdealer")!.url).toBe("https://voorbeeld.invalid/dealer/kia-niro");
    expect(blokken[1].links.some((l) => l.naam === "Voorkeursdealer")).toBe(false);
  });
  it("weigert URL's die andere gegevens willen invullen of geen https zijn", () => {
    expect(() => controleerUrl("https://x.invalid/?inkomen={inkomen}")).toThrow();
    expect(() => controleerUrl("https://x.invalid/?budget={maandbudget}&m={model}")).toThrow();
    expect(() => controleerUrl("http://x.invalid/{model}")).toThrow();
    expect(() => partnerBlokken(["a"], [{ naam: "X", soort: "dealer", url: "https://x.invalid/{postcode}" }])).toThrow();
  });
  it("er zijn nu geen echte partners (besluit 93)", () => {
    expect(partners).toEqual([]);
  });
});

describe("scheiding van de code", () => {
  const map = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? map(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  const root = path.resolve(__dirname, "..");
  const rekencode = ["src/engine", "src/data", "src/regels"].flatMap((d) => map(path.join(root, d)));
  it.each(rekencode.map((p) => [path.relative(root, p)]))("%s importeert niets uit partners", (p) => {
    expect(readFileSync(path.join(root, p), "utf8")).not.toMatch(/from\s+["'][^"']*partners/);
  });
  it("de app toont nog geen partnerlinks (besluit 93; aanpassen bij livegang)", () => {
    for (const p of map(path.join(root, "app"))) expect(readFileSync(p, "utf8")).not.toMatch(/from\s+["'][^"']*partners/);
  });
});
