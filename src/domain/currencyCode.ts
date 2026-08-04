/** Normalizes currency codes at application boundaries. */
export function normaliseCurrencyCode(currencyCode: string): string {
  return currencyCode.trim().toLowerCase();
}
