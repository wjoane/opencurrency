/** Exposes the static application data bundled in assets/app-data.json. */

import appData from '../../assets/app-data.json';

import { normaliseCurrencyCode } from './currencyCode';

export interface BundledCurrency {
  readonly name: string;
  readonly rate: number | null;
  readonly minorUnits: number | null;
  readonly symbol: string | null;
  readonly countryCode: string | null;
  readonly isIso4217: boolean;
}

const CURRENCIES: Readonly<Record<string, BundledCurrency>> = appData.currencies;

export const CURRENCY_SEED: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(CURRENCIES).map(([code, currency]) => [code, currency.name]),
);

export const BUNDLED_RATES_DOCUMENT = {
  date: appData.rateDate,
  eur: Object.fromEntries(
    Object.entries(CURRENCIES)
      .filter(([, currency]) => currency.rate !== null)
      .map(([code, currency]) => [code, currency.rate]),
  ),
};

export function getBundledCurrency(currencyCode: string): BundledCurrency | null {
  return CURRENCIES[normaliseCurrencyCode(currencyCode)] ?? null;
}

export function isOfferedCurrency(currencyCode: string): boolean {
  return getBundledCurrency(currencyCode) !== null;
}
