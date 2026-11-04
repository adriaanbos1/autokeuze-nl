// Startwaarden voor de vergelijking van financieringsvormen bij één auto.
import { aannames } from "@/regels/aannames";
import { financieringsScenarios, type AutoBezit, type ScenarioInvoer } from "@/engine";

export interface FinancieringKeuzes {
  eigenGeld: number;
  leningRente: number;
  aanbetaling: number;
  flRente: number;
  slottermijn: number;
  leaseOfferte: number | null;
}

/** Startwaarden: niets eigen geld, rentes uit de aannames, slottermijn 80% van de eindwaarde (afgerond op €500 omlaag). */
export function standaardKeuzes(bezit: AutoBezit): FinancieringKeuzes {
  const f = aannames.financiering;
  return {
    eigenGeld: 0,
    leningRente: f.leningRente.waarde,
    aanbetaling: 0,
    flRente: f.financialLeaseRente.waarde,
    slottermijn: Math.floor((bezit.restwaardeEinde * f.slottermijnAandeelRestwaarde.waarde) / 500) * 500,
    leaseOfferte: null,
  };
}

export function scenariosVoor(bezit: AutoBezit, k: FinancieringKeuzes) {
  const pl = aannames.privateLease;
  const invoer: ScenarioInvoer = {
    bezit,
    lening: { eigenGeld: k.eigenGeld, jaarrente: k.leningRente },
    financialLease: { aanbetaling: k.aanbetaling, jaarrente: k.flRente, slottermijn: k.slottermijn },
    privateLease: {
      offerte: k.leaseOfferte,
      kapitaalrente: pl.kapitaalrente.waarde,
      opslag: pl.opslag.waarde,
      eigenRisico: pl.eigenRisico.waarde,
      schadesPerJaar: pl.schadesPerJaar.waarde,
    },
  };
  return financieringsScenarios(invoer);
}
