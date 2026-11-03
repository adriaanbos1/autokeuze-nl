// Kentekencheck met nagebootste RDW-antwoorden (geen netwerk nodig).
import { describe, expect, it } from "vitest";
import { haalKenteken, normaliseerKenteken } from "@/data/kenteken";

function nepRdw(antwoorden: Record<string, unknown[]>) {
  return async (url: string) => {
    const sleutel = Object.keys(antwoorden).find((k) => url.includes(k));
    return { ok: true, status: 200, json: async () => (sleutel ? antwoorden[sleutel] : []) };
  };
}

const voertuig = {
  kenteken: "AB123C",
  voertuigsoort: "Personenauto",
  merk: "TOYOTA",
  handelsbenaming: "TOYOTA YARIS",
  datum_eerste_toelating: "20210315",
  massa_rijklaar: "1190",
  catalogusprijs: "24995",
  aantal_zitplaatsen: "5",
  maximum_trekken_massa_geremd: "450",
  vervaldatum_apk: "20270315",
};

describe("kentekencheck", () => {
  it("normaliseert invoer met streepjes en kleine letters", () => {
    expect(normaliseerKenteken("ab-123-c")).toBe("AB123C");
  });

  it("weigert een kenteken dat geen 6 tekens heeft", async () => {
    await expect(haalKenteken("AB-12")).rejects.toThrow(/6 letters/);
  });

  it("geeft null als RDW het kenteken niet kent", async () => {
    expect(await haalKenteken("ZZ999Z", nepRdw({}))).toBeNull();
  });

  it("hybride benzineauto: model, MRB-brandstof en APK", async () => {
    const info = await haalKenteken(
      "ab-123-c",
      nepRdw({
        "m9d7-ebf2": [voertuig],
        "8ys7-d773": [
          { brandstof_omschrijving: "Benzine", klasse_hybride_elektrisch_voertuig: "NOVC-HEV", brandstof_verbruik_gecombineerd_wltp: "3.900", emissie_co2_gecombineerd_wltp: "89" },
          { brandstof_omschrijving: "Elektriciteit", klasse_hybride_elektrisch_voertuig: "NOVC-HEV" },
        ],
      }),
    );
    expect(info).toMatchObject({
      modelSleutel: "TOYOTA|YARIS",
      bouwjaar: 2021,
      massaRijklaar: 1190,
      aandrijving: "hybride",
      mrbBrandstof: "benzine",
      verbruikWltp: 3.9,
      co2Wltp: 89,
      apkVervaldatum: "2027-03-15",
      terugroepacties: [],
    });
  });

  it("oudere auto zonder WLTP valt terug op NEDC-waarden", async () => {
    const info = await haalKenteken(
      "AB123C",
      nepRdw({
        "m9d7-ebf2": [{ ...voertuig, merk: "VOLKSWAGEN", handelsbenaming: "GOLF", datum_eerste_toelating: "20180601" }],
        "8ys7-d773": [{ brandstof_omschrijving: "Benzine", brandstofverbruik_gecombineerd: "5.00", co2_uitstoot_gecombineerd: "115" }],
      }),
    );
    expect(info).toMatchObject({ verbruikWltp: 5, co2Wltp: 115, meetmethode: "NEDC" });
  });

  it("elektrische auto met openstaande terugroepactie", async () => {
    const info = await haalKenteken(
      "AB123C",
      nepRdw({
        "m9d7-ebf2": [{ ...voertuig, merk: "TESLA", handelsbenaming: "MODEL Y" }],
        "8ys7-d773": [{ brandstof_omschrijving: "Elektriciteit", elektrisch_verbruik_enkel_elektrisch_wltp: "157.00", actie_radius_enkel_elektrisch_wltp: "455" }],
        "t49b-isb7": [{ kenteken: "AB123C", referentiecode_rdw: "X1", code_status: "O", status: "Openstaande terugroepactie" }],
        "af5r-44mf": [{ referentiecode_rdw: "X1", omschrijving_defect: "Remkracht", risicobeoordeling_rdw: "ERN", publicatiedatum_rdw: "20231215" }],
      }),
    );
    expect(info?.aandrijving).toBe("elektrisch");
    expect(info?.mrbBrandstof).toBe("elektrisch");
    expect(info?.verbruikWltp).toBe(15.7);
    expect(info?.actieradiusWltpKm).toBe(455);
    expect(info?.terugroepacties).toEqual([
      expect.objectContaining({ referentie: "X1", omschrijving: "Remkracht", risico: "ERN", publicatiedatum: "2023-12-15" }),
    ]);
  });
});
