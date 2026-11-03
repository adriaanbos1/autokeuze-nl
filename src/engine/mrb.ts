import { regels, type Provincie, type Staffel } from "@/regels/regels-nl";
import { rond2 } from "./geld";

export type Brandstof = "benzine" | "diesel" | "elektrisch" | "waterstof" | "overig";

export interface MrbInvoer {
  /** Massa rijklaar in kg, zoals op het kentekenbewijs / RDW (veld `massa_rijklaar`). */
  massaRijklaar: number;
  brandstof: Brandstof;
  provincie: Provincie;
  /** Kalenderjaar waarvoor je de MRB wilt weten (bepaalt de EV-korting). */
  jaar: number;
  /** Alleen diesel: true als de auto boven de fijnstofgrens zit (geen roetfilter geregistreerd). */
  dieselZonderRoetfilter?: boolean;
}

export interface MrbUitkomst {
  perKwartaal: number;
  perJaar: number;
  posten: { rijksdeel: number; brandstoftoeslag: number; fijnstoftoeslag: number; opcenten: number; kortingFactor: number };
}

/** Massa afronden op het naaste honderdtal kg; precies 50 kg gaat naar beneden (art. 22 Wet MRB). */
export function rondMassa(kg: number): number {
  const rest = kg % 100;
  return rest <= 50 ? kg - rest : kg - rest + 100;
}

export function staffelBedrag(staffel: Staffel, massa: number): number {
  for (const [tm, bedrag] of staffel.klassen) {
    if (massa <= tm) return bedrag;
  }
  // de laatste lineaire regel waarvan `vanaf` ≤ massa
  const regel = [...staffel.lineair].reverse().find((r) => massa >= r.vanaf) ?? staffel.lineair[0];
  const stappen = Math.max(0, (massa - regel.vanaf) / 100);
  return rond2(regel.basis + stappen * regel.perHonderdKg);
}

/** Factor voor emissievrije auto's in een kalenderjaar (1 = geen korting). */
export function emissievrijFactor(jaar: number): number {
  const tabel = regels.mrb.emissievrijPercentage.waarde;
  if (jaar < 2026) throw new Error(`MRB vóór 2026 wordt niet ondersteund (jaar ${jaar})`);
  return tabel[jaar] ?? 1;
}

/**
 * Motorrijtuigenbelasting voor een personenauto.
 * Rijksdeel + brandstoftoeslag (+ fijnstoftoeslag) + provinciale opcenten,
 * eventueel met de korting voor emissievrije auto's; totaal per kwartaal
 * naar beneden afgerond op hele euro's.
 */
export function mrbPersonenauto(invoer: MrbInvoer): MrbUitkomst {
  // Tabel geldt vanaf 1-7-2026 op massa rijklaar; tot 1-7 gold eigen massa (= rijklaar − 100) met gelijke bedragen.
  const m = rondMassa(invoer.massaRijklaar);
  const rijksdeel = staffelBedrag(regels.mrb.personenautoBasis.waarde, m);

  let brandstoftoeslag = 0;
  if (invoer.brandstof === "diesel") brandstoftoeslag = staffelBedrag(regels.mrb.toeslagDiesel.waarde, m);
  if (invoer.brandstof === "overig") brandstoftoeslag = staffelBedrag(regels.mrb.toeslagOverig.waarde, m);

  const fijnstoftoeslag =
    invoer.brandstof === "diesel" && invoer.dieselZonderRoetfilter
      ? rond2((rijksdeel + brandstoftoeslag) * regels.mrb.fijnstoftoeslagDiesel.waarde)
      : 0;

  const opcentenPct = regels.mrb.opcenten2026.waarde[invoer.provincie];
  // Opcenten niet tussentijds afronden: de Belastingdienst rondt pas het totaal af
  // (gecontroleerd tegen de rekentool, zie tests/mrb-belastingdienst.test.ts).
  const opcentenExact = (staffelBedrag(regels.mrb.opcentenGrondslag.waarde, m) * opcentenPct) / 100;

  const emissievrij = invoer.brandstof === "elektrisch" || invoer.brandstof === "waterstof";
  const kortingFactor = emissievrij ? emissievrijFactor(invoer.jaar) : 1;

  const perKwartaal = Math.floor((rijksdeel + brandstoftoeslag + fijnstoftoeslag + opcentenExact) * kortingFactor + 1e-9);
  return {
    perKwartaal,
    perJaar: perKwartaal * 4,
    posten: { rijksdeel, brandstoftoeslag, fijnstoftoeslag, opcenten: rond2(opcentenExact), kortingFactor },
  };
}
