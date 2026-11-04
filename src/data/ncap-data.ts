import ncap from "../../data/euro-ncap.json";
import { geldendeUitslag, veiligheidsScore } from "@/engine/veiligheid";

export interface NcapRij {
  url: string;
  sterren: number;
  testjaar: number;
  publicatiedatum: string | null;
  verlopen: boolean;
  veiligheidspakket: boolean;
  geldtVoor: string | null;
  geteestModel: string | null;
}

const modellen = ncap.modellen as Record<string, { gezocht: string[]; uitslagen: NcapRij[] }>;

export const ncapHerkomst = { bron: ncap.bron, peildatum: ncap.peildatum, voorwaarden: ncap.voorwaarden };

/** Geldende Euro NCAP-uitslag en score voor een model (id uit data/modelselectie.json). */
export function veiligheidModel(id: string, peiljaar = Number(ncap.peildatum.slice(0, 4))) {
  const uitslagen = modellen[id]?.uitslagen ?? [];
  const geldend = geldendeUitslag(uitslagen);
  return geldend ? { geldend, score: veiligheidsScore(geldend, peiljaar), alle: uitslagen } : null;
}

/**
 * Voor een bestaande auto (kentekencheck): de nieuwste test van vóór of uit het
 * bouwjaar, want een latere test gaat meestal over een nieuwere generatie.
 * Geen oudere test → de oudste die er is, met die kanttekening in de app.
 */
export function ncapVoorBouwjaar(id: string, bouwjaar: number) {
  const uitslagen = modellen[id]?.uitslagen ?? [];
  const passend = geldendeUitslag(uitslagen.filter((u) => u.testjaar <= bouwjaar));
  if (passend) return { uitslag: passend, laterGetest: false };
  const oudste = [...uitslagen].sort((a, b) => a.testjaar - b.testjaar)[0];
  return oudste ? { uitslag: oudste, laterGetest: true } : null;
}
