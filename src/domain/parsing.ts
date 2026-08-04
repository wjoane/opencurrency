/** Parses editable amount text into a precise monetary value. */

import { fromDecimalString, type MoneyAmount } from './money';

const AMOUNT_PATTERN = /^(\d*)(?:[.,](\d*))?$/;

export function parseAmount(input: string): MoneyAmount | null {
  const match = AMOUNT_PATTERN.exec(input.trim());

  if (match === null) {
    return null;
  }

  const [, integerDigits, fractionDigits] = match;

  if (!integerDigits && !fractionDigits) {
    return null;
  }

  return fromDecimalString(`${integerDigits || '0'}.${fractionDigits || '0'}`);
}
