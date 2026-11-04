// Bestelauto's (categorie N1): objectieve RDW-selectie, specs, occasions en APK-gebreken
// (scripts met --bestel; docs/databronnen.md §5.11).
import specs from "../../data/bestel-rdw.json";
import occ from "../../data/bestel-occasions-rdw.json";
import apk from "../../data/bestel-apk-gebreken.json";
import type { ModelRdw, UitvoeringRdw } from "./types";
import { maakBetrouwbaarheid } from "./betrouwbaarheid-data";

export const bestelModellen = specs.modellen as unknown as ModelRdw[];
export const bestelPeildatum = specs.peildatum;

const jaren = occ.modellen as unknown as Record<string, { bouwjaar: number; uitvoeringen: UitvoeringRdw[] }[]>;
export const bestelOccasionJaren = (id: string) => jaren[id] ?? [];

/** Betrouwbaarheid tegen het landelijk gemiddelde van bestelauto's van dezelfde leeftijd. */
export const bestelBetrouwbaarheid = maakBetrouwbaarheid(apk);
export const bestelApkHerkomst = { bron: apk.bron, peildatum: apk.peildatum, methode: apk.methode };
