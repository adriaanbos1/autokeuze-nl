// Restwaarde en occasionwaarde (docs/methodiek.md §2.1). Generieke curve: de
// forfaitaire BPM-afschrijvingstabel, met een kilometercorrectie. Géén marktwaarde
// per model; dat kan pas met een licentie op restwaardedata.
import { regels } from "@/regels/regels-nl";
import { aannames } from "@/regels/aannames";
import { rond2, type Post } from "./geld";

/** Afschrijvingspercentage (0–100) na een aantal begonnen maanden sinds eerste toelating. */
export function afschrijvingsPercentage(begonnenMaanden: number): number {
  if (begonnenMaanden <= 0) return 0;
  const tabel = regels.bpm.forfaitaireAfschrijving.waarde;
  const [vanaf, basis, perMaand] = [...tabel].reverse().find(([v]) => begonnenMaanden > v)!;
  return Math.min(100, Math.round((basis + (begonnenMaanden - vanaf) * perMaand) * 100) / 100);
}

/** Datum + n maanden; valt die dag niet in de doelmaand, dan de laatste dag daarvan (31 jan + 1 = 28 feb). */
function plusMaanden(j: number, m: number, d: number, n: number): number {
  const laatste = new Date(Date.UTC(j, m - 1 + n + 1, 0)).getUTCDate();
  return Date.UTC(j, m - 1 + n, Math.min(d, laatste));
}

/** Aantal maanden dat gedeeltelijk of helemaal voorbij is tussen twee ISO-datums (regel Belastingdienst). */
export function begonnenMaanden(vanIso: string, totIso: string): number {
  const [j, m, d] = vanIso.split("-").map(Number);
  const tot = Date.parse(`${totIso}T00:00:00Z`);
  let hele = 0;
  while (plusMaanden(j, m, d, hele + 1) <= tot) hele++;
  return hele + (plusMaanden(j, m, d, hele) < tot ? 1 : 0);
}

/**
 * Geschatte waarde van een auto: nieuwprijs × (1 − afschrijving) − km-correctie.
 * @param leeftijdMaanden begonnen maanden sinds eerste toelating
 */
export function geschatteWaarde(p: { nieuwprijs: number; leeftijdMaanden: number; km: number }): { waarde: number; uitleg: string } {
  const pct = afschrijvingsPercentage(p.leeftijdMaanden);
  const r = aannames.restwaarde;
  const normKm = (r.normKmPerJaar.waarde * p.leeftijdMaanden) / 12;
  const correctie = -((p.km - normKm) / 10000) * r.kmCorrectiePer10000.waarde;
  const factor = Math.max(0, 1 - pct / 100 + correctie);
  return {
    waarde: Math.round(p.nieuwprijs * factor),
    uitleg: `€${p.nieuwprijs.toLocaleString("nl-NL")} × (1 − ${pct.toLocaleString("nl-NL")}% afschrijving ${correctie >= 0 ? "+" : "−"} ${Math.abs(correctie * 100).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% km-correctie)`,
  };
}

/**
 * Afschrijving over een looptijd: waarde nu (aankoop) min waarde aan het eind.
 * Nieuw: leeftijdNuMaanden = 0, kmNu = 0.
 */
export function afschrijvingOverLooptijd(p: {
  nieuwprijs: number;
  leeftijdNuMaanden: number;
  kmNu: number;
  looptijdMaanden: number;
  kmPerJaar: number;
}): { waardeNu: number; waardeEinde: number; perMaand: Post } {
  const nu = p.leeftijdNuMaanden === 0 && p.kmNu === 0 ? { waarde: p.nieuwprijs, uitleg: "nieuwprijs" } : geschatteWaarde({ nieuwprijs: p.nieuwprijs, leeftijdMaanden: p.leeftijdNuMaanden, km: p.kmNu });
  const einde = geschatteWaarde({
    nieuwprijs: p.nieuwprijs,
    leeftijdMaanden: p.leeftijdNuMaanden + p.looptijdMaanden,
    km: p.kmNu + (p.kmPerJaar * p.looptijdMaanden) / 12,
  });
  return {
    waardeNu: nu.waarde,
    waardeEinde: einde.waarde,
    perMaand: {
      label: "Afschrijving (schatting)",
      bedrag: rond2((nu.waarde - einde.waarde) / p.looptijdMaanden),
      uitleg: `(${nu.waarde} nu − ${einde.waarde} na ${p.looptijdMaanden} mnd: ${einde.uitleg}) / ${p.looptijdMaanden}`,
    },
  };
}
