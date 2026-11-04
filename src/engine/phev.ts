import { regels } from "@/regels/regels-nl";
import { rond2 } from "./geld";

/** Normaalafstand dn (km) bij een RDW-emissiecode zoals "EURO 6 EB". */
export function normaalafstand(uitlaatemissieniveau: string | null | undefined): number {
  const dn = regels.wltp.utilityFactor.waarde.normaalafstand;
  const code = /E([ABC])$/.exec((uitlaatemissieniveau ?? "").trim())?.[1];
  return code === "A" ? dn.EA : code === "B" ? dn.EB : code === "C" ? dn.EC : dn.ouder;
}

/** WLTP utility factor bij een elektrische actieradius (km). */
export function utilityFactor(actieradiusKm: number, dn: number): number {
  const c = regels.wltp.utilityFactor.waarde.coefficienten;
  const x = actieradiusKm / dn;
  return 1 - Math.exp(-c.reduce((s, ci, i) => s + ci * x ** (i + 1), 0));
}

export interface LegeAccuSchatting {
  /** Geschat brandstofverbruik met lege accu, l/100 km (1 decimaal). */
  lPer100: number;
  /** Gebruikte utility factor (aandeel "elektrisch" volgens de WLTP-weging). */
  utilityFactor: number;
  normaalafstandKm: number;
}

/**
 * Brandstofverbruik van een plug-in hybride met lege accu, afgeleid uit het
 * officiële gewogen WLTP-verbruik:
 *   gewogen ≈ UF × 0 + (1 − UF) × leeg   ⇒   leeg ≈ gewogen / (1 − UF)
 * Aannames: geen brandstof in de elektrische fase en UF bij de elektrische
 * actieradius (de officiële weging werkt per testfase). Controle tegen RDW-auto's
 * met een officiële waarde: mediane afwijking +1% (docs/methodiek.md §2.4).
 */
export function verbruikLegeAccu(gewogenLPer100: number, actieradiusKm: number, uitlaatemissieniveau?: string | null): LegeAccuSchatting | null {
  if (!(gewogenLPer100 > 0) || !(actieradiusKm > 0)) return null;
  const dn = normaalafstand(uitlaatemissieniveau);
  const uf = utilityFactor(actieradiusKm, dn);
  if (uf >= 0.99) return null; // te weinig brandstofaandeel over om terug te rekenen
  return { lPer100: Math.round((gewogenLPer100 / (1 - uf)) * 10) / 10, utilityFactor: uf, normaalafstandKm: dn };
}

/**
 * Energiekosten per jaar van een plug-in hybride bij een eigen aandeel elektrisch rijden.
 * @param aandeelElektrisch 0–1, het deel van de km op stroom (jouw laadgedrag, niet de WLTP-aanname)
 */
export function energiekostenPhevPerJaar(p: {
  kmPerJaar: number;
  aandeelElektrisch: number;
  kwhPer100: number;
  prijsPerKwh: number;
  lPer100LegeAccu: number;
  prijsPerLiter: number;
}): { stroom: number; brandstof: number; totaal: number } {
  if (p.aandeelElektrisch < 0 || p.aandeelElektrisch > 1) throw new Error("aandeelElektrisch moet tussen 0 en 1 liggen");
  const stroom = rond2(((p.kmPerJaar * p.aandeelElektrisch * p.kwhPer100) / 100) * p.prijsPerKwh);
  const brandstof = rond2(((p.kmPerJaar * (1 - p.aandeelElektrisch) * p.lPer100LegeAccu) / 100) * p.prijsPerLiter);
  return { stroom, brandstof, totaal: rond2(stroom + brandstof) };
}
