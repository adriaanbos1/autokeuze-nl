// Van intake naar ranglijst (docs/methodiek.md §1 en §3). Koppelt de dataset
// aan de engine. Deze module kent geen partnerdata: de volgorde hangt alleen af
// van de modeldata, jouw antwoorden en de openbare ankers en gewichten.
import rdw from "../../data/modellen-rdw.json";
import type { ModelRdw, UitvoeringRdw, Aandrijvingstype } from "./types";
import { betrouwbaarheidModel } from "./betrouwbaarheid-data";
import { veiligheidModel } from "./ncap-data";
import { aannames } from "@/regels/aannames";
import { ankers, CRITERIA, type Criterium, type Profiel } from "@/regels/methodiek";
import type { Provincie } from "@/regels/regels-nl";
import {
  afschrijvingOverLooptijd,
  bandenPerJaar,
  eindscore,
  energiekostenPerJaar,
  energiekostenPhevPerJaar,
  gemiddeldeLaadprijs,
  grootsteAchterstand,
  lineaireScore,
  mrbPersonenauto,
  onderhoudPerJaar,
  rond2,
  sterkEnZwak,
  tcoContant,
  vergelijk,
  verzekeringPerJaar,
  type CriteriumScore,
  type Dekking,
  type Eindscore,
  type Gewichten,
  type Scores,
  type TcoUitkomst,
} from "@/engine";

export const alleModellen = rdw.modellen as ModelRdw[];
export const datasetPeildatum = rdw.peildatum;

export interface Intake {
  profiel: Profiel;
  kmPerJaar: number;
  /** Langste rit die je regelmatig maakt, enkele reis. */
  langsteRitKm: number;
  /** Wat de auto per maand mag kosten, alles inbegrepen. */
  maandbudget: number;
  maxAankoopprijs: number | null;
  personen: number;
  kinderen: boolean;
  thuisladen: boolean;
  /** Benodigd trekgewicht (geremd) in kg; 0 = geen aanhanger. */
  trekgewicht: number;
  provincie: Provincie;
  /** Hoe lang je de auto houdt. */
  looptijdMaanden: number;
  aandrijvingen: Aandrijvingstype[];
  dekking: Dekking;
  eigenPremiePerMaand: number | null;
  /** Kalenderjaar van aankoop (bepaalt MRB en of een model nog nieuw leverbaar is). */
  startjaar: number;
}

export const gezinsprofiel = (i: Pick<Intake, "personen" | "kinderen">) => i.kinderen || i.personen >= 3;

const nl = (x: number, decimalen = 3) => x.toLocaleString("nl-NL", { maximumFractionDigits: decimalen });
const eur0 = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export interface Kosten {
  tco: TcoUitkomst;
  aankoopprijs: number;
  restwaardeEinde: number;
  energiePerJaar: number;
  energieUitleg: string;
  onderhoudEnBandenPerMaand: number;
  co2GPerKm: number | null;
  co2Uitleg: string;
}

function laadprijs(thuisladen: boolean): { prijs: number; uitleg: string } {
  const e = aannames.energie;
  const mix = e.laadmix.waarde[thuisladen ? "metThuisladen" : "zonderThuisladen"];
  const prijs = gemiddeldeLaadprijs({
    ...mix,
    prijsThuis: e.stroomThuisPerKwh.waarde,
    prijsPubliek: e.publiekLadenPerKwh.waarde,
    prijsSnel: e.snelladenPerKwh.waarde,
  });
  const delen = [
    mix.thuis && `${mix.thuis * 100}% thuis à €${nl(e.stroomThuisPerKwh.waarde, 2)}`,
    mix.publiek && `${mix.publiek * 100}% publiek à €${nl(e.publiekLadenPerKwh.waarde, 2)}`,
    mix.snel && `${mix.snel * 100}% snel à €${nl(e.snelladenPerKwh.waarde, 2)}`,
  ].filter(Boolean);
  return { prijs, uitleg: `gemiddeld €${nl(prijs)} per kWh (${delen.join(", ")})` };
}

/** Energie per jaar en CO₂ bij jouw gebruik; null als de data ontbreekt. */
function energie(u: UitvoeringRdw, i: Intake): { perJaar: number; uitleg: string; co2: number | null; co2Uitleg: string } | null {
  const pomp = aannames.energie.pompprijs.waarde;
  if (u.verbruikWltp == null) return null;
  if (u.aandrijving === "elektrisch") {
    const l = laadprijs(i.thuisladen);
    return {
      perJaar: energiekostenPerJaar(i.kmPerJaar, u.verbruikWltp, l.prijs),
      uitleg: `${nl(i.kmPerJaar)} km × ${nl(u.verbruikWltp)} kWh/100 km (WLTP), ${l.uitleg}`,
      co2: 0,
      co2Uitleg: "elektrisch: geen uitstoot uit de uitlaat",
    };
  }
  if (u.aandrijving === "plug-in hybride") {
    if (u.elektrischVerbruikWltp == null) return null;
    const l = laadprijs(true);
    const officieel = u.verbruikGewogenWltp != null ? Math.max(0, Math.min(1, 1 - u.verbruikGewogenWltp / u.verbruikWltp)) : null;
    const aandeel = i.thuisladen ? officieel : aannames.energie.phevAandeelElektrischZonderThuisladen.waarde;
    if (aandeel == null) return null;
    const k = energiekostenPhevPerJaar({
      kmPerJaar: i.kmPerJaar,
      aandeelElektrisch: aandeel,
      kwhPer100: u.elektrischVerbruikWltp,
      prijsPerKwh: l.prijs,
      lPer100LegeAccu: u.verbruikWltp,
      prijsPerLiter: pomp.benzine,
    });
    // CO₂ per liter uit de eigen WLTP-opgave van de auto (CO₂ gewogen / liter gewogen).
    const co2 = u.co2Wltp != null && u.verbruikGewogenWltp ? (u.co2Wltp / u.verbruikGewogenWltp) * u.verbruikWltp * (1 - aandeel) : null;
    return {
      perJaar: k.totaal,
      uitleg: `${Math.round(aandeel * 100)}% elektrisch${i.thuisladen ? " (officieel WLTP-aandeel)" : " (geen thuisladen: aanname)"}: stroom €${nl(k.stroom, 0)} + benzine ${nl(u.verbruikWltp)} l/100 km bij lege accu à €${nl(pomp.benzine)} = €${nl(k.brandstof, 0)} per jaar`,
      co2: co2 == null ? null : Math.round(co2),
      co2Uitleg: `WLTP-CO₂ per liter van deze auto × verbruik met lege accu × ${Math.round((1 - aandeel) * 100)}% brandstofkilometers`,
    };
  }
  const prijs = u.aandrijving === "diesel" ? pomp.diesel : u.aandrijving === "lpg" ? pomp.lpg : pomp.benzine;
  const soort = u.aandrijving === "diesel" ? "diesel" : u.aandrijving === "lpg" ? "lpg" : "benzine";
  return {
    perJaar: energiekostenPerJaar(i.kmPerJaar, u.verbruikWltp, prijs),
    uitleg: `${nl(i.kmPerJaar)} km × ${nl(u.verbruikWltp)} l/100 km (WLTP) × €${nl(prijs)} per liter ${soort} (CBS)`,
    co2: u.co2Wltp,
    co2Uitleg: "WLTP-opgave (RDW)",
  };
}

/** Jaren van de looptijd, voor MRB en onderhoud die per jaar verschillen. */
function jarenVan(i: Intake): number[] {
  return Array.from({ length: Math.ceil(i.looptijdMaanden / 12) }, (_, k) => k);
}

/** Kosten van een nieuwe auto over jouw looptijd, contant gekocht. Null als er data ontbreekt. */
export function kostenNieuw(u: UitvoeringRdw, i: Intake): Kosten | null {
  if (u.catalogusprijs == null || u.massaRijklaar == null) return null;
  const e = energie(u, i);
  if (!e) return null;
  const elektrisch = u.aandrijving === "elektrisch";
  const jaren = jarenVan(i);
  const brandstof = elektrisch ? "elektrisch" : u.aandrijving === "diesel" ? "diesel" : u.aandrijving === "lpg" ? "overig" : "benzine";

  const mrbJaar =
    jaren.reduce((s, k) => s + mrbPersonenauto({ massaRijklaar: u.massaRijklaar!, brandstof, provincie: i.provincie, jaar: i.startjaar + k }).perJaar, 0) /
    jaren.length;
  const onderhoudJaar =
    jaren.reduce((s, k) => s + onderhoudPerJaar({ elektrisch, kmPerJaar: i.kmPerJaar, leeftijdJaar: k }).bedrag, 0) / jaren.length;
  const banden = bandenPerJaar({ elektrisch, massaRijklaar: u.massaRijklaar, kmPerJaar: i.kmPerJaar }).bedrag;
  const verzekering = verzekeringPerJaar({ dekking: i.dekking, eigenPremiePerMaand: i.eigenPremiePerMaand }).bedrag;
  const rest = afschrijvingOverLooptijd({
    nieuwprijs: u.catalogusprijs,
    leeftijdNuMaanden: 0,
    kmNu: 0,
    looptijdMaanden: i.looptijdMaanden,
    kmPerJaar: i.kmPerJaar,
  });
  const onderhoudEnBanden = rond2((onderhoudJaar + banden) / 12);

  const tco = tcoContant({
    aankoopprijs: u.catalogusprijs,
    restwaardeEinde: rest.waardeEinde,
    maanden: i.looptijdMaanden,
    kmPerJaar: i.kmPerJaar,
    rendement: aannames.geld.gemistRendement.waarde,
    lopend: {
      energie: rond2(e.perJaar / 12),
      mrb: rond2(mrbJaar / 12),
      verzekering: rond2(verzekering / 12),
      onderhoudEnBanden,
    },
  });
  // Uitleg per post aanvullen met wat er voor deze auto echt in zit.
  const extra: Record<string, string> = {
    Energie: e.uitleg,
    Motorrijtuigenbelasting: `gemiddeld €${Math.round(mrbJaar)} per jaar over ${jaren.length} jaar (${i.provincie.replace(/(^|-)\w/g, (x) => x.toUpperCase())}, ${nl(u.massaRijklaar)} kg${elektrisch ? ", korting elektrisch loopt af" : ""})`,
    Verzekering: i.eigenPremiePerMaand != null ? "jouw eigen premie" : `marktgemiddelde ${i.dekking} (Geld.nl, H1 2026), gelijk voor elk model`,
    "Onderhoud en banden": `onderhoud gem. €${Math.round(onderhoudJaar)} + banden €${Math.round(banden)} per jaar (rekenmodel, indicatief)`,
    "Kosten van geld (gemist rendement)": `gemiddeld ${eur0((u.catalogusprijs + rest.waardeEinde) / 2)} vastgezet × ${nl(aannames.geld.gemistRendement.waarde * 100)}% rente die je misloopt / 12 (aanname)`,
    Afschrijving: `catalogusprijs ${eur0(u.catalogusprijs)} → geschatte waarde na ${i.looptijdMaanden} maanden ${eur0(rest.waardeEinde)} (generieke curve, niet per model)`,
  };
  tco.posten = tco.posten.map((p) => (extra[p.label] ? { ...p, uitleg: extra[p.label] } : p));

  return {
    tco,
    aankoopprijs: u.catalogusprijs,
    restwaardeEinde: rest.waardeEinde,
    energiePerJaar: e.perJaar,
    energieUitleg: e.uitleg,
    onderhoudEnBandenPerMaand: onderhoudEnBanden,
    co2GPerKm: e.co2,
    co2Uitleg: e.co2Uitleg,
  };
}

/** Harde eisen: geven geen punten, maar sluiten uit. Lege lijst = voldoet. */
export function hardeEisen(u: UitvoeringRdw, i: Intake, k: Kosten | null): string[] {
  const nee: string[] = [];
  if (!i.aandrijvingen.includes(u.aandrijving)) nee.push("aandrijving niet gekozen");
  if (u.periode[1] < i.startjaar) nee.push(`niet meer nieuw geregistreerd sinds ${u.periode[1]}`);
  if (!k) nee.push("onvoldoende data om de kosten te berekenen");
  if (u.zitplaatsen != null && u.zitplaatsen < i.personen) nee.push(`${u.zitplaatsen} zitplaatsen`);
  if (u.zitplaatsen == null && i.personen > 4) nee.push("aantal zitplaatsen onbekend");
  if (i.trekgewicht > 0 && (u.trekgewichtGeremd ?? 0) < i.trekgewicht) nee.push(`trekgewicht ${u.trekgewichtGeremd ?? 0} kg`);
  if (i.maxAankoopprijs != null && k && k.aankoopprijs > i.maxAankoopprijs) nee.push(`prijs ${eur0(k.aankoopprijs)}`);
  return nee;
}

function fitScore(u: UitvoeringRdw, i: Intake): CriteriumScore | null {
  const delen: { score: number; kort: string; uitleg: string }[] = [];
  if (gezinsprofiel(i) && u.lengteCm != null)
    delen.push({
      score: lineaireScore(u.lengteCm, ankers.lengteGezin.slecht, ankers.lengteGezin.goed),
      kort: `${u.lengteCm} cm lang`,
      uitleg: `ruimte: lengte ${u.lengteCm} cm (0 punten bij ${ankers.lengteGezin.slecht}, 100 bij ${ankers.lengteGezin.goed} cm)`,
    });
  if (u.aandrijving === "elektrisch" && u.actieradiusWltpKm != null && i.langsteRitKm > 0) {
    const praktijk = Math.round(u.actieradiusWltpKm * aannames.energie.actieradiusPraktijkfactor.waarde);
    delen.push({
      score: lineaireScore(praktijk / i.langsteRitKm, ankers.bereikPerRit.slecht, ankers.bereikPerRit.goed),
      kort: `ca. ${praktijk} km bereik`,
      uitleg: `bereik: ca. ${praktijk} km in de praktijk (${u.actieradiusWltpKm} km WLTP × ${nl(aannames.energie.actieradiusPraktijkfactor.waarde)}) voor een rit van ${i.langsteRitKm} km; 0 punten als je net één keer de rit haalt, 100 als je heen en terug kunt zonder laden`,
    });
  }
  if (delen.length === 0) return null;
  const score = Math.round((delen.reduce((s, d) => s + d.score, 0) / delen.length) * 10) / 10;
  return { score, waarde: delen.map((d) => d.kort).join(", "), uitleg: delen.map((d) => `${d.uitleg} → ${d.score}`).join("; ") };
}

export function scoresVoor(m: ModelRdw, u: UitvoeringRdw, i: Intake, k: Kosten): Scores {
  const betr = betrouwbaarheidModel(m.id);
  const veil = veiligheidModel(m.id, i.startjaar);
  const s: Scores = {
    TCO: {
      score: lineaireScore(k.tco.perMaand, ankers.tco.slecht * i.maandbudget, ankers.tco.goed * i.maandbudget),
      waarde: `${eur0(k.tco.perMaand)} per maand`,
      uitleg: `0 punten bij ${eur0(ankers.tco.slecht * i.maandbudget)} (2× je budget), 100 bij ${eur0(ankers.tco.goed * i.maandbudget)} (½× je budget)`,
    },
    BETR: betr
      ? {
          score: betr.score,
          waarde: `${nl(betr.verhouding, 2)}× het gemiddelde aantal APK-gebreken`,
          uitleg: `RDW-keuringen van dit model (bouwjaren 2014–2022), vergeleken met alle auto's van dezelfde leeftijd. Zekerheid: ${betr.zekerheid}. Zegt iets over het model, niet per se over de nieuwste generatie.`,
        }
      : null,
    ONDH: {
      score: lineaireScore(k.onderhoudEnBandenPerMaand, ankers.onderhoud.slecht, ankers.onderhoud.goed),
      waarde: `${eur0(k.onderhoudEnBandenPerMaand)} per maand`,
      uitleg: `rekenmodel op aandrijving, gewicht, leeftijd en km (niet per merk); 0 punten bij €${ankers.onderhoud.slecht}, 100 bij €${ankers.onderhoud.goed} per maand`,
    },
    // Restwaarde telt niet mee zolang de curve voor elk model gelijk is (besluit 37).
    REST: null,
    FIT: fitScore(u, i),
    DUUR:
      k.co2GPerKm == null
        ? null
        : {
            score: lineaireScore(k.co2GPerKm, ankers.co2.slecht, ankers.co2.goed),
            waarde: `${k.co2GPerKm} g CO₂/km`,
            uitleg: `${k.co2Uitleg}; 0 punten bij ${ankers.co2.slecht} g/km, 100 bij ${ankers.co2.goed}`,
          },
    VEIL: veil
      ? {
          score: veil.score,
          waarde: `${veil.geldend.sterren} sterren Euro NCAP (${veil.geldend.testjaar})${veil.geldend.verlopen ? ", verlopen" : ""}`,
          uitleg: `−0,5 ster per volle 3 jaar sinds de test; 2 sterren = 0, 5 sterren = 100${veil.geldend.verlopen ? "; verlopen uitslag maximaal 50" : ""}`,
        }
      : null,
    // Geen objectieve bron voor comfort in v1.
    COMF: null,
  };
  return s;
}

export interface Resultaat {
  id: string;
  merk: string;
  model: string;
  naam: string;
  uitvoering: UitvoeringRdw;
  kosten: Kosten;
  scores: Scores;
  eind: Eindscore;
  binnenBudget: boolean;
}

export interface Ranglijst {
  /** Alle auto's die aan de harde eisen voldoen, beste uitvoering per model, gesorteerd. */
  lijst: Resultaat[];
  /** Top 3: binnen budget; aangevuld met de goedkoopste erboven als er te weinig zijn. */
  top: Resultaat[];
  uitgesloten: { naam: string; aandrijving: Aandrijvingstype; redenen: string[] }[];
}

// Alleen weergave: hoofdletters zoals de RDW ze geeft, omgezet naar gewone schrijfwijze.
const woord = (w: string, kort: boolean) => (kort ? w : w.charAt(0) + w.slice(1).toLowerCase());
const merkNaam = (m: string) => m.replace(/[A-Z]+/g, (w) => woord(w, !/[AEIOUY]/.test(w)));
const typeNaam = (m: string) => m.replace(/[A-Z0-9!.]+/g, (w) => woord(w, w.length <= 3 || /\d/.test(w)));
export const modelNaam = (m: Pick<ModelRdw, "merk" | "model">) => `${merkNaam(m.merk)} ${typeNaam(m.model)}`;

export function rangschik(i: Intake, gewichten: Gewichten, modellen: ModelRdw[] = alleModellen): Ranglijst {
  const uitgesloten: Ranglijst["uitgesloten"] = [];
  const perModel: Resultaat[] = [];
  for (const m of modellen) {
    let beste: Resultaat | null = null;
    for (const u of m.uitvoeringen) {
      const k = kostenNieuw(u, i);
      const nee = hardeEisen(u, i, k);
      if (nee.length || !k) {
        if (i.aandrijvingen.includes(u.aandrijving)) uitgesloten.push({ naam: modelNaam(m), aandrijving: u.aandrijving, redenen: nee });
        continue;
      }
      const scores = scoresVoor(m, u, i, k);
      const r: Resultaat = {
        id: m.id,
        merk: m.merk,
        model: m.model,
        naam: modelNaam(m),
        uitvoering: u,
        kosten: k,
        scores,
        eind: eindscore(scores, gewichten),
        binnenBudget: k.tco.perMaand <= i.maandbudget,
      };
      if (!beste || vergelijk(sleutel(r), sleutel(beste)) < 0) beste = r;
    }
    if (beste) perModel.push(beste);
  }
  const lijst = perModel.sort((a, b) => vergelijk(sleutel(a), sleutel(b)));
  const binnen = lijst.filter((r) => r.binnenBudget);
  const erboven = lijst.filter((r) => !r.binnenBudget).sort((a, b) => a.kosten.tco.perMaand - b.kosten.tco.perMaand);
  const top = [...binnen.slice(0, 3), ...erboven.slice(0, Math.max(0, 3 - binnen.length))];
  return { lijst, top, uitgesloten };
}

const sleutel = (r: Resultaat) => ({ naam: `${r.naam} ${r.uitvoering.aandrijving}`, eindscore: r.eind.score, tcoPerMaand: r.kosten.tco.perMaand });

/** Uitleg bij een plek in de top: sterke en zwakke punten, en de achterstand op nummer 1. */
export function toelichting(r: Resultaat, eerste: Resultaat, gewichten: Gewichten) {
  const sz = sterkEnZwak(r.scores, gewichten);
  const achter = r === eerste ? null : grootsteAchterstand(r.scores, eerste.scores, gewichten);
  return { ...sz, achterstand: achter, verschil: Math.round((eerste.eind.score - r.eind.score) * 10) / 10 };
}

export const nietGescoord = (s: Scores): Criterium[] => CRITERIA.filter((c) => s[c] === null);
