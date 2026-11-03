// Persona 3 uit docs/methodiek.md §4.3 — leaserijder, marginaal tarief 49,5%.
import { describe, expect, it } from "vitest";
import { bijtellingPerJaar, nettoBijtellingWerknemer, pseudoEindheffing, rond2 } from "@/engine";

const T = 0.495;

describe("Persona 3: leaserijder, eerste toelating 2026", () => {
  it("L1 EV €45.000: bijtelling €8.700 → netto €358,88/mnd", () => {
    const b = bijtellingPerJaar({ cataloguswaarde: 45000, aandrijving: "batterij", jaarEersteToelating: 2026 });
    expect(b.perJaar).toBe(8700);
    expect(nettoBijtellingWerknemer(b.perJaar, T)).toEqual({ perJaar: 4306.5, perMaand: 358.88 });
  });

  it("L2 benzine €40.000: bijtelling €8.800 → netto €363,00/mnd", () => {
    const b = bijtellingPerJaar({ cataloguswaarde: 40000, aandrijving: "brandstof", jaarEersteToelating: 2026 });
    expect(b.perJaar).toBe(8800);
    expect(nettoBijtellingWerknemer(b.perJaar, T).perMaand).toBe(363);
  });

  it("L3 EV €32.000: bijtelling €5.840 → netto €240,90/mnd", () => {
    const b = bijtellingPerJaar({ cataloguswaarde: 32000, aandrijving: "batterij", jaarEersteToelating: 2026 });
    expect(b.perJaar).toBe(5840);
    expect(nettoBijtellingWerknemer(b.perJaar, T).perMaand).toBe(240.9);
  });

  it("L3 is €117,98/mnd goedkoper dan L1", () => {
    const l1 = nettoBijtellingWerknemer(8700, T).perMaand;
    const l3 = nettoBijtellingWerknemer(5840, T).perMaand;
    expect(rond2(l1 - l3)).toBe(117.98);
  });
});

describe("Persona 3: varianten", () => {
  it("L1 met eigen bijdrage €50/mnd: €384,13/mnd", () => {
    expect(nettoBijtellingWerknemer(8700, T, 600).perMaand).toBe(384.13);
  });

  it("L1 met eerste toelating 2027: bijtelling €9.300 → €383,63/mnd", () => {
    const b = bijtellingPerJaar({ cataloguswaarde: 45000, aandrijving: "batterij", jaarEersteToelating: 2027 });
    expect(b.perJaar).toBe(9300);
    expect(nettoBijtellingWerknemer(b.perJaar, T).perMaand).toBe(383.63);
  });

  it("vanaf eerste toelating 2028: 22% over alles", () => {
    expect(bijtellingPerJaar({ cataloguswaarde: 45000, aandrijving: "batterij", jaarEersteToelating: 2028 }).perJaar).toBe(9900);
  });

  it("waterstof 2026: 18% zonder cap", () => {
    expect(bijtellingPerJaar({ cataloguswaarde: 60000, aandrijving: "waterstof", jaarEersteToelating: 2026 }).perJaar).toBe(10800);
  });

  it("pseudo-eindheffing werkgever: benzine €40.000 nieuw in 2027 = €4.800/jr; EV en 2026 = €0", () => {
    expect(pseudoEindheffing(40000, "brandstof", 2027)).toBe(4800);
    expect(pseudoEindheffing(40000, "brandstof", 2026)).toBe(0);
    expect(pseudoEindheffing(45000, "batterij", 2027)).toBe(0);
  });

  it("eigen bijdrage hoger dan bijtelling: bijtelling niet onder nul", () => {
    expect(nettoBijtellingWerknemer(1000, T, 1200)).toEqual({ perJaar: 1200, perMaand: 100 });
  });
});
