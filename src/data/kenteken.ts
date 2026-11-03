/**
 * Kentekencheck via RDW Open Data. Draait in de browser: het kenteken gaat
 * rechtstreeks naar RDW (CORS toegestaan) en nooit langs een eigen server.
 */
import type { Brandstof } from "@/engine/mrb";
import { aandrijvingUitRdw, mrbBrandstof, type RdwBrandstofRij } from "./aandrijving";
import { modelSleutel } from "./normaliseer";
import type { Aandrijvingstype } from "./types";

const API = "https://opendata.rdw.nl/resource";
const VOERTUIGEN = `${API}/m9d7-ebf2.json`;
const BRANDSTOF = `${API}/8ys7-d773.json`;
const TERUGROEP_STATUS = `${API}/t49b-isb7.json`;
const TERUGROEP_ACTIE = `${API}/af5r-44mf.json`;

export interface Terugroepactie {
  referentie: string;
  status: string;
  omschrijving?: string;
  gevolgen?: string;
  herstel?: string;
  risico?: string;
  publicatiedatum?: string;
}

export interface KentekenInfo {
  kenteken: string;
  merk: string;
  handelsbenaming: string;
  /** Sleutel "MERK|FAMILIE", zelfde als in data/modelselectie.json. */
  modelSleutel: string;
  voertuigsoort: string;
  datumEersteToelating: string; // ISO
  bouwjaar: number;
  massaRijklaar: number | null;
  catalogusprijs: number | null;
  zitplaatsen: number | null;
  trekgewichtGeremd: number | null;
  aandrijving: Aandrijvingstype | null;
  mrbBrandstof: Brandstof;
  verbruikWltp: number | null;
  /** Alleen plug-in hybride: gewogen WLTP-verbruik (l/100 km) en elektrisch verbruik (kWh/100 km). */
  verbruikGewogenWltp: number | null;
  elektrischVerbruikWltp: number | null;
  co2Wltp: number | null;
  actieradiusWltpKm: number | null;
  /** "WLTP", of "NEDC" bij oudere auto's (vóór 2018) waarvoor RDW alleen de oude testwaarden heeft. */
  meetmethode: "WLTP" | "NEDC";
  apkVervaldatum: string | null; // ISO
  terugroepacties: Terugroepactie[];
  bron: string;
}

/** "ab-12-cd" → "AB12CD" */
export function normaliseerKenteken(invoer: string): string {
  return invoer.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const iso = (yyyymmdd?: string) => (yyyymmdd && /^\d{8}$/.test(yyyymmdd) ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}` : null);
const num = (x?: string) => (x === undefined || x === "" ? null : Number(x));

type Fetch = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

async function haal<T>(f: Fetch, url: string): Promise<T[]> {
  const res = await f(url);
  if (!res.ok) throw new Error(`RDW gaf foutcode ${res.status}`);
  return (await res.json()) as T[];
}

export async function haalKenteken(invoer: string, f: Fetch = (u) => fetch(u)): Promise<KentekenInfo | null> {
  const kenteken = normaliseerKenteken(invoer);
  if (!/^[A-Z0-9]{6}$/.test(kenteken)) throw new Error("Een Nederlands kenteken heeft 6 letters en cijfers");

  const [voertuigen, brandstoffen, statussen] = await Promise.all([
    haal<Record<string, string>>(f, `${VOERTUIGEN}?kenteken=${kenteken}`),
    haal<RdwBrandstofRij>(f, `${BRANDSTOF}?kenteken=${kenteken}`),
    haal<Record<string, string>>(f, `${TERUGROEP_STATUS}?kenteken=${kenteken}`),
  ]);
  const v = voertuigen[0];
  if (!v) return null;

  const open = statussen.filter((s) => s.code_status === "O");
  const details = await Promise.all(
    open.map((s) => haal<Record<string, string>>(f, `${TERUGROEP_ACTIE}?referentiecode_rdw=${encodeURIComponent(s.referentiecode_rdw)}`)),
  );

  const aandrijving = aandrijvingUitRdw(brandstoffen);
  const hoofd = aandrijving === "elektrisch" ? brandstoffen[0] : brandstoffen.find((b) => b.brandstof_omschrijving !== "Elektriciteit") ?? brandstoffen[0];
  const elek = brandstoffen.find((b) => b.brandstof_omschrijving === "Elektriciteit");
  const evVerbruik = num(elek?.elektrisch_verbruik_enkel_elektrisch_wltp);
  const datum = iso(v.datum_eerste_toelating) ?? "";

  return {
    kenteken,
    merk: v.merk,
    handelsbenaming: v.handelsbenaming,
    modelSleutel: modelSleutel(v.merk, v.handelsbenaming),
    voertuigsoort: v.voertuigsoort,
    datumEersteToelating: datum,
    bouwjaar: Number(datum.slice(0, 4)),
    massaRijklaar: num(v.massa_rijklaar),
    catalogusprijs: num(v.catalogusprijs),
    zitplaatsen: num(v.aantal_zitplaatsen),
    trekgewichtGeremd: num(v.maximum_trekken_massa_geremd) ?? 0,
    aandrijving,
    mrbBrandstof: mrbBrandstof(brandstoffen),
    verbruikWltp:
      aandrijving === "elektrisch"
        ? evVerbruik === null
          ? null
          : evVerbruik / 10
        : num(hoofd?.brandstof_verbruik_gecombineerd_wltp) ?? num(hoofd?.brandstofverbruik_gecombineerd),
    verbruikGewogenWltp: aandrijving === "plug-in hybride" ? num(hoofd?.brandstof_verbruik_gewogen_gecombineerd_wltp) : null,
    elektrischVerbruikWltp:
      aandrijving === "plug-in hybride"
        ? (() => {
            const x = num(brandstoffen.map((b) => b.elektrisch_verbruik_extern_opladen_wltp).find(Boolean));
            return x === null ? null : x / 10;
          })()
        : null,
    co2Wltp:
      aandrijving === "elektrisch" ? 0 : num(hoofd?.emissie_co2_gecombineerd_wltp ?? hoofd?.emis_co2_gewogen_gecombineerd_wltp) ?? num(hoofd?.co2_uitstoot_gecombineerd),
    meetmethode: hoofd?.brandstof_verbruik_gecombineerd_wltp || hoofd?.emissie_co2_gecombineerd_wltp || aandrijving === "elektrisch" ? "WLTP" : hoofd?.brandstofverbruik_gecombineerd ? "NEDC" : "WLTP",
    actieradiusWltpKm: num(elek?.actie_radius_enkel_elektrisch_wltp ?? brandstoffen.map((b) => b.actie_radius_extern_opladen_wltp).find(Boolean)),
    apkVervaldatum: iso(v.vervaldatum_apk),
    terugroepacties: open.map((s, i) => {
      const d = details[i][0];
      return {
        referentie: s.referentiecode_rdw,
        status: s.status,
        omschrijving: d?.omschrijving_defect,
        gevolgen: d?.materi_le_gevolgen,
        herstel: d?.beschrijving_van_het_herstel,
        risico: d?.risicobeoordeling_rdw,
        publicatiedatum: iso(d?.publicatiedatum_rdw) ?? undefined,
      };
    }),
    bron: "RDW Open Data (CC-0)",
  };
}
