// Toegang van bestelauto's tot zero-emissiezones voor stadslogistiek (docs/regels-nl.md §9).
// Personenauto's vallen er niet onder. Gemeenten bepalen zelf of en waar ze een zone hebben.
import { regels } from "@/regels/regels-nl";

export interface ZeInvoer {
  elektrisch: boolean;
  /** Euro-klasse uit het kentekenregister (bijv. "EURO 6 EA", "EURO VI E"), of null. */
  emissieklasse: string | null;
  jaarEersteToelating: number;
}

/** Euronorm als getal (5, 6) uit de RDW-omschrijving; null als onbekend. */
export function euronorm(klasse: string | null): number | null {
  const m = /EURO\s*(VI|V|IV|\d)/i.exec(klasse ?? "");
  if (!m) return null;
  return { IV: 4, V: 5, VI: 6 }[m[1].toUpperCase()] ?? Number(m[1]);
}

/** Laatste kalenderjaar waarin de bestelauto een ZE-zone in mag; Infinity = altijd, null = nooit. */
export function zeToegangTot(b: ZeInvoer): number | null {
  if (b.elektrisch) return Infinity;
  const r = regels.zezone.overgang.waarde;
  if (b.jaarEersteToelating >= r.fossielNieuwVanaf) return null;
  const norm = euronorm(b.emissieklasse);
  if (norm === 6) return r.euro6TotEnMet;
  if (norm === 5) return r.euro5TotEnMet;
  return null;
}
