/**
 * Register van alle regels en aannames: één platte lijst met bron, ingangsdatum,
 * peildatum en status. Gebruikt door de publieke methodiekpagina en door de
 * jaarlijkse regelcheck (docs/checklist-regelupdate.md).
 */
import { aannames } from "./aannames";
import { regels } from "./regels-nl";

export type Label = "vastgesteld" | "aangekondigd" | "onzeker" | "bron" | "aanname";

export interface RegisterRegel {
  /** Pad in het configbestand, bijv. "mrb.personenautoBasis". */
  pad: string;
  bestand: "regels-nl.ts" | "aannames.ts";
  groep: string;
  naam: string;
  label: Label;
  bron: string;
  /** Eerste URL in de bron, voor een klikbare link. */
  url: string | null;
  geldigVanaf: string;
  peildatum: string;
  toelichting?: string;
}

const GROEPEN: Record<string, string> = {
  mrb: "Motorrijtuigenbelasting",
  bpm: "BPM",
  bijtelling: "Bijtelling",
  pseudoEindheffingOvergang: "Pseudo-eindheffing",
  pseudoEindheffing: "Pseudo-eindheffing",
  zakelijk: "Zakelijk",
  zezone: "Zero-emissiezones",
  dga: "DGA en bv",
  vpb: "Vennootschapsbelasting",
  box1: "Inkomstenbelasting box 1",
  box2: "Inkomstenbelasting box 2",
  kia: "Kleinschaligheidsinvesteringsaftrek",
  krediet: "Krediet",
  wltp: "Verbruik (WLTP)",
  onderhoud: "Onderhoud",
  restwaarde: "Restwaarde",
  banden: "Banden",
  energie: "Energie",
  geld: "Geld",
  financiering: "Financiering",
  privateLease: "Private lease",
  verzekering: "Verzekering",
};

/** "personenautoBasis" → "personenauto basis". */
const leesbaar = (s: string) => s.replace(/([a-z])([A-Z0-9])/g, "$1 $2").toLowerCase();

const isRegel = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && "waarde" in x && "bron" in x && "geldigVanaf" in x;

function verzamel(obj: Record<string, unknown>, bestand: RegisterRegel["bestand"], pad: string[] = []): RegisterRegel[] {
  const uit: RegisterRegel[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = [...pad, k];
    if (isRegel(v)) {
      const bron = String(v.bron);
      uit.push({
        pad: p.join("."),
        bestand,
        groep: GROEPEN[p[0]] ?? leesbaar(p[0]),
        naam: p.length > 1 ? leesbaar(p.slice(1).join(" ")) : leesbaar(p[0]),
        label: (v.status ?? v.soort) as Label,
        bron,
        url: bron.match(/https?:\/\/[^\s)]+/)?.[0] ?? null,
        geldigVanaf: String(v.geldigVanaf),
        peildatum: String(v.peildatum),
        toelichting: v.toelichting ? String(v.toelichting) : undefined,
      });
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      uit.push(...verzamel(v as Record<string, unknown>, bestand, p));
    }
  }
  return uit;
}

export const register: RegisterRegel[] = [...verzamel(regels, "regels-nl.ts"), ...verzamel(aannames, "aannames.ts")];

/** Regels die bij de jaarlijkse check aandacht vragen: onzeker, aangekondigd, of peildatum ouder dan `maanden`. */
export function aandachtspunten(vandaag: string, maanden = 12) {
  const grens = new Date(vandaag);
  grens.setMonth(grens.getMonth() - maanden);
  const iso = grens.toISOString().slice(0, 10);
  return {
    onzeker: register.filter((r) => r.label === "onzeker"),
    aangekondigd: register.filter((r) => r.label === "aangekondigd"),
    verouderd: register.filter((r) => r.peildatum < iso),
    zonderLink: register.filter((r) => !r.url && r.label !== "aanname"),
  };
}
