"use client";

import { useState, type FormEvent } from "react";
import { haalKenteken, type KentekenInfo } from "@/data/kenteken";
import { mrbPersonenauto } from "@/engine";
import { regels, type Provincie } from "@/regels/regels-nl";
import selectie from "../../data/modelselectie.json";
import { Nav } from "../nav";
import { betrouwbaarheidModel } from "@/data/betrouwbaarheid-data";

const modelId = new Map(selectie.modellen.map((m) => [`${m.merk}|${m.model}`, m.id]));
const provincies = Object.keys(regels.mrb.opcenten2026.waarde) as Provincie[];
const eur = (x: number) => x.toLocaleString("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const risico: Record<string, string> = { ERN: "ernstig", HOOG: "hoog", MID: "middel", LAAG: "laag" };

export default function Kentekencheck() {
  const [invoer, setInvoer] = useState("");
  const [provincie, setProvincie] = useState<Provincie>("utrecht");
  const [info, setInfo] = useState<KentekenInfo | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  async function zoek(e: FormEvent) {
    e.preventDefault();
    setBezig(true);
    setFout(null);
    setInfo(null);
    try {
      const r = await haalKenteken(invoer);
      if (!r) setFout("Dit kenteken staat niet in de RDW-gegevens.");
      else setInfo(r);
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis bij het ophalen.");
    } finally {
      setBezig(false);
    }
  }

  const personenauto = info?.voertuigsoort === "Personenauto";
  const mrb =
    info && personenauto && info.massaRijklaar
      ? mrbPersonenauto({ massaRijklaar: info.massaRijklaar, brandstof: info.mrbBrandstof, provincie, jaar: 2026 })
      : null;

  return (
    <main>
      <Nav />
      <h1>Kentekencheck</h1>
      <p className="sub">
        Haalt de officiële gegevens op bij RDW. Het kenteken gaat rechtstreeks van jouw browser naar RDW; wij slaan niets op.
      </p>

      <form onSubmit={zoek} className="velden">
        <label>
          Kenteken
          <input value={invoer} onChange={(e) => setInvoer(e.target.value)} placeholder="bijv. AB-123-C" autoComplete="off" />
        </label>
        <label>
          Provincie (voor de MRB)
          <select value={provincie} onChange={(e) => setProvincie(e.target.value as Provincie)}>
            {provincies.map((p) => (
              <option key={p} value={p}>
                {p.replace(/(^|-)\w/g, (s) => s.toUpperCase())}
              </option>
            ))}
          </select>
        </label>
        <label>
          &nbsp;
          <button type="submit" disabled={bezig || invoer.trim() === ""}>
            {bezig ? "Bezig…" : "Opzoeken"}
          </button>
        </label>
      </form>

      {fout && <p className="melding">{fout}</p>}

      {info && (
        <>
          <h2>
            {info.merk} {info.handelsbenaming}
          </h2>
          <p className="uitleg">
            {modelId.has(info.modelSleutel)
              ? "Dit model zit in onze dataset."
              : "Dit model zit (nog) niet in onze dataset van de 50 meest geregistreerde modellen; we rekenen met de gegevens van dit kenteken."}
          </p>
          <div className="kaarten">
            <div className="kaart">
              <h3>Auto</h3>
              <table>
                <tbody>
                  <tr><td>Eerste toelating</td><td className="b">{info.datumEersteToelating}</td></tr>
                  <tr><td>Aandrijving</td><td className="b">{info.aandrijving ?? "onbekend"}</td></tr>
                  <tr><td>Massa rijklaar</td><td className="b">{info.massaRijklaar ?? "—"} kg</td></tr>
                  <tr><td>Zitplaatsen</td><td className="b">{info.zitplaatsen ?? "—"}</td></tr>
                  <tr><td>Trekgewicht (geremd)</td><td className="b">{info.trekgewichtGeremd ?? "—"} kg</td></tr>
                  <tr><td>Catalogusprijs (nieuw)</td><td className="b">{info.catalogusprijs ? eur(info.catalogusprijs) : "—"}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="kaart">
              <h3>Energie ({info.meetmethode}{info.meetmethode === "NEDC" ? ", oude test: lager dan in de praktijk" : ""})</h3>
              <table>
                <tbody>
                  {info.aandrijving === "plug-in hybride" ? (
                    <>
                      <tr><td>Elektrisch verbruik</td><td className="b">{info.elektrischVerbruikWltp ?? "—"} kWh/100 km</td></tr>
                      <tr><td>Gewogen verbruik (folder)</td><td className="b">{info.verbruikGewogenWltp ?? "—"} l/100 km</td></tr>
                    </>
                  ) : (
                    <tr>
                      <td>Verbruik</td>
                      <td className="b">
                        {info.verbruikWltp ?? "—"} {info.aandrijving === "elektrisch" ? "kWh" : "l"}/100 km
                      </td>
                    </tr>
                  )}
                  <tr><td>CO₂{info.aandrijving === "plug-in hybride" ? " (gewogen)" : ""}</td><td className="b">{info.co2Wltp ?? "—"} g/km</td></tr>
                  <tr><td>Elektrische actieradius</td><td className="b">{info.actieradiusWltpKm ?? "—"} km</td></tr>
                </tbody>
              </table>
            </div>
            {(() => {
              const id = modelId.get(info.modelSleutel);
              if (!id) return null;
              const b = betrouwbaarheidModel(id, [info.bouwjaar - 1, info.bouwjaar, info.bouwjaar + 1]);
              return (
                <div className="kaart">
                  <h3>Betrouwbaarheid (APK)</h3>
                  {b ? (
                    <>
                      <div className="groot">{b.score}</div>
                      <div className="uitleg">
                        van 100 (50 = gemiddeld) voor dit model, bouwjaar {info.bouwjaar - 1}–{info.bouwjaar + 1}: {b.verhouding.toLocaleString("nl-NL")}× zo
                        vaak een technisch APK-gebrek als gemiddeld voor die leeftijd ({b.keuringen} keuringen, zekerheid {b.zekerheid}).
                      </div>
                    </>
                  ) : (
                    <div className="uitleg">Onvoldoende APK-gegevens voor dit model rond bouwjaar {info.bouwjaar}.</div>
                  )}
                </div>
              );
            })()}
            {mrb && (
              <div className="kaart">
                <h3>Motorrijtuigenbelasting</h3>
                <div className="groot">{eur(mrb.perKwartaal)}</div>
                <div className="uitleg">per kwartaal in 2026 · {eur(mrb.perJaar)} per jaar</div>
              </div>
            )}
            <div className="kaart">
              <h3>APK en terugroepacties</h3>
              <p>APK geldig tot: {info.apkVervaldatum ?? "onbekend"}</p>
              {info.terugroepacties.length === 0 ? (
                <p>Geen openstaande terugroepacties.</p>
              ) : (
                info.terugroepacties.map((t) => (
                  <details key={t.referentie} open>
                    <summary>
                      Openstaande terugroepactie{t.risico ? ` (risico: ${risico[t.risico] ?? t.risico})` : ""}
                    </summary>
                    <p>{t.omschrijving}</p>
                    {t.herstel && <p className="uitleg">Herstel: {t.herstel}</p>}
                    <p className="uitleg">
                      RDW-referentie {t.referentie}
                      {t.publicatiedatum ? `, gepubliceerd ${t.publicatiedatum}` : ""}. Let op: RDW toont een actie soms nog als open
                      terwijl die al is uitgevoerd.
                    </p>
                  </details>
                ))
              )}
            </div>
          </div>
          {!personenauto && <p className="melding">Dit is geen personenauto ({info.voertuigsoort}); de MRB-berekening geldt alleen voor personenauto&apos;s.</p>}
          <p className="disclaimer">Bron: {info.bron}. Gegevens zoals RDW ze publiceert; geen garantie op juistheid of actualiteit.</p>
        </>
      )}
    </main>
  );
}
