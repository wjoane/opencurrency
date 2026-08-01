import { CURRENCY_SEED } from './appData';
import { getCurrencyDisplayName } from './intlCapabilities';

const SEED_NAMES_BY_CODE: ReadonlyMap<string, string> = new Map(Object.entries(CURRENCY_SEED));

function normaliseCode(currencyCode: string): string {
  return currencyCode.trim().toLowerCase();
}

export function getCurrencyName(currencyCode: string, locale: string): string {
  const code = normaliseCode(currencyCode);

  return getCurrencyDisplayName(code, locale) ?? SEED_NAMES_BY_CODE.get(code) ?? code.toUpperCase();
}

export function listSeededCurrencyCodes(): readonly string[] {
  return [...SEED_NAMES_BY_CODE.keys()];
}
/** Provides currency names from the seeded catalogue and locale data. */
