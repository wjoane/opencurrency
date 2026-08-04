import {
  fromDecimalString,
  fromNumber,
  type MoneyAmount,
  one,
  toFixedDecimalString,
} from './money';

const PROVIDER_RATES: [number, string][] = [
  [13.49480249, '13.49480249'],
  [0.0052988758, '0.0052988758'],
  [1, '1'],
  [1.0871, '1.0871'],
  [157.234, '157.234'],
  [0.000011539, '0.000011539'],
  [1234567.891011, '1234567.891011'],
  [0.9999999999999999, '0.9999999999999999'],
];

function expectAmount(amount: MoneyAmount | null): MoneyAmount {
  if (amount === null) {
    throw new Error('expected a MoneyAmount, got null');
  }

  return amount;
}

describe('one', () => {
  it('returns an exact unit amount', () => {
    expect(one().toFixed()).toBe('1');
  });
});

describe('fromNumber', () => {
  it.each(PROVIDER_RATES)('preserves every digit of %p', (rate, expected) => {
    expect(String(rate)).toBe(expected);
    expect(expectAmount(fromNumber(rate)).toFixed()).toBe(expected);
  });

  it.each(PROVIDER_RATES)('round-trips %p back to the same double', (rate) => {
    expect(Number(expectAmount(fromNumber(rate)).toFixed())).toBe(rate);
  });

  it('returns null for values that are not finite', () => {
    expect(fromNumber(Number.NaN)).toBeNull();
    expect(fromNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(fromNumber(Number.NEGATIVE_INFINITY)).toBeNull();
  });
});

describe('fromDecimalString', () => {
  it('accepts a plain decimal string', () => {
    expect(expectAmount(fromDecimalString('0.10')).toFixed()).toBe('0.1');
  });

  it('accepts exponential notation and renders it plainly', () => {
    expect(expectAmount(fromDecimalString('1.15e-8')).toFixed()).toBe('0.0000000115');
    expect(expectAmount(fromDecimalString('1.5e7')).toFixed()).toBe('15000000');
  });

  it('returns null instead of throwing on invalid input', () => {
    expect(fromDecimalString('')).toBeNull();
    expect(fromDecimalString('abc')).toBeNull();
    expect(fromDecimalString('1.2.3')).toBeNull();
    expect(fromDecimalString('0x1f')).toBeNull();
  });
});

describe('toFixedDecimalString', () => {
  it('rounds half-up at the display boundary', () => {
    expect(toFixedDecimalString(expectAmount(fromNumber(2.005)), 2)).toBe('2.01');
    expect(toFixedDecimalString(expectAmount(fromNumber(2.0049)), 2)).toBe('2.00');
    expect(toFixedDecimalString(expectAmount(fromNumber(0.5)), 0)).toBe('1');
    expect(toFixedDecimalString(expectAmount(fromNumber(1.5)), 0)).toBe('2');
  });

  it('rounds the decimal value, not its binary approximation', () => {
    expect((2.005).toFixed(2)).toBe('2.00');
    expect(toFixedDecimalString(expectAmount(fromNumber(2.005)), 2)).toBe('2.01');
  });

  it('pads to the requested number of decimal places', () => {
    expect(toFixedDecimalString(expectAmount(fromNumber(3)), 2)).toBe('3.00');
    expect(toFixedDecimalString(expectAmount(fromNumber(3)), 0)).toBe('3');
  });

  it('does not lose digits that a double could not hold', () => {
    const amount = expectAmount(fromDecimalString('12345678901234567890.125'));

    expect(toFixedDecimalString(amount, 2)).toBe('12345678901234567890.13');
  });
});
