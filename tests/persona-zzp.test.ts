// Persona 2 uit docs/methodiek.md §4.2 — ZZP'er, btw-plichtig, 20.000 km zakelijk / 5.000 km privé.
import { describe, expect, it } from "vitest";
import { energiekostenPerJaar, rond2, zzpPrive, zzpZakelijk, type ZzpInvoer } from "@/engine";

const MIX = 0.326;
const basis = { looptijdJaren: 5, jaarEersteToelating: 2026, zakelijkeKm: 20000, priveKm: 5000, tarief: 0.35, btwPlichtig: true };

const z1: ZzpInvoer = {
  ...basis,
  aankoopprijsIncl: 40000,
  restwaardeEindeIncl: 16000,
  cataloguswaarde: 40000,
  aandrijving: "batterij",
  energieIncl: energiekostenPerJaar(25000, 17, MIX),
  onderhoudIncl: 700,
  mrb: 480,
  verzekering: 1100,
};
const z2: ZzpInvoer = {
  ...basis,
  aankoopprijsIncl: 38000,
  restwaardeEindeIncl: 17100,
  cataloguswaarde: 38000,
  aandrijving: "brandstof",
  energieIncl: energiekostenPerJaar(25000, 5, 2.3),
  onderhoudIncl: 800,
  mrb: 660,
  verzekering: 1050,
};

const post = (posten: { label: string; bedrag: number }[], label: string) => posten.find((p) => p.label.startsWith(label))!.bedrag;

describe("Persona 2: ZZP'er — auto zakelijk", () => {
  it("Z1 (EV): kosten €7.270,49; bijtelling begrensd; netto €8.350,49/jr = €695,87/mnd", () => {
    const v = zzpZakelijk(z1);
    expect(post(v.posten, "Afschrijving")).toBe(3966.94);
    expect(post(v.posten, "Energie")).toBe(1145.04);
    expect(post(v.posten, "Onderhoud")).toBe(578.51);
    expect(post(v.posten, "Bijtelling")).toBe(7270.49);
    expect(post(v.posten, "Belastingvoordeel")).toBe(0);
    expect(post(v.posten, "Btw-correctie")).toBe(1080);
    expect(v.nettoPerJaar).toBe(8350.49);
    expect(v.nettoPerMaand).toBe(695.87);
  });

  it("Z2 (hybride): kosten €8.201,74; netto €9.227,74/jr = €768,98/mnd", () => {
    const v = zzpZakelijk(z2);
    expect(post(v.posten, "Afschrijving")).toBe(3454.55);
    expect(post(v.posten, "Energie")).toBe(2376.03);
    expect(post(v.posten, "Bijtelling")).toBe(8201.74);
    expect(post(v.posten, "Btw-correctie")).toBe(1026);
    expect(v.nettoPerJaar).toBe(9227.74);
    expect(v.nettoPerMaand).toBe(768.98);
  });
});

describe("Persona 2: ZZP'er — auto privé + €0,25/km", () => {
  it("Z1 (EV): €8.465,50 − €1.750 = €6.715,50/jr = €559,63/mnd", () => {
    const v = zzpPrive(z1);
    expect(v.nettoPerJaar).toBe(6715.5);
    expect(v.nettoPerMaand).toBe(559.63);
  });

  it("Z2 (hybride): €9.565 − €1.750 = €7.815/jr = €651,25/mnd", () => {
    const v = zzpPrive(z2);
    expect(v.nettoPerJaar).toBe(7815);
    expect(v.nettoPerMaand).toBe(651.25);
  });

  it("in dit scenario is privé €136,24/mnd goedkoper voor de EV", () => {
    expect(rond2(zzpZakelijk(z1).nettoPerMaand - zzpPrive(z1).nettoPerMaand)).toBe(136.24);
  });
});

describe("Persona 2: gevoeligheid ≤ 500 km privé", () => {
  it("geen bijtelling en geen btw-correctie: €4.725,82/jr = €393,82/mnd", () => {
    const v = zzpZakelijk({ ...z1, priveKm: 500 });
    expect(post(v.posten, "Bijtelling")).toBe(0);
    expect(post(v.posten, "Btw-correctie")).toBe(0);
    expect(post(v.posten, "Belastingvoordeel")).toBe(-2544.67);
    expect(v.nettoPerJaar).toBe(4725.82);
    expect(v.nettoPerMaand).toBe(393.82);
  });
});
