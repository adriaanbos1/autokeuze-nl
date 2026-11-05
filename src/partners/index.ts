/**
 * Partnerlinks (affiliate), voorbereid maar NIET actief (besluit 90).
 *
 * Borging van neutraliteit (docs/methodiek.md §7):
 * - Deze module staat los van de rekencode. Niets in src/engine, src/data of src/regels
 *   importeert hieruit; tests/partners.test.ts controleert dat.
 * - Eenrichtingsverkeer: de module krijgt alleen de model-id's van de getoonde auto's
 *   (strings), nooit de intake, scores of bedragen, en kan de ranglijst dus niet wijzigen.
 * - Geen gegevens naar partners (Wft, docs/regels-nl.md §8): een link is een vaste URL uit de
 *   config, met hooguit de model-id ingevuld. Andere plaatshouders worden geweigerd.
 * - Elke link heet "Partnerlink"; er staat altijd een neutrale optie bij; volgorde alfabetisch
 *   op partnernaam, nooit op vergoeding.
 */

export type PartnerSoort = "private lease" | "financiering" | "verzekering" | "dealer" | "occasions";

export interface Partner {
  naam: string;
  soort: PartnerSoort;
  /** Vaste URL; alleen de plaatshouder {model} is toegestaan. */
  url: string;
  /** Optioneel: alleen tonen bij deze model-id's; leeg = bij elke auto. */
  modellen?: string[];
}

export interface PartnerLink {
  label: "Partnerlink";
  naam: string;
  soort: PartnerSoort;
  url: string;
}

export interface PartnerBlok {
  modelId: string;
  links: PartnerLink[];
  /** Altijd aanwezig: zelf zoeken zonder partner. */
  neutraal: string;
}

/** Er zijn geen partners. Deze lijst blijft leeg tot de juridische toets (Wft) en een besluit van Adriaan. */
export const partners: readonly Partner[] = [];

export const NEUTRALE_OPTIE = "Je kunt ook zelf zoeken bij een aanbieder naar keuze; wij ontvangen dan niets.";

const TOEGESTAAN = /\{model\}/g;

/** Gooit een fout als de URL iets anders dan {model} probeert in te vullen of geen https is. */
export function controleerUrl(url: string): void {
  if (!url.startsWith("https://")) throw new Error(`Partnerlink moet https zijn: ${url}`);
  const rest = url.replace(TOEGESTAAN, "");
  if (/[{}]/.test(rest)) throw new Error(`Partnerlink mag alleen {model} invullen, geen andere gegevens: ${url}`);
}

/** Partnerlinks per getoonde auto. Krijgt alleen model-id's; de ranglijst is dan al klaar. */
export function partnerBlokken(modelIds: readonly string[], config: readonly Partner[] = partners): PartnerBlok[] {
  for (const p of config) controleerUrl(p.url);
  const opNaam = [...config].sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  return modelIds.map((id) => ({
    modelId: id,
    links: opNaam
      .filter((p) => !p.modellen?.length || p.modellen.includes(id))
      .map((p) => ({ label: "Partnerlink" as const, naam: p.naam, soort: p.soort, url: p.url.replace(TOEGESTAAN, encodeURIComponent(id)) })),
    neutraal: NEUTRALE_OPTIE,
  }));
}
