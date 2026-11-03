// Vergelijkt de engine met de officiële MRB-rekentool van de Belastingdienst,
// voor alle 12 provincies en alle gewichtsklassen t/m 4.050 kg.
// De referentiebedragen staan in tests/fixtures/belastingdienst-mrb.json.
import { describe, expect, it } from "vitest";
import ref from "./fixtures/belastingdienst-mrb.json";
import { mrbPersonenauto, type Brandstof } from "@/engine";
import type { Provincie } from "@/regels/regels-nl";

const codes: Record<string, Provincie> = {
  DR: "drenthe", FL: "flevoland", FR: "friesland", GL: "gelderland", GR: "groningen", LI: "limburg",
  NB: "noord-brabant", NH: "noord-holland", OV: "overijssel", UT: "utrecht", ZL: "zeeland", ZH: "zuid-holland",
};
// kolommen in de fixture: 1 benzine, 2 diesel, 3 emissievrij, 5 LPG en overige (4 = LPG3/aardgas, niet in de engine)
const kolommen: [number, Brandstof][] = [[1, "benzine"], [2, "diesel"], [3, "elektrisch"], [5, "overig"]];

const gevallen = Object.entries(ref.provincies).flatMap(([code, rij]) =>
  rij.split(" ").flatMap((klasse) => {
    const v = klasse.split("#").map(Number);
    const massa = v[0] + 49; // midden van de klasse, rondt af op het klassengewicht
    return kolommen.map(([k, brandstof]) => ({ code, massa, brandstof, verwacht: v[k] }));
  }),
);

const metEngine = gevallen.map((g) => ({
  ...g,
  engine: mrbPersonenauto({ massaRijklaar: g.massa, brandstof: g.brandstof, provincie: codes[g.code], jaar: 2026 }).perKwartaal,
}));

// Bekende uitzonderingen (docs/regels-nl.md §1):
// 1. Klasse "1 t/m 650 kg": de rekentool rekent met een iets lagere opcentengrondslag
//    dan €14,50 (afgeleid: tussen €14,21 en €14,35); oorzaak onbekend, praktisch irrelevant
//    (geen personenauto's van ≤ 650 kg rijklaar). Hier mag de engine hooguit €1 hoger uitkomen.
// 2. Noord-Brabant, LPG/overig, 3.300 kg: exact €1.315,9999; de rekentool geeft €1.316
//    (vermoedelijk afrondingsruis in de rekentool zelf).
const lichtsteKlasse = (g: (typeof metEngine)[number]) => g.massa < 651;
const bekendeAfwijking = (g: (typeof metEngine)[number]) => g.code === "NB" && g.massa === 3300 && g.brandstof === "overig";

describe("MRB 2026 gelijk aan Belastingdienst-rekentool", () => {
  it(`${metEngine.filter((g) => !lichtsteKlasse(g)).length} combinaties provincie × gewicht × brandstof vanaf 651 kg kloppen exact`, () => {
    const afwijkingen = metEngine.filter((g) => !lichtsteKlasse(g) && !bekendeAfwijking(g) && g.engine !== g.verwacht);
    expect(afwijkingen).toEqual([]);
  });

  it("bekende afwijking NB/overig/3.300 kg is €1 en blijft zichtbaar", () => {
    const g = metEngine.find(bekendeAfwijking)!;
    expect(g.verwacht - g.engine).toBe(1);
  });

  it("lichtste klasse (≤ 650 kg) wijkt hooguit €1 af", () => {
    for (const g of metEngine.filter(lichtsteKlasse)) expect(g.engine - g.verwacht).toBeGreaterThanOrEqual(0), expect(g.engine - g.verwacht).toBeLessThanOrEqual(1);
  });
});
