import { regels } from "@/regels/regels-nl";
import { rond2, som, type Post } from "./geld";
import { bijtellingPerJaar, type Aandrijving } from "./bijtelling";

const nl = (x: number, decimalen = 2) => x.toLocaleString("nl-NL", { maximumFractionDigits: decimalen });

/**
 * ZZP'er / eenmanszaak: auto zakelijk (ondernemingsvermogen) of privé
 * met €0,25 per zakelijke km. Alle bedragen per jaar.
 */
export interface ZzpInvoer {
  /** Aankoopprijs incl. btw (bij een nieuwe auto meestal gelijk aan de cataloguswaarde). */
  aankoopprijsIncl: number;
  restwaardeEindeIncl: number;
  looptijdJaren: number;
  cataloguswaarde: number;
  aandrijving: Aandrijving;
  jaarEersteToelating: number;
  /** Lopende kosten per jaar, incl. btw waar van toepassing. */
  energieIncl: number;
  onderhoudIncl: number;
  /** Zonder btw (MRB, verzekering met assurantiebelasting). */
  mrb: number;
  verzekering: number;
  zakelijkeKm: number;
  priveKm: number;
  /** Effectief tarief over winst (zie belasting.ts). */
  tarief: number;
  btwPlichtig: boolean;
}

export interface ZzpVariant {
  nettoPerJaar: number;
  nettoPerMaand: number;
  posten: Post[];
}

export function zzpZakelijk(z: ZzpInvoer): ZzpVariant {
  const btw = z.btwPlichtig ? 1 + regels.zakelijk.btwTarief.waarde : 1;
  const afschrijving = rond2((z.aankoopprijsIncl - z.restwaardeEindeIncl) / btw / z.looptijdJaren);
  const energie = rond2(z.energieIncl / btw);
  const onderhoud = rond2(z.onderhoudIncl / btw);
  const kosten = som(afschrijving, energie, z.mrb, z.verzekering, onderhoud);

  const geenBijtelling = z.priveKm <= regels.bijtelling.grensPriveKm.waarde;
  const bijtellingVol = geenBijtelling ? 0 : bijtellingPerJaar(z).perJaar;
  // Bij een IB-ondernemer is de bijtelling begrensd tot de werkelijke autokosten.
  const bijtelling = Math.min(bijtellingVol, kosten);
  const belastingvoordeel = rond2((kosten - bijtelling) * z.tarief);

  // Forfaitaire btw-correctie privégebruik; bij (nagenoeg) geen privégebruik niet toegepast.
  const btwCorrectie =
    z.btwPlichtig && !geenBijtelling ? rond2(z.cataloguswaarde * regels.zakelijk.btwCorrectiePrivegebruik.waarde.standaard) : 0;

  const nettoPerJaar = som(kosten, -belastingvoordeel, btwCorrectie);
  return {
    nettoPerJaar,
    nettoPerMaand: rond2(nettoPerJaar / 12),
    posten: [
      { label: "Afschrijving", bedrag: afschrijving, uitleg: z.btwPlichtig ? "excl. btw" : "incl. btw" },
      { label: "Energie", bedrag: energie, uitleg: z.btwPlichtig ? "excl. btw" : "incl. btw" },
      { label: "MRB", bedrag: z.mrb, uitleg: "" },
      { label: "Verzekering", bedrag: z.verzekering, uitleg: "" },
      { label: "Onderhoud", bedrag: onderhoud, uitleg: z.btwPlichtig ? "excl. btw" : "incl. btw" },
      {
        label: "Bijtelling (begrensd tot kosten)",
        bedrag: bijtelling,
        uitleg: geenBijtelling ? "≤ 500 km privé: geen bijtelling" : `volle bijtelling €${nl(bijtellingVol)}`,
      },
      { label: "Belastingvoordeel", bedrag: 0 - belastingvoordeel, uitleg: `(kosten − bijtelling) × ${nl(z.tarief * 100, 1)}%` },
      { label: "Btw-correctie privégebruik", bedrag: btwCorrectie, uitleg: "2,7% × cataloguswaarde" },
    ],
  };
}

export function zzpPrive(z: ZzpInvoer): ZzpVariant {
  const afschrijving = rond2((z.aankoopprijsIncl - z.restwaardeEindeIncl) / z.looptijdJaren);
  const kosten = som(afschrijving, z.energieIncl, z.mrb, z.verzekering, z.onderhoudIncl);
  const kmAftrek = rond2(z.zakelijkeKm * regels.zakelijk.kilometervergoeding.waarde);
  const belastingvoordeel = rond2(kmAftrek * z.tarief);
  const nettoPerJaar = som(kosten, -belastingvoordeel);
  return {
    nettoPerJaar,
    nettoPerMaand: rond2(nettoPerJaar / 12),
    posten: [
      { label: "Afschrijving", bedrag: afschrijving, uitleg: "incl. btw" },
      { label: "Energie", bedrag: z.energieIncl, uitleg: "incl. btw" },
      { label: "MRB", bedrag: z.mrb, uitleg: "" },
      { label: "Verzekering", bedrag: z.verzekering, uitleg: "" },
      { label: "Onderhoud", bedrag: z.onderhoudIncl, uitleg: "incl. btw" },
      { label: "Belastingvoordeel km-aftrek", bedrag: 0 - belastingvoordeel, uitleg: `${nl(z.zakelijkeKm)} km × €${nl(regels.zakelijk.kilometervergoeding.waarde)} × ${nl(z.tarief * 100, 1)}%` },
    ],
  };
}
