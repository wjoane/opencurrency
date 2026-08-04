/**
 * Formats precise amounts without converting them to JavaScript numbers.
 *
 * Decimal strings are grouped and decorated with locale separators and the
 * currency symbol.
 */

import { getMinorUnits, getSymbol } from './currencyMetadata';
import {
  getCurrencySymbolPlacement,
  getLocaleSeparators,
  type LocaleGroupSizes,
} from './intlCapabilities';
import { decimalExponent, type MoneyAmount, toFixedDecimalString } from './money';

export interface AmountFormatOptions {
  readonly currencyCode: string;
  readonly locale: string;
}

const DECIMAL_POINT = '.';
const ADAPTIVE_SIGNIFICANT_DIGITS = 8;

const MAX_ADAPTIVE_DECIMAL_PLACES = 12;

function adaptiveDecimalPlaces(amount: MoneyAmount): number {
  const places = ADAPTIVE_SIGNIFICANT_DIGITS - 1 - decimalExponent(amount);

  return Math.min(Math.max(places, 0), MAX_ADAPTIVE_DECIMAL_PLACES);
}

function trimTrailingFractionZeros(decimalString: string): string {
  return decimalString.includes(DECIMAL_POINT)
    ? decimalString.replace(/\.?0+$/, '')
    : decimalString;
}

export function toDisplayDecimalString(amount: MoneyAmount, currencyCode: string): string {
  const minorUnits = getMinorUnits(currencyCode);

  return minorUnits === null
    ? trimTrailingFractionZeros(toFixedDecimalString(amount, adaptiveDecimalPlaces(amount)))
    : toFixedDecimalString(amount, minorUnits);
}

function groupIntegerDigits(
  digits: string,
  groupSeparator: string,
  { primary, secondary }: LocaleGroupSizes,
): string {
  if (groupSeparator === '' || primary < 1 || digits.length <= primary) {
    return digits;
  }

  const groups = [digits.slice(digits.length - primary)];
  let remaining = digits.slice(0, digits.length - primary);

  while (secondary >= 1 && remaining.length > secondary) {
    groups.unshift(remaining.slice(remaining.length - secondary));
    remaining = remaining.slice(0, remaining.length - secondary);
  }

  groups.unshift(remaining);

  return groups.join(groupSeparator);
}

function formatDecimalString(decimalString: string, locale: string): string {
  const separators = getLocaleSeparators(locale);
  const [integerDigits, fractionDigits] = decimalString.split(DECIMAL_POINT);

  const grouped = groupIntegerDigits(integerDigits, separators.group, separators.groupSizes);
  const fraction = fractionDigits ? `${separators.decimal}${fractionDigits}` : '';

  return `${grouped}${fraction}`;
}

export function formatAmount(amount: MoneyAmount, options: AmountFormatOptions): string {
  const number = formatDecimalString(
    toDisplayDecimalString(amount, options.currencyCode),
    options.locale,
  );

  const symbol = getSymbol(options.currencyCode) ?? '';
  if (symbol === '') {
    return number;
  }

  const { position, separator } = getCurrencySymbolPlacement(options.locale);
  return position === 'before'
    ? `${symbol}${separator}${number}`
    : `${number}${separator}${symbol}`;
}

export function formatRate(rate: MoneyAmount, locale: string): string {
  const decimalString = trimTrailingFractionZeros(
    toFixedDecimalString(rate, adaptiveDecimalPlaces(rate)),
  );

  return formatDecimalString(decimalString, locale);
}
