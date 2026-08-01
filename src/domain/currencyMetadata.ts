import { getBundledCurrency } from './appData';

function normaliseCode(currencyCode: string): string {
  return currencyCode.trim().toLowerCase();
}

export function getMinorUnits(currencyCode: string): number | null {
  return getBundledCurrency(normaliseCode(currencyCode))?.minorUnits ?? null;
}

export function getSymbol(currencyCode: string): string | null {
  return getBundledCurrency(normaliseCode(currencyCode))?.symbol ?? null;
}

export function getCountryCode(currencyCode: string): string | null {
  return getBundledCurrency(normaliseCode(currencyCode))?.countryCode ?? null;
}
/** Provides symbols, minor units, and country metadata for currencies. */
