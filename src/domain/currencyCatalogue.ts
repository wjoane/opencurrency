/** Provides currency names from the seeded catalogue and locale data. */

import { CURRENCY_SEED } from './appData';
import { normaliseCurrencyCode } from './currencyCode';
import { getCurrencyDisplayName } from './intlCapabilities';

const SEED_NAMES_BY_CODE: ReadonlyMap<string, string> = new Map(Object.entries(CURRENCY_SEED));

export function getCurrencyName(currencyCode: string, locale: string): string {
  const code = normaliseCurrencyCode(currencyCode);

  return getCurrencyDisplayName(code, locale) ?? SEED_NAMES_BY_CODE.get(code) ?? code.toUpperCase();
}

export function listSeededCurrencyCodes(): readonly string[] {
  return [...SEED_NAMES_BY_CODE.keys()];
}
