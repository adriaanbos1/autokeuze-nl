/** Rond af op centen (half naar boven). */
export function rond2(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

/** Som van bedragen die al op centen zijn afgerond, zonder zwevendekommaruis. */
export function som(...bedragen: number[]): number {
  return rond2(bedragen.reduce((a, b) => a + b, 0));
}

/**
 * Eén regel in een uitklapbare berekening: wat het bedrag is en hoe het
 * tot stand kwam. Elke engine-functie levert haar posten zo aan, zodat de
 * app altijd kan tonen "waar komt dit getal vandaan".
 */
export interface Post {
  label: string;
  bedrag: number;
  uitleg: string;
}
