// DGA met een bv: auto in de bv of auto privé met €0,25 per zakelijke km van de bv
// (docs/methodiek.md §1.4a). Alles in euro's privé per jaar, gemiddeld over de looptijd.
// De belastingeffecten komen binnen als functies, zodat de app exact rekent en de tests
// met vaste percentages na te rekenen zijn.
import { regels } from "@/regels/regels-nl";
import { rond2, som, type Post } from "./geld";
import { gemiddeldeBijtelling, gemiddeldeBtwCorrectie, kiaPerJaar, type ZzpAuto } from "./zzp";

export type DgaVorm = "autoInBv" | "autoPriveKmVergoeding";

export interface DgaSituatie {
  zakelijkeKm: number;
  priveKm: number;
  btwPlichtigBv: boolean;
  rendement: number;
  /** Minder Vpb door x euro aftrekbare kosten in de bv. */
  vpbVoordeel: (x: number) => number;
  /** Minder box 2-belasting als het dividend x euro lager is. */
  box2Voordeel: (x: number) => number;
  /** Extra loonheffing voor de DGA door x euro bijtelling. */
  extraLoonheffing: (x: number) => number;
  /** Pseudo-eindheffing die de bv per jaar betaalt (gemiddeld over de looptijd). */
  pseudoEindheffing: number;
  pseudoEindheffingAftrekbaar: boolean;
}

export interface DgaUitkomst {
  vorm: DgaVorm;
  nettoPerJaar: number;
  nettoPerMaand: number;
  posten: Post[];
}

const btw = regels.zakelijk.btwTarief.waarde;
const eur = (x: number) => `€${Math.round(x).toLocaleString("nl-NL")}`;

export function dgaVarianten(a: ZzpAuto, s: DgaSituatie): DgaUitkomst[] {
  const n = a.looptijdJaren;
  const terug = s.btwPlichtigBv;
  const terugAanschaf = terug && a.btwOpFactuur;
  const excl = (x: number, ja: boolean) => (ja ? rond2(x / (1 + btw)) : x);
  const aanschaf = excl(a.aankoopprijs, terugAanschaf);
  const rest = excl(a.restwaardeEinde, terugAanschaf);

  // ── Auto in de bv
  const aftrekbaar: Post[] = [
    { label: "Afschrijving", bedrag: rond2((aanschaf - rest) / n), uitleg: `(${eur(aanschaf)} − ${eur(rest)}) / ${n} jaar${terugAanschaf ? ", excl. btw" : ""}` },
    { label: "Energie", bedrag: excl(a.energie, terug), uitleg: terug ? "excl. btw" : "incl. btw" },
    { label: "MRB", bedrag: a.mrb, uitleg: "" },
    { label: "Verzekering", bedrag: a.verzekering, uitleg: "" },
    { label: "Onderhoud en banden", bedrag: excl(a.onderhoud, terug), uitleg: terug ? "excl. btw" : "incl. btw" },
  ];
  const pseudo: Post = { label: "Pseudo-eindheffing (bv)", bedrag: s.pseudoEindheffing, uitleg: s.pseudoEindheffing ? "12% van de catalogusprijs, gemiddeld per jaar over de looptijd (auto met CO₂-uitstoot)" : "niet van toepassing (elektrisch, of in gebruik vóór 2027 en overgangsregeling)" };
  if (s.pseudoEindheffingAftrekbaar) aftrekbaar.push(pseudo);
  const kosten = som(...aftrekbaar.map((p) => p.bedrag));
  // KIA werkt ook in de Vpb (bestelauto; personenauto's zijn uitgesloten).
  const kia = a.kiaToegestaan ? kiaPerJaar(aanschaf, rest, n) : null;
  const vpb = rond2(s.vpbVoordeel(kosten + (kia?.perJaar ?? 0)));
  const gemist = rond2(((aanschaf + rest) / 2) * s.rendement);
  const btwCorrectie = gemiddeldeBtwCorrectie(a, { zakelijkeKm: s.zakelijkeKm, priveKm: s.priveKm, btwPlichtig: terug, rendement: s.rendement, belastingvoordeel: () => 0 }, terugAanschaf);
  const bvNetto = som(kosten, -vpb, gemist, btwCorrectie, s.pseudoEindheffingAftrekbaar ? 0 : s.pseudoEindheffing);
  const box2Bv = rond2(s.box2Voordeel(bvNetto));
  const bijtelling = gemiddeldeBijtelling(a, s.priveKm);
  const loonheffing = rond2(s.extraLoonheffing(bijtelling));
  const inBv = som(bvNetto, -box2Bv, loonheffing);

  // ── Auto privé, bv vergoedt €0,25 per zakelijke km (onbelast)
  const vergoeding = rond2(s.zakelijkeKm * regels.zakelijk.kilometervergoeding.waarde);
  const priveKosten: Post[] = [
    { label: "Afschrijving", bedrag: rond2((a.aankoopprijs - a.restwaardeEinde) / n), uitleg: "incl. btw" },
    { label: "Energie", bedrag: a.energie, uitleg: "incl. btw" },
    { label: "MRB", bedrag: a.mrb, uitleg: "" },
    { label: "Verzekering", bedrag: a.verzekering, uitleg: "" },
    { label: "Onderhoud en banden", bedrag: a.onderhoud, uitleg: "incl. btw" },
    { label: "Gemist rendement", bedrag: rond2(((a.aankoopprijs + a.restwaardeEinde) / 2) * s.rendement), uitleg: `${(s.rendement * 100).toLocaleString("nl-NL")}% over het gemiddeld vastgezette geld` },
  ];
  const bvVergoedingNetto = som(vergoeding, -rond2(s.vpbVoordeel(vergoeding)));
  const box2Prive = rond2(s.box2Voordeel(bvVergoedingNetto));
  const prive = som(...priveKosten.map((p) => p.bedrag), -vergoeding, bvVergoedingNetto, -box2Prive);

  return [
    {
      vorm: "autoInBv",
      nettoPerJaar: inBv,
      nettoPerMaand: rond2(inBv / 12),
      posten: [
        ...aftrekbaar,
        ...(kia ? [{ label: "KIA (aftrekpost, geen kosten)", bedrag: 0, uitleg: `${kia.uitleg}: ${eur(kia.perJaar)} per jaar` }] : []),
        { label: "Minder Vpb", bedrag: -vpb, uitleg: `door ${eur(kosten + (kia?.perJaar ?? 0))} aftrek (kosten${kia ? " + KIA" : ""})` },
        { label: "Gemist rendement (bv)", bedrag: gemist, uitleg: `${(s.rendement * 100).toLocaleString("nl-NL")}% over het gemiddeld vastgezette geld` },
        { label: "Btw-correctie privégebruik", bedrag: btwCorrectie, uitleg: btwCorrectie ? "forfait over de catalogusprijs, gemiddeld" : "niet van toepassing" },
        ...(s.pseudoEindheffingAftrekbaar ? [] : [pseudo]),
        { label: "Minder box 2 (lager dividend)", bedrag: -box2Bv, uitleg: `de bv keert ${eur(bvNetto)} minder dividend uit` },
        { label: "Loonheffing over bijtelling", bedrag: loonheffing, uitleg: bijtelling ? `bijtelling gemiddeld ${eur(bijtelling)} per jaar, niet begrensd (anders dan bij de IB-ondernemer)` : "≤ 500 km privé: geen bijtelling" },
      ],
    },
    {
      vorm: "autoPriveKmVergoeding",
      nettoPerJaar: prive,
      nettoPerMaand: rond2(prive / 12),
      posten: [
        ...priveKosten,
        { label: "Km-vergoeding van de bv (onbelast)", bedrag: -vergoeding, uitleg: `${s.zakelijkeKm.toLocaleString("nl-NL")} km × €${regels.zakelijk.kilometervergoeding.waarde.toLocaleString("nl-NL")}` },
        { label: "Kosten voor de bv na Vpb", bedrag: bvVergoedingNetto, uitleg: "de vergoeding is aftrekbaar in de bv" },
        { label: "Minder box 2 (lager dividend)", bedrag: -box2Prive, uitleg: `de bv keert ${eur(bvVergoedingNetto)} minder dividend uit` },
      ],
    },
  ];
}
