import { describe, expect, it } from "vitest";
import { modelFamilie } from "@/data/normaliseer";

describe("modelfamilie uit RDW-handelsbenaming", () => {
  it.each([
    ["TOYOTA", "TOYOTA YARIS", "YARIS"],
    ["TOYOTA", "TOYOTA YARIS HYBRID", "YARIS"],
    ["TOYOTA", "TOYOTA YARIS CROSS", "YARIS CROSS"],
    ["TOYOTA", "TOYOTA AYGO X", "AYGO X"],
    ["TOYOTA", "TOYOTA AYGO", "AYGO"],
    ["TESLA", "MODEL Y", "MODEL Y"],
    ["TESLA", "MODEL S", "MODEL S"],
    ["LYNK&CO", "LYNK & CO 01", "01"],
    ["FIAT", "FIAT 500", "500"],
    ["FIAT", "500", "500"],
    ["MITSUBISHI", "MITSUBISHI SPACE STAR", "SPACE STAR"],
    ["OPEL", "GRANDLAND X", "GRANDLAND"],
    ["OPEL", "CROSSLAND X", "CROSSLAND"],
    ["OPEL", "ASTRA SPORTS TOURER", "ASTRA"],
    ["AUDI", "A3 SPORTBACK", "A3"],
    ["AUDI", "Q4 45 E-TRON", "Q4 E-TRON"],
    ["VOLKSWAGEN", "ID.3 PRO 150 KW", "ID.3"],
    ["SKODA", "ENYAQ 80", "ENYAQ"],
    ["HYUNDAI", "IONIQ5", "IONIQ 5"],
    ["RENAULT", "CAPTUR E-TECH HYBRID", "CAPTUR"],
    ["RENAULT", "MEGANE E-TECH ELECTRIC", "MEGANE E-TECH ELECTRIC"],
    ["RENAULT", "RENAULT 5 E-TECH ELECTRIC", "5"],
    ["CITROEN", "C3 AIRCROSS", "C3 AIRCROSS"],
    ["BMW", "118I", "1 SERIE"],
    ["BMW", "330E", "3 SERIE"],
    ["BMW", "X1 XDRIVE25E", "X1"],
    ["BMW", "IX1 EDRIVE20", "IX1"],
    ["MERCEDES-BENZ", "A 180", "A-KLASSE"],
    ["MERCEDES-BENZ", "GLC 300 E 4MATIC", "GLC"],
    ["NISSAN", "NISSAN QASHQAI", "QASHQAI"],
    ["MAZDA", "MAZDA CX-5", "CX-5"],
  ])("%s %s → %s", (merk, naam, familie) => {
    expect(modelFamilie(merk, naam)).toBe(familie);
  });
});
