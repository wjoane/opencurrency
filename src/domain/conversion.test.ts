import { convertAmount, type RateTable } from './conversion';
import { fromNumber, type MoneyAmount, toDecimalString, toFixedDecimalString } from './money';

const RATES: RateTable = {
  eur: 1,
  usd: 1.0871,
  jpy: 163.42,
  gbp: 0.85231,
  btc: 0.000011539,
};

function amount(value: number): MoneyAmount {
  const parsed = fromNumber(value);

  if (parsed === null) {
    throw new Error(`expected ${value} to be a valid amount`);
  }

  return parsed;
}

function converted(value: number, from: string, to: string, rates: RateTable = RATES): MoneyAmount {
  const result = convertAmount(amount(value), from, to, rates);

  if (result === null) {
    throw new Error(`expected ${from}→${to} to convert`);
  }

  return result;
}

describe('convertAmount', () => {
  it('converts from the reference currency', () => {
    expect(toDecimalString(converted(100, 'eur', 'usd'))).toBe('108.71');
  });

  it('converts to the reference currency', () => {
    expect(toFixedDecimalString(converted(108.71, 'usd', 'eur'), 2)).toBe('100.00');
  });

  it('converts between two currencies that are neither', () => {
    expect(toFixedDecimalString(converted(100, 'usd', 'jpy'), 2)).toBe('15032.66');
  });

  it('is the identity when the currencies are the same', () => {
    expect(toDecimalString(converted(13.49480249, 'usd', 'usd'))).toBe('13.49480249');
    expect(toDecimalString(converted(13.49480249, 'eur', 'eur'))).toBe('13.49480249');
  });

  it('needs no rate at all to convert a currency to itself', () => {
    expect(toDecimalString(converted(5, 'xyz', 'xyz', {}))).toBe('5');
  });

  it('leaves the amount unchanged when both rates are exactly 1', () => {
    expect(toDecimalString(converted(42.5, 'eur', 'par', { eur: 1, par: 1 }))).toBe('42.5');
  });

  it('treats the reference currency as 1 when the table omits it', () => {
    const withoutReference: RateTable = { usd: 1.0871 };

    expect(toDecimalString(converted(100, 'eur', 'usd', withoutReference))).toBe('108.71');
  });

  it('round-trips a value back through the reference currency', () => {
    const there = converted(100, 'usd', 'jpy');
    const back = convertAmount(there, 'jpy', 'usd', RATES);

    expect(back).not.toBeNull();
    expect(toFixedDecimalString(back as MoneyAmount, 10)).toBe('100.0000000000');
  });

  it('keeps the precision of a rate with many digits', () => {
    const inBitcoin = converted(1, 'eur', 'btc');

    expect(toDecimalString(inBitcoin)).toBe('0.000011539');
  });

  it('ignores the case and padding of currency codes', () => {
    expect(toDecimalString(converted(100, ' EUR ', 'USD'))).toBe('108.71');
  });

  it('returns null when a rate is missing', () => {
    expect(convertAmount(amount(100), 'usd', 'zzz', RATES)).toBeNull();
    expect(convertAmount(amount(100), 'zzz', 'usd', RATES)).toBeNull();
  });

  it('returns null for a rate that cannot be divided by', () => {
    expect(convertAmount(amount(100), 'usd', 'zar', { usd: 1.0871, zar: 0 })).toBeNull();
    expect(convertAmount(amount(100), 'zar', 'usd', { usd: 1.0871, zar: 0 })).toBeNull();
    expect(convertAmount(amount(100), 'usd', 'zar', { usd: 1.0871, zar: -3 })).toBeNull();
  });

  it('returns null for a rate that is not a finite number', () => {
    const malformed = {
      usd: 1.0871,
      one: '1.5',
      two: null,
      three: Number.NaN,
      four: Number.POSITIVE_INFINITY,
    } as unknown as RateTable;

    expect(convertAmount(amount(100), 'usd', 'one', malformed)).toBeNull();
    expect(convertAmount(amount(100), 'usd', 'two', malformed)).toBeNull();
    expect(convertAmount(amount(100), 'usd', 'three', malformed)).toBeNull();
    expect(convertAmount(amount(100), 'usd', 'four', malformed)).toBeNull();
  });

  it('does not mistake an inherited property for a rate', () => {
    expect(convertAmount(amount(100), 'usd', 'constructor', RATES)).toBeNull();
    expect(convertAmount(amount(100), 'constructor', 'usd', RATES)).toBeNull();
  });
});
