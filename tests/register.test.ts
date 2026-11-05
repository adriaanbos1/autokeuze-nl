// Register van regels en aannames (methodiekpagina en jaarlijkse regelcheck).
import { describe, expect, it } from "vitest";
import { aandachtspunten, register } from "@/regels/register";

describe("register van regels en aannames", () => {
  it("vindt alle parameters uit regels-nl.ts en aannames.ts", () => {
    expect(register.filter((r) => r.bestand === "regels-nl.ts").length).toBe(34);
    expect(register.filter((r) => r.bestand === "aannames.ts").length).toBe(30);
  });
  it.each(register.map((r) => [r.pad, r] as const))("%s heeft een bron, geldige datums en een status", (_, r) => {
    expect(r.bron.length).toBeGreaterThan(3);
    expect(r.geldigVanaf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.peildatum).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["vastgesteld", "aangekondigd", "onzeker", "bron", "aanname"]).toContain(r.label);
  });
  it("wettelijke regels hebben een klikbare bron", () => {
    expect(register.filter((r) => r.bestand === "regels-nl.ts" && !r.url).map((r) => r.pad)).toEqual([]);
  });
  it("aandachtspunten: peildatum ouder dan 12 maanden telt als verouderd", () => {
    expect(aandachtspunten("2026-11-05").verouderd).toEqual([]);
    expect(aandachtspunten("2028-01-01").verouderd.length).toBe(register.length);
  });
});
