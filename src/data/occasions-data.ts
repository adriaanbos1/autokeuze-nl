import occ from "../../data/occasions-rdw.json";
import type { UitvoeringRdw } from "./types";

// Specificaties per model en bouwjaar (scripts/haal-occasions.ts).
const modellen = occ.modellen as unknown as Record<string, { bouwjaar: number; uitvoeringen: UitvoeringRdw[] }[]>;

export const occasionHerkomst = { bron: occ.bron, peildatum: occ.peildatum, methode: occ.methode, bouwjaren: occ.bouwjaren, verhoudingen: occ.verhoudingen };

export function occasionJaren(id: string) {
  return modellen[id] ?? [];
}
