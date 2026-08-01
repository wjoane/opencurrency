/** Builds presentational row data from preferences and rates. */

import { convertAmount, type RateTable } from '../../domain/conversion';
import { getCountryCode, getSymbol } from '../../domain/currencyMetadata';
import { getCurrencyName } from '../../domain/currencyCatalogue';
import { formatAmount, formatRate, toDisplayDecimalString } from '../../domain/formatting';
import { fromNumber, type MoneyAmount } from '../../domain/money';
import { parseAmount } from '../../domain/parsing';
import { type Translate } from '../../i18n';

export interface CurrencyRowModel {
  readonly currencyCode: string;
  readonly currencyName: string;
  readonly countryCode: string | null;

  readonly badgeLabel: string;

  readonly amountText: string;

  readonly placeholderAmountText: string;

  readonly editableAmountText: string;
  readonly rateText: string | null;
  readonly isActive: boolean;

  readonly isAmountFormatted: boolean;
  readonly accessibilityLabel: string;

  readonly amountAccessibilityLabel: string;
}

export interface CurrencyRowsInput {
  readonly currencyCodes: readonly string[];
  readonly activeCurrencyCode: string;

  readonly amountText: string;

  readonly formatActiveAmount: boolean;
  readonly rates: RateTable;
  readonly locale: string;
  readonly t: Translate;
}

const ONE = fromNumber(1);

function convertOrNull(
  amount: MoneyAmount | null,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  rates: RateTable,
): MoneyAmount | null {
  return amount === null ? null : convertAmount(amount, fromCurrencyCode, toCurrencyCode, rates);
}

function buildRateText(
  currencyCode: string,
  isActive: boolean,
  activeCurrencyCode: string,
  rates: RateTable,
  locale: string,
  t: Translate,
): string | null {
  if (isActive) {
    return null;
  }

  const rate = convertOrNull(ONE, activeCurrencyCode, currencyCode, rates);

  if (rate === null) {
    return null;
  }

  return t('converter.rateLine', {
    base: activeCurrencyCode.toUpperCase(),
    rate: formatRate(rate, locale),
    quote: currencyCode.toUpperCase(),
  });
}

function buildRow(currencyCode: string, input: CurrencyRowsInput): CurrencyRowModel {
  const { activeCurrencyCode, amountText, rates, locale, t } = input;
  const isActive = currencyCode === activeCurrencyCode;
  const converted = convertOrNull(parseAmount(amountText), activeCurrencyCode, currencyCode, rates);

  const formatted =
    converted === null
      ? t('converter.unavailableAmount')
      : formatAmount(converted, { currencyCode, locale });

  const currencyName = getCurrencyName(currencyCode, locale);
  const displayed = isActive && !input.formatActiveAmount ? amountText : formatted;

  return {
    currencyCode,
    currencyName,
    countryCode: getCountryCode(currencyCode),
    badgeLabel: getSymbol(currencyCode) ?? currencyCode.toUpperCase(),
    amountText: displayed,
    placeholderAmountText: formatted,
    editableAmountText: converted === null ? '' : toDisplayDecimalString(converted, currencyCode),
    rateText: buildRateText(currencyCode, isActive, activeCurrencyCode, rates, locale, t),
    isActive,
    isAmountFormatted: isActive && input.formatActiveAmount,
    accessibilityLabel: t('converter.rowLabel', { currency: currencyName, amount: displayed }),
    amountAccessibilityLabel: t('converter.amountLabel', { currency: currencyName }),
  };
}

export function buildCurrencyRows(input: CurrencyRowsInput): readonly CurrencyRowModel[] {
  return input.currencyCodes.map((currencyCode) => buildRow(currencyCode, input));
}
