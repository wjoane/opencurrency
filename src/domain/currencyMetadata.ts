/** Provides symbols, minor units, and country metadata for currencies. */

import { getBundledCurrency } from './appData';

export function getMinorUnits(currencyCode: string): number | null {
  return getBundledCurrency(currencyCode)?.minorUnits ?? null;
}

export function getSymbol(currencyCode: string): string | null {
  return getBundledCurrency(currencyCode)?.symbol ?? null;
}

export function getCountryCode(currencyCode: string): string | null {
  return getBundledCurrency(currencyCode)?.countryCode ?? null;
}
