// Kleine hulpfuncties voor de RDW Open Data-API (Socrata). Alleen voor scripts
// die bij het bouwen draaien; de app zelf gebruikt src/data/kenteken.ts.

export const RDW = {
  voertuigen: "https://opendata.rdw.nl/resource/m9d7-ebf2.json",
  brandstof: "https://opendata.rdw.nl/resource/8ys7-d773.json",
};

export async function soql<T = Record<string, string>>(url: string, params: Record<string, string>): Promise<T[]> {
  const q = new URLSearchParams(params);
  for (let poging = 1; ; poging++) {
    const res = await fetch(`${url}?${q}`);
    if (res.ok) return (await res.json()) as T[];
    if (poging >= 4) throw new Error(`RDW ${res.status}: ${await res.text()}`);
    await new Promise((r) => setTimeout(r, 1000 * poging));
  }
}

export function mediaan(xs: number[]): number | null {
  const s = xs.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (s.length === 0) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const vandaag = () => new Date().toISOString().slice(0, 10);

/**
 * Personenauto's (standaard) of bestelauto's (`--bestel`): RDW-filter en bestandsnamen.
 * Bestelauto = voertuigsoort Bedrijfsauto, Europese categorie N1 (tot 3.500 kg).
 */
export const SOORT = process.argv.includes("--bestel")
  ? {
      naam: "bestelauto",
      filter: "voertuigsoort='Bedrijfsauto' AND europese_voertuigcategorie='N1'",
      selectie: "data/bestelselectie.json",
      specs: "data/bestel-rdw.json",
      occasions: "data/bestel-occasions-rdw.json",
      apk: "data/bestel-apk-gebreken.json",
    }
  : {
      naam: "personenauto",
      filter: "voertuigsoort='Personenauto'",
      selectie: "data/modelselectie.json",
      specs: "data/modellen-rdw.json",
      occasions: "data/occasions-rdw.json",
      apk: "data/apk-gebreken.json",
    };
