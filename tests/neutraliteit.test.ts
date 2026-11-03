// Borging merkneutraliteit (docs/methodiek.md §6–7): de engine mag geen
// partnerdata importeren en geen merknamen in de code hebben.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const engineDir = path.resolve(__dirname, "../src/engine");
const bestanden = readdirSync(engineDir).filter((f) => f.endsWith(".ts"));
const bron = (f: string) => readFileSync(path.join(engineDir, f), "utf8");

describe("neutraliteit van de engine", () => {
  it.each(bestanden)("%s importeert niets uit partners/affiliate", (f) => {
    expect(bron(f)).not.toMatch(/from\s+["'][^"']*(partner|affiliate)/i);
  });

  it.each(bestanden)("%s bevat geen velden voor commissie of marge", (f) => {
    expect(bron(f)).not.toMatch(/commissie|provisie|marge|affiliate/i);
  });
});
