// Van intake naar ranglijst (docs/methodiek.md §1 en §3). Koppelt de dataset
// aan de engine. Deze module kent geen partnerdata: de volgorde hangt alleen af
// van de modeldata, jouw antwoorden en de openbare ankers en gewichten.
import rdw from "../../data/modellen-rdw.json";
import type { ModelRdw, UitvoeringRdw, Aandrijvingstype } from "./types";
import { betrouwbaarheidModel } from "./betrouwbaarheid-data";
import { ncapVoorBouwjaar, veiligheidModel } from "./ncap-data";
import { occasionJaren } from "./occasions-data";
import { aannames } from "@/regels/aannames";
import { ankers, CRITERIA, type Criterium, type Profiel } from "@/regels/methodiek";
import type { Provincie } from "@/regels/regels-nl";
import {
  afschrijvingOverLooptijd,
  bandenPerJaar,
  eindscore,
  energiekostenPerJaar,
  energiekostenPhevPerJaar,
  geschatteWaarde,
  gemiddeldeLaadprijs,
  grootsteAchterstand,
  lineaireScore,
  mrbPersonenauto,
  onderhoudPerJaar,
  rond2,
  sterkEnZwak,
  tcoContant,
  vergelijk,
  veiligheidsScore,
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

export type Soort = "nieuw" | "occasion" | "beide";

export interface Intake {
  profiel: Profiel;
  soort: Soort;
  /** Alleen occasions: maximale leeftijd in jaren en optionele maximale kilometerstand. */
  maxLeeftijdJaar: number;
  maxKmStand: number | null;
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

/** Een occasion: bouwjaar, leeftijd bij aankoop en (aangenomen) kilometerstand. */
export interface Occasion {
  bouwjaar: number;
  leeftijdMaanden: number;
  kmNu: number;
}

/** Occasion van een bouwjaar bij aankoop in het startjaar: midden bouwjaar tot midden startjaar, normale km per jaar (aanname). */
export function occasionVan(bouwjaar: number, startjaar: number): Occasion {
  const leeftijdMaanden = (startjaar - bouwjaar) * 12;
  return { bouwjaar, leeftijdMaanden, kmNu: (leeftijdMaanden / 12) * aannames.restwaarde.normKmPerJaar.waarde };
}

export interface Kosten {
  tco: TcoUitkomst;
  aankoopprijs: number;
  /** Hoe de aankoopprijs tot stand komt (catalogusprijs of geschatte occasionprijs). */
  prijsUitleg: string;
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

const meet = (u: UitvoeringRdw, veld: "verbruik" | "co2" | "actieradius") =>
  u.meetmethode?.[veld] === "nedc-omgerekend" ? "WLTP, omgerekend uit de oudere NEDC-test" : "WLTP";

/** Energie per jaar en CO₂ bij jouw gebruik; null als de data ontbreekt. */
function energie(u: UitvoeringRdw, i: Intake): { perJaar: number; uitleg: string; co2: number | null; co2Uitleg: string } | null {
  const pomp = aannames.energie.pompprijs.waarde;
  if (u.verbruikWltp == null) return null;
  if (u.aandrijving === "elektrisch") {
    const l = laadprijs(i.thuisladen);
    return {
      perJaar: energiekostenPerJaar(i.kmPerJaar, u.verbruikWltp, l.prijs),
      uitleg: `${nl(i.kmPerJaar)} km × ${nl(u.verbruikWltp)} kWh/100 km (${meet(u, "verbruik")}), ${l.uitleg}`,
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
    uitleg: `${nl(i.kmPerJaar)} km × ${nl(u.verbruikWltp)} l/100 km (${meet(u, "verbruik")}) × €${nl(prijs)} per liter ${soort} (CBS)`,
    co2: u.co2Wltp,
    co2Uitleg: `${meet(u, "co2")}-opgave (RDW)`,
  };
}

/** Jaren van de looptijd, voor MRB en onderhoud die per jaar verschillen. */
function jarenVan(i: Intake): number[] {
  return Array.from({ length: Math.ceil(i.looptijdMaanden / 12) }, (_, k) => k);
}

/** Kosten van een nieuwe auto over jouw looptijd, contant gekocht. Null als er data ontbreekt. */
export const kostenNieuw = (u: UitvoeringRdw, i: Intake) => kosten(u, i, null);

/** Kosten over jouw looptijd, contant gekocht; nieuw (occ = null) of als occasion. */
export function kosten(u: UitvoeringRdw, i: Intake, occ: Occasion | null): Kosten | null {
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
    jaren.reduce((s, k) => s + onderhoudPerJaar({ elektrisch, kmPerJaar: i.kmPerJaar, leeftijdJaar: (occ ? occ.leeftijdMaanden / 12 : 0) + k }).bedrag, 0) / jaren.length;
  const banden = bandenPerJaar({ elektrisch, massaRijklaar: u.massaRijklaar, kmPerJaar: i.kmPerJaar }).bedrag;
  const verzekering = verzekeringPerJaar({ dekking: i.dekking, eigenPremiePerMaand: i.eigenPremiePerMaand }).bedrag;
  const prijs = occ ? geschatteWaarde({ nieuwprijs: u.catalogusprijs, leeftijdMaanden: occ.leeftijdMaanden, km: occ.kmNu }) : null;
  const aankoopprijs = prijs ? prijs.waarde : u.catalogusprijs;
  const prijsUitleg = occ
    ? `geschat: nieuwprijs ${occ.bouwjaar} ${eur0(u.catalogusprijs)}, ${occ.leeftijdMaanden / 12} jaar oud, ca. ${nl(occ.kmNu)} km (${prijs!.uitleg}). Generieke curve, geen marktprijs.`
    : `mediane catalogusprijs van recent geregistreerde exemplaren (RDW), incl. opties, zonder korting`;
  const rest = afschrijvingOverLooptijd({
    nieuwprijs: u.catalogusprijs,
    leeftijdNuMaanden: occ?.leeftijdMaanden ?? 0,
    kmNu: occ?.kmNu ?? 0,
    looptijdMaanden: i.looptijdMaanden,
    kmPerJaar: i.kmPerJaar,
  });
  const onderhoudEnBanden = rond2((onderhoudJaar + banden) / 12);

  const tco = tcoContant({
    aankoopprijs,
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
    "Kosten van geld (gemist rendement)": `gemiddeld ${eur0((aankoopprijs + rest.waardeEinde) / 2)} vastgezet × ${nl(aannames.geld.gemistRendement.waarde * 100)}% rente die je misloopt / 12 (aanname)`,
    Afschrijving: `${occ ? "geschatte occasionprijs" : "catalogusprijs"} ${eur0(aankoopprijs)} → geschatte waarde na ${i.looptijdMaanden} maanden ${eur0(rest.waardeEinde)} (generieke curve, niet per model)`,
  };
  tco.posten = tco.posten.map((p) => (extra[p.label] ? { ...p, uitleg: extra[p.label] } : p));

  return {
    tco,
    aankoopprijs,
    prijsUitleg,
    restwaardeEinde: rest.waardeEinde,
    energiePerJaar: e.perJaar,
    energieUitleg: e.uitleg,
    onderhoudEnBandenPerMaand: onderhoudEnBanden,
    co2GPerKm: e.co2,
    co2Uitleg: e.co2Uitleg,
  };
}

/** Harde eisen: geven geen punten, maar sluiten uit. Lege lijst = voldoet. */
export function hardeEisen(u: UitvoeringRdw, i: Intake, k: Kosten | null, occ: Occasion | null = null): string[] {
  const nee: string[] = [];
  if (!i.aandrijvingen.includes(u.aandrijving)) nee.push("aandrijving niet gekozen");
  if (!occ && u.periode[1] < i.startjaar) nee.push(`niet meer nieuw geregistreerd sinds ${u.periode[1]}`);
  if (occ && occ.leeftijdMaanden / 12 > i.maxLeeftijdJaar) nee.push(`ouder dan ${i.maxLeeftijdJaar} jaar`);
  if (occ && i.maxKmStand != null && occ.kmNu > i.maxKmStand) nee.push(`ca. ${nl(occ.kmNu)} km`);
  if (u.aandrijving === "elektrisch" && u.actieradiusWltpKm == null) nee.push("actieradius onbekend");
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

/** Betrouwbaarheid: voor een occasion van dat bouwjaar als er genoeg keuringen zijn, anders het hele model. */
function betrouwbaarheidVoor(id: string, occ: Occasion | null) {
  const eigen = occ ? betrouwbaarheidModel(id, [occ.bouwjaar]) : null;
  if (eigen) return { ...eigen, wat: `bouwjaar ${occ!.bouwjaar}` };
  const model = betrouwbaarheidModel(id);
  return model ? { ...model, wat: occ ? `alle bouwjaren 2014–2022; te weinig keuringen van bouwjaar ${occ.bouwjaar}` : "bouwjaren 2014–2022" } : null;
}

/** Euro NCAP: nieuw = de geldende uitslag; occasion = de nieuwste test uit of vóór het bouwjaar (een latere test gaat over een nieuwere generatie). */
function veiligheidVoor(id: string, occ: Occasion | null, peiljaar: number) {
  if (!occ) return veiligheidModel(id, peiljaar)?.geldend ?? null;
  const v = ncapVoorBouwjaar(id, occ.bouwjaar);
  return v && !v.laterGetest ? v.uitslag : null;
}

export function scoresVoor(m: ModelRdw, u: UitvoeringRdw, i: Intake, k: Kosten, occ: Occasion | null = null): Scores {
  const betr = betrouwbaarheidVoor(m.id, occ);
  const ncap = veiligheidVoor(m.id, occ, i.startjaar);
  const veil = ncap ? { geldend: ncap, score: veiligheidsScore(ncap, i.startjaar) } : null;
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
          uitleg: `RDW-keuringen van dit model (${betr.wat}), vergeleken met alle auto's van dezelfde leeftijd. Zekerheid: ${betr.zekerheid}.${occ ? "" : " Zegt iets over het model, niet per se over de nieuwste generatie."}`,
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
  /** null = nieuw. */
  occasion: Occasion | null;
  kosten: Kosten;
  scores: Scores;
  eind: Eindscore;
  binnenBudget: boolean;
}

export interface Ranglijst {
  /** Alle auto's die aan de harde eisen voldoen, beste kandidaat per model, gesorteerd. */
  lijst: Resultaat[];
  /** Top 3: binnen budget; aangevuld met de goedkoopste erboven als er te weinig zijn. */
  top: Resultaat[];
  uitgesloten: { naam: string; aandrijving: Aandrijvingstype; bouwjaren: number[]; redenen: string[] }[];
}

// Alleen weergave: hoofdletters zoals de RDW ze geeft, omgezet naar gewone schrijfwijze.
const woord = (w: string, kort: boolean) => (kort ? w : w.charAt(0) + w.slice(1).toLowerCase());
const merkNaam = (m: string) => m.replace(/[A-Z]+/g, (w) => woord(w, !/[AEIOUY]/.test(w)));
const typeNaam = (m: string) => m.replace(/[A-Z0-9!.]+/g, (w) => woord(w, w.length <= 3 || /\d/.test(w)));
export const modelNaam = (m: Pick<ModelRdw, "merk" | "model">) => `${merkNaam(m.merk)} ${typeNaam(m.model)}`;

/** Alle kandidaten van een model: nieuwe uitvoeringen en/of occasions per bouwjaar binnen de leeftijdsgrens. */
function kandidaten(m: ModelRdw, i: Intake): { u: UitvoeringRdw; occ: Occasion | null }[] {
  const uit: { u: UitvoeringRdw; occ: Occasion | null }[] = [];
  if (i.soort !== "occasion") for (const u of m.uitvoeringen) uit.push({ u, occ: null });
  if (i.soort !== "nieuw")
    for (const j of occasionJaren(m.id)) {
      const leeftijd = i.startjaar - j.bouwjaar;
      if (leeftijd < 1 || leeftijd > i.maxLeeftijdJaar) continue;
      for (const u of j.uitvoeringen) uit.push({ u, occ: occasionVan(j.bouwjaar, i.startjaar) });
    }
  return uit;
}

export function rangschik(i: Intake, gewichten: Gewichten, modellen: ModelRdw[] = alleModellen): Ranglijst {
  const uitgesloten = new Map<string, Ranglijst["uitgesloten"][number]>();
  const perModel: Resultaat[] = [];
  for (const m of modellen) {
    let beste: Resultaat | null = null;
    for (const { u, occ } of kandidaten(m, i)) {
      if (!i.aandrijvingen.includes(u.aandrijving)) continue;
      const k = kosten(u, i, occ);
      const nee = hardeEisen(u, i, k, occ);
      if (nee.length || !k) {
        const sleutelUit = `${m.id}|${u.aandrijving}|${occ ? "occ" : "nieuw"}|${nee.join(",")}`;
        const e = uitgesloten.get(sleutelUit) ?? { naam: modelNaam(m), aandrijving: u.aandrijving, bouwjaren: [], redenen: nee };
        if (occ) e.bouwjaren.push(occ.bouwjaar);
        uitgesloten.set(sleutelUit, e);
        continue;
      }
      const scores = scoresVoor(m, u, i, k, occ);
      const r: Resultaat = {
        id: m.id,
        merk: m.merk,
        model: m.model,
        naam: modelNaam(m),
        uitvoering: u,
        occasion: occ,
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
  return { lijst, top, uitgesloten: [...uitgesloten.values()] };
}

/** Tie-break-naam: model, aandrijving en bouwjaar (nieuw vóór occasion bij verder gelijke stand). */
const sleutel = (r: Resultaat) => ({
  naam: `${r.naam} ${r.uitvoering.aandrijving} ${r.occasion ? r.occasion.bouwjaar : "0000"}`,
  eindscore: r.eind.score,
  tcoPerMaand: r.kosten.tco.perMaand,
});

/** Korte omschrijving van wat je koopt: "nieuw" of "occasion 2021, ca. 75.000 km". */
export const soortTekst = (r: Pick<Resultaat, "occasion">) => (r.occasion ? `occasion ${r.occasion.bouwjaar}, ca. ${nl(r.occasion.kmNu)} km` : "nieuw");

/** Uitleg bij een plek in de top: sterke en zwakke punten, en de achterstand op nummer 1. */
export function toelichting(r: Resultaat, eerste: Resultaat, gewichten: Gewichten) {
  const sz = sterkEnZwak(r.scores, gewichten);
  const achter = r === eerste ? null : grootsteAchterstand(r.scores, eerste.scores, gewichten);
  return { ...sz, achterstand: achter, verschil: Math.round((eerste.eind.score - r.eind.score) * 10) / 10 };
}

export const nietGescoord = (s: Scores): Criterium[] => CRITERIA.filter((c) => s[c] === null);
