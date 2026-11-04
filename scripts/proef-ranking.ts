// Proefdraai van de ranglijst met een standaardintake (alleen voor ontwikkeling).
import { rangschik, STANDAARD_ZAKELIJK, type Intake } from "@/data/ranking";
import { startGewichten } from "@/engine";

const intake: Intake = {
  profiel: "particulier", voertuig: "personenauto", soort: (process.argv[4] as Intake["soort"]) ?? "beide", maxLeeftijdJaar: 8, maxKmStand: null, zakelijk: STANDAARD_ZAKELIJK, kmPerJaar: 15000, langsteRitKm: 150, maandbudget: Number(process.argv[2] ?? 600), maxAankoopprijs: null,
  personen: 4, kinderen: true, thuisladen: process.argv[3] !== "nee", trekgewicht: 0, provincie: "utrecht", looptijdMaanden: 60,
  aandrijvingen: ["benzine", "hybride", "plug-in hybride", "elektrisch", "diesel", "lpg"], dekking: "allrisk", eigenPremiePerMaand: null, startjaar: 2026,
};
const g = startGewichten("particulier", { gezin: true, occasion: intake.soort === "occasion" });
const r = rangschik(intake, g);
console.log("gewichten", g);
for (const x of r.lijst.slice(0, 12))
  console.log(x.eind.score.toFixed(1).padStart(5), x.binnenBudget ? " " : "!", x.naam.padEnd(24), x.uitvoering.aandrijving.padEnd(16), String(x.occasion?.bouwjaar ?? "nieuw").padEnd(6), Math.round(x.kosten.tco.perMaand), Object.entries(x.scores).map(([c, s]) => `${c}:${s ? Math.round(s.score) : "-"}`).join(" "));
console.log("top", r.top.map((x) => x.naam));
console.log("uitgesloten", r.uitgesloten.length, r.uitgesloten.slice(0, 5));
