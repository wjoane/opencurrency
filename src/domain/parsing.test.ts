import { toDecimalString } from './money';
import { parseAmount } from './parsing';

function parsed(input: string): string {
  const amount = parseAmount(input);

  if (amount === null) {
    throw new Error(`expected ${JSON.stringify(input)} to parse`);
  }

  return toDecimalString(amount);
}

describe('parseAmount', () => {
  it('accepts either decimal separator', () => {
    expect(parsed('1.5')).toBe('1.5');
    expect(parsed('1,5')).toBe('1.5');
  });

  it('accepts a partially typed amount', () => {
    expect(parsed('1.')).toBe('1');
    expect(parsed('1,')).toBe('1');
    expect(parsed('.5')).toBe('0.5');
    expect(parsed(',5')).toBe('0.5');
  });

  it('accepts leading zeros', () => {
    expect(parsed('007')).toBe('7');
    expect(parsed('0.50')).toBe('0.5');
    expect(parsed('0')).toBe('0');
    expect(parsed('00.00')).toBe('0');
  });

  it('ignores surrounding whitespace', () => {
    expect(parsed('  12.34  ')).toBe('12.34');
  });

  it('keeps every digit typed, however many', () => {
    expect(parsed('0.123456789012345678901234567890')).toBe('0.12345678901234567890123456789');
  });

  it('rejects a second separator', () => {
    expect(parseAmount('1.5,5')).toBeNull();
    expect(parseAmount('1,5.5')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
    expect(parseAmount('1,234.56')).toBeNull();
  });

  it('rejects input with no digits', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('   ')).toBeNull();
    expect(parseAmount('.')).toBeNull();
    expect(parseAmount(',')).toBeNull();
  });

  it('rejects anything that is not a plain non-negative decimal', () => {
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1abc')).toBeNull();
    expect(parseAmount('-1')).toBeNull();
    expect(parseAmount('+1')).toBeNull();
    expect(parseAmount('1e5')).toBeNull();
    expect(parseAmount('0x1f')).toBeNull();
    expect(parseAmount('1 234')).toBeNull();
    expect(parseAmount('Infinity')).toBeNull();
    expect(parseAmount('NaN')).toBeNull();
  });

  it('rejects non-Latin digits', () => {
    expect(parseAmount('١٢٣')).toBeNull();
    expect(parseAmount('１２３')).toBeNull();
  });
});
