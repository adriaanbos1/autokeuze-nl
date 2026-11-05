// Jaarlijkse regelcheck (docs/checklist-regelupdate.md): welke regels en aannames vragen aandacht?
// Gebruik: npm run regelcheck            (peildatum ouder dan 12 maanden = verouderd)
//          npm run regelcheck -- 6       (strenger: ouder dan 6 maanden)
import { aandachtspunten, register } from "@/regels/register";

const maanden = Number(process.argv[2] ?? 12);
const vandaag = new Date().toISOString().slice(0, 10);
const a = aandachtspunten(vandaag, maanden);
const jaar = Number(vandaag.slice(0, 4));

const lijst = (titel: string, rs: typeof register) => {
  console.log(`\n${titel} (${rs.length})`);
  for (const r of rs) console.log(`  - ${r.pad} [${r.bestand}] peildatum ${r.peildatum}${r.url ? `\n      ${r.url}` : ""}`);
};

console.log(`Regelcheck ${vandaag}: ${register.length} parameters.`);
lijst("Onzeker: zoek een primaire bron", a.onzeker);
lijst("Aangekondigd: is het inmiddels vastgesteld?", a.aangekondigd);
lijst(`Peildatum ouder dan ${maanden} maanden: opnieuw controleren`, a.verouderd);
lijst("Wettelijke regel zonder link", a.zonderLink.filter((r) => r.bestand === "regels-nl.ts"));
// Tabellen met een jaartal in de naam ("schijven2026") moeten voor het nieuwe jaar een opvolger krijgen.
lijst(
  `Tabellen voor een eerder jaar dan ${jaar}: nieuw jaar toevoegen`,
  register.filter((r) => /(?<!\d)20\d\d$/.test(r.pad) && Number(r.pad.slice(-4)) < jaar),
);
