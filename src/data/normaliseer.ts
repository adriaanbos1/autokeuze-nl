/**
 * Zet een RDW-handelsbenaming om naar een modelfamilie, zodat varianten
 * ("TOYOTA YARIS HYBRID", "YARIS") als één model geteld worden.
 *
 * De regels zijn generiek en gelden voor elk merk gelijk; merkspecifieke
 * regels bestaan alleen waar een merk zijn modelnaam in een typecode verstopt
 * (BMW "118I" → "1 SERIE", Mercedes "A 180" → "A-KLASSE"). Uitleg en
 * verantwoording: docs/databronnen.md §5.
 */

/**
 * Het model is het eerste woord na de merknaam; uitvoeringen ("HYBRID",
 * "SPORTBACK", "PRO 150 KW") vallen daardoor vanzelf weg. Alleen deze
 * tweede woorden horen bij de modelnaam (YARIS CROSS ≠ YARIS).
 */
const HOORT_BIJ_MODEL = new Set(["CROSS", "AIRCROSS", "X", "STAR", "AYGO"]);

function merkWoorden(merk: string): string[] {
  // "LYNK&CO" → ["LYNK", "&", "CO", "LYNK&CO"]; "MERCEDES-BENZ" → ["MERCEDES-BENZ", "MERCEDES", "BENZ"]
  const m = merk.toUpperCase();
  return [m, ...m.split(/[\s&-]+/), m.replace(/&/g, " & ")].filter(Boolean);
}

export function modelFamilie(merk: string, handelsbenaming: string): string {
  let t = handelsbenaming.toUpperCase().replace(/\s+/g, " ").trim();

  // merknaam vooraan weghalen ("TOYOTA YARIS", "LYNK & CO 01")
  for (const w of merkWoorden(merk).sort((a, b) => b.length - a.length)) {
    if (t.startsWith(w + " ")) t = t.slice(w.length + 1);
  }
  t = t.replace(/^& CO /, "").replace(/^CO /, "");

  const m = merk.toUpperCase();
  if (m === "BMW") {
    // 118I, 330E, 520D → 1/3/5 SERIE; X1 XDRIVE25E → X1; IX1 EDRIVE20 → IX1
    const serie = t.match(/^(\d)\d\d[A-Z]*\b/);
    if (serie) return `${serie[1]} SERIE`;
  }
  if (m === "MERCEDES-BENZ") {
    // "A 180", "C 300 E" → A-KLASSE, C-KLASSE; "GLC 300 E 4MATIC" → GLC; "EQA 250" → EQA
    const klasse = t.match(/^([A-Z]) \d+/);
    if (klasse) return `${klasse[1]}-KLASSE`;
  }

  // "IONIQ5" → "IONIQ 5"; "ID.3 PRO 150 KW" blijft "ID.3"
  t = t.replace(/^IONIQ(\d)/, "IONIQ $1");

  const woorden = t.split(" ");
  const kern: string[] = [woorden[0]];
  // "MODEL Y", "IONIQ 5", "RENAULT 5 E-TECH ELECTRIC" → "5"
  if (["MODEL", "IONIQ"].includes(woorden[0]) && woorden[1]) kern.push(woorden[1]);
  else if (woorden[1] && HOORT_BIJ_MODEL.has(woorden[1]) && !(woorden[1] === "X" && ["GRANDLAND", "CROSSLAND"].includes(woorden[0]))) {
    kern.push(woorden[1]);
  }
  // Volledig elektrische opvolgers met eigen carrosserie ("MEGANE E-TECH ELECTRIC", "SCENIC E-TECH ELECTRIC")
  if (/\bE-TECH ELECTRIC\b/.test(t) && !/^\d/.test(woorden[0])) kern.push("E-TECH ELECTRIC");
  // "Q4 45 E-TRON" → "Q4 E-TRON"
  if (/\bE-TRON\b/.test(t) && !kern.includes("E-TRON")) kern.push("E-TRON");

  return kern.join(" ");
}

/** Sleutel voor een model: merk + familie, bijvoorbeeld "TOYOTA|YARIS CROSS". */
export function modelSleutel(merk: string, handelsbenaming: string): string {
  return `${merk.toUpperCase()}|${modelFamilie(merk, handelsbenaming)}`;
}
