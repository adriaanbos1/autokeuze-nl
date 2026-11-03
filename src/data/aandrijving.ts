import type { Brandstof } from "@/engine/mrb";
import type { Aandrijvingstype } from "./types";

/** Eén regel uit de RDW-dataset "Gekentekende voertuigen brandstof" (8ys7-d773). */
export type RdwBrandstofRij = Record<string, string | undefined>;

/**
 * Aandrijving uit de brandstofregels van één kenteken. "hybride" volgt de
 * RDW-klasse NOVC-HEV en omvat daarom ook mild-hybrides.
 */
export function aandrijvingUitRdw(brandstoffen: RdwBrandstofRij[]): Aandrijvingstype | null {
  const soorten = brandstoffen.map((b) => b.brandstof_omschrijving);
  const hybride = brandstoffen.map((b) => b.klasse_hybride_elektrisch_voertuig).find(Boolean);
  if (hybride === "OVC-HEV") return "plug-in hybride";
  if (hybride === "NOVC-HEV") return "hybride";
  if (soorten.length === 1 && soorten[0] === "Elektriciteit") return "elektrisch";
  if (soorten.includes("Diesel")) return "diesel";
  if (soorten.includes("LPG")) return "lpg";
  if (soorten.includes("Benzine")) return "benzine";
  return null;
}

/** Brandstofsoort voor de MRB-berekening. */
export function mrbBrandstof(brandstoffen: RdwBrandstofRij[]): Brandstof {
  const soorten = brandstoffen.map((b) => b.brandstof_omschrijving);
  if (soorten.length > 0 && soorten.every((s) => s === "Elektriciteit")) return "elektrisch";
  if (soorten.length > 0 && soorten.every((s) => s === "Waterstof" || s === "Elektriciteit")) return "waterstof";
  if (soorten.includes("Diesel")) return "diesel";
  if (soorten.some((s) => s === "LPG" || s === "CNG" || s === "LNG")) return "overig";
  return "benzine";
}
