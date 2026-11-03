import { describe, expect, it } from "vitest";
import { isTechnischGebrek } from "@/data/gebreken";

describe("welke APK-gebreken tellen mee", () => {
  it.each([
    ["5.*.31", "410", true], // remmen
    ["5.*.27", "300", true], // banden
    ["5.*.3", "100", true], // roest
    ["RA1", "RA1", true], // airbagwaarschuwing defect
    ["AC1", "AC1", false], // adviespunt bandprofiel
    ["5.*.1", "021", false], // komt niet overeen met register
    ["5.*.6", "040", false], // afmetingen
    ["nl09", "012", false], // tellerstand niet vermeld
    ["TA.1I", "30A", false], // tachograaf
    [undefined, "919", false],
  ])("%s (%s) → %s", (artikel, id, verwacht) => {
    expect(isTechnischGebrek(artikel, id)).toBe(verwacht);
  });
});
