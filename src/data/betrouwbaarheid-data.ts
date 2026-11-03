import apk from "../../data/apk-gebreken.json";
import { betrouwbaarheid, type BetrouwbaarheidUitkomst, type Tellingen } from "@/engine/betrouwbaarheid";

type Meting = { auto: number; perLeeftijd: Record<string, { keuringen: number; metGebrek: number }> };

function naarTellingen(perJaar: Record<string, Meting>): Tellingen {
  const uit: Tellingen = {};
  for (const [j, m] of Object.entries(perJaar)) {
    uit[Number(j)] = {};
    for (const [l, t] of Object.entries(m.perLeeftijd)) uit[Number(j)][Number(l)] = t;
  }
  return uit;
}

const landelijk = naarTellingen(apk.landelijk as Record<string, Meting>);
const modellen = apk.modellen as Record<string, Record<string, Meting>>;

export const apkHerkomst = { bron: apk.bron, peildatum: apk.peildatum, venster: apk.venster, methode: apk.methode };

/** Score voor een model (id uit data/modelselectie.json), optioneel alleen voor bepaalde bouwjaren. */
export function betrouwbaarheidModel(id: string, bouwjaren?: number[]): BetrouwbaarheidUitkomst | null {
  const m = modellen[id];
  return m ? betrouwbaarheid(naarTellingen(m), landelijk, bouwjaren) : null;
}
