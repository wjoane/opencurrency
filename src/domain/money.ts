/** Provides the configured precise decimal type used for monetary values. */

import BigDecimal from 'big.js';

const WORKING_DECIMAL_PLACES = 30;

BigDecimal.DP = WORKING_DECIMAL_PLACES;
BigDecimal.RM = BigDecimal.roundHalfUp;

BigDecimal.NE = -WORKING_DECIMAL_PLACES;
BigDecimal.PE = WORKING_DECIMAL_PLACES;

export type MoneyAmount = BigDecimal;

/** Creates the multiplicative identity used for unit-rate display. */
export function one(): MoneyAmount {
  return new BigDecimal(1);
}

/** Creates a monetary value from a finite number. */
export function fromNumber(value: number): MoneyAmount | null {
  return fromDecimalString(String(value));
}

/** Creates a monetary value from a decimal string. */
export function fromDecimalString(value: string): MoneyAmount | null {
  try {
    return new BigDecimal(value);
  } catch {
    return null;
  }
}

export function decimalExponent(amount: MoneyAmount): number {
  return amount.e;
}

export function toFixedDecimalString(amount: MoneyAmount, decimalPlaces: number): string {
  return amount.toFixed(decimalPlaces, BigDecimal.roundHalfUp);
}
