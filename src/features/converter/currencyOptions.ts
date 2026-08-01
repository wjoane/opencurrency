/** Builds the localized options shown by the currency picker. */

import { type RateTable } from '../../domain/conversion';
import { getCurrencyName, listSeededCurrencyCodes } from '../../domain/currencyCatalogue';
import { getCountryCode, getSymbol } from '../../domain/currencyMetadata';
import { isOfferedCurrency } from '../../domain/currencyUniverse';

export interface CurrencyOption {
  readonly currencyCode: string;
  readonly currencyName: string;
  readonly countryCode: string | null;

  readonly badgeLabel: string;
}

export interface SelectableCurrencyOption extends CurrencyOption {
  readonly isAlreadyAdded: boolean;
}

export interface CurrencyOptionsInput {
  readonly rates: RateTable;
  readonly locale: string;
}

function normaliseCode(currencyCode: string): string {
  return currencyCode.trim().toLowerCase();
}

export function buildCurrencyOptions({ rates, locale }: CurrencyOptionsInput): CurrencyOption[] {
  const codes = new Set(
    [...listSeededCurrencyCodes(), ...Object.keys(rates)]
      .map(normaliseCode)
      .filter(isOfferedCurrency),
  );

  return [...codes].sort().map((currencyCode) => ({
    currencyCode,
    currencyName: getCurrencyName(currencyCode, locale),
    countryCode: getCountryCode(currencyCode),
    badgeLabel: getSymbol(currencyCode) ?? currencyCode.toUpperCase(),
  }));
}

export function filterCurrencyOptions(
  options: readonly CurrencyOption[],
  query: string,
  selectedCurrencyCodes: readonly string[],
): SelectableCurrencyOption[] {
  const needle = query.trim().toLowerCase();
  const selected = new Set(selectedCurrencyCodes.map(normaliseCode));

  const matches =
    needle === ''
      ? options
      : options.filter(
          (option) =>
            option.currencyCode.includes(needle) ||
            option.currencyName.toLowerCase().includes(needle),
        );

  return matches.map((option) => ({
    ...option,
    isAlreadyAdded: selected.has(option.currencyCode),
  }));
}
