import { getBundledCurrency } from './appData';

function normaliseCode(currencyCode: string): string {
  return currencyCode.trim().toLowerCase();
}

export function isOfferedCurrency(currencyCode: string): boolean {
  const code = normaliseCode(currencyCode);

  return getBundledCurrency(code) !== null;
}
/** Defines the currencies offered by the add-currency picker. */
