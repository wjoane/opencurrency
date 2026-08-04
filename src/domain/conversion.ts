/** Converts amounts through the reference currency. */

import { fromNumber, type MoneyAmount } from './money';
import { normaliseCurrencyCode } from './currencyCode';

export interface RateTable {
  readonly [currencyCode: string]: number;
}

/** The currency used as the rate-table reference. */
export const REFERENCE_CURRENCY_CODE = 'eur';

function findRate(rates: RateTable, currencyCode: string): MoneyAmount | null {
  const rate = rates[currencyCode];

  if (typeof rate !== 'number') {
    return currencyCode === REFERENCE_CURRENCY_CODE ? fromNumber(1) : null;
  }

  const amount = fromNumber(rate);

  return amount !== null && amount.gt(0) ? amount : null;
}

export function convertAmount(
  amount: MoneyAmount,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  rates: RateTable,
): MoneyAmount | null {
  const from = normaliseCurrencyCode(fromCurrencyCode);
  const to = normaliseCurrencyCode(toCurrencyCode);

  if (from === to) {
    return amount;
  }

  const fromRate = findRate(rates, from);
  const toRate = findRate(rates, to);

  if (fromRate === null || toRate === null) {
    return null;
  }

  return amount.div(fromRate).times(toRate);
}
