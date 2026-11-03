/**
 * Welke APK-gebreken tellen mee voor de betrouwbaarheidsscore.
 *
 * Mee: technische gebreken (artikelnummers "5.*.N" uit de APK-regeling, plus de
 * "RA"-codes, bijvoorbeeld een defecte airbagwaarschuwing of vloeistoflekkage).
 * Niet mee: adviespunten ("AC", bijv. bandprofiel 1,6–2,5 mm), administratieve
 * punten (kentekenregister, tellerstand, VIN), afmetingen, LPG-documentatie,
 * tachograaf en "niet beoordeelbaar". Die zeggen niets over de auto zelf.
 * Uitleg: docs/methodiek.md §2.2.
 */

/** Hoofdstukken binnen "5.*.N" die administratief zijn of over maatvoering gaan. */
const NIET_TECHNISCH_HOOFDSTUK = new Set([1, 6, 74, 75, 76, 77, 78, 79]);

export function isTechnischGebrek(artikelnummer: string | undefined, identificatie: string): boolean {
  if (identificatie.startsWith("RA")) return true;
  const m = artikelnummer?.match(/^5\.[^.]*\.(\d+)/);
  if (!m) return false;
  return !NIET_TECHNISCH_HOOFDSTUK.has(Number(m[1]));
}
