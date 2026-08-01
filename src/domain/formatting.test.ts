import { type AmountFormatOptions, formatAmount, formatRate } from './formatting';
import { fromDecimalString, fromNumber, type MoneyAmount } from './money';

function amount(value: number | string): MoneyAmount {
  const parsed = typeof value === 'number' ? fromNumber(value) : fromDecimalString(value);

  if (parsed === null) {
    throw new Error(`expected ${JSON.stringify(value)} to be a valid amount`);
  }

  return parsed;
}

function format(value: number | string, options: AmountFormatOptions): string {
  return formatAmount(amount(value), options);
}

describe('formatAmount precision', () => {
  it('uses the currency ISO-4217 minor units', () => {
    expect(format(1234.5678, { currencyCode: 'usd', locale: 'en' })).toBe('$ 1,234.57');
    expect(format(1234.5678, { currencyCode: 'jpy', locale: 'en' })).toBe('¥ 1,235');
    expect(format(1234.5678, { currencyCode: 'krw', locale: 'en' })).toBe('₩ 1,235');
    expect(format(1234.5678, { currencyCode: 'kwd', locale: 'en' })).toBe('د.ك 1,234.568');
    expect(format(1234.5678, { currencyCode: 'bhd', locale: 'en' })).toBe('د.ب 1,234.568');
  });

  it('pads to the minor units even when the amount is whole', () => {
    expect(format(5, { currencyCode: 'usd', locale: 'en' })).toBe('$ 5.00');
    expect(format(5, { currencyCode: 'jpy', locale: 'en' })).toBe('¥ 5');
    expect(format(5, { currencyCode: 'kwd', locale: 'en' })).toBe('د.ك 5.000');
  });

  it('rounds half-up at the display boundary', () => {
    expect(format('2.005', { currencyCode: 'usd', locale: 'en' })).toBe('$ 2.01');
    expect(format('0.5', { currencyCode: 'jpy', locale: 'en' })).toBe('¥ 1');
  });

  it('shows adaptive significant digits for codes ISO-4217 does not define', () => {
    expect(format(0.0052988758, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 0.0052988758');
    expect(format(0.000011539, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 0.000011539');
    expect(format(1.5, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 1.5');
    expect(format(1234.5678, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 1,234.5678');
  });

  it('shows adaptive significant digits for ISO codes with no minor unit', () => {
    expect(format(0.0052988758, { currencyCode: 'xau', locale: 'en' })).toBe('oz 0.0052988758');
  });

  it('trims trailing zeros from an adaptive fraction', () => {
    expect(format(1, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 1');
    expect(format('0.50', { currencyCode: 'btc', locale: 'en' })).toBe('₿ 0.5');
    expect(format(0, { currencyCode: 'btc', locale: 'en' })).toBe('₿ 0');
  });

  it('never rounds away integer digits to hit a significant-digit budget', () => {
    expect(format('12345678901', { currencyCode: 'btc', locale: 'en' })).toBe('₿ 12,345,678,901');
  });

  it('lets the decimal-place clamp cost significant digits below about 1e-5', () => {
    expect(format('0.000000012345678', { currencyCode: 'btc', locale: 'en' })).toBe(
      '₿ 0.000000012346',
    );
  });

  it('renders an amount below the adaptive floor as zero rather than a wall of digits', () => {
    expect(format('0.0000000000001', { currencyCode: 'btc', locale: 'en' })).toBe('₿ 0');
  });
});

describe('formatAmount symbols', () => {
  const NON_BREAKING_SPACE = ' ';

  it('puts a non-breaking space after every symbol', () => {
    expect(format(1, { currencyCode: 'usd', locale: 'en' })).toBe(`$${NON_BREAKING_SPACE}1.00`);
    expect(format(1, { currencyCode: 'eur', locale: 'en' })).toBe(`€${NON_BREAKING_SPACE}1.00`);
    expect(format(1, { currencyCode: 'btc', locale: 'en' })).toBe(`₿${NON_BREAKING_SPACE}1`);
  });

  it('uses native short symbols instead of qualified codes near the value', () => {
    expect(format(1, { currencyCode: 'cad', locale: 'en' })).toBe(`$${NON_BREAKING_SPACE}1.00`);
    expect(format(1, { currencyCode: 'egp', locale: 'en' })).toBe(`£${NON_BREAKING_SPACE}1.00`);
    expect(format(1, { currencyCode: 'tnd', locale: 'en' })).toBe(`د.ت${NON_BREAKING_SPACE}1.000`);
  });

  it('spaces an abbreviation from the number', () => {
    expect(format(1000, { currencyCode: 'chf', locale: 'en' })).toBe('1,000.00');
    expect(format(1000, { currencyCode: 'pln', locale: 'en' })).toBe(
      `zł${NON_BREAKING_SPACE}1,000.00`,
    );
  });

  it('omits the symbol when no shipped symbol exists', () => {
    expect(format(1, { currencyCode: '1inch', locale: 'en' })).toBe('1');
  });

  it('leads in a locale CLDR would put the symbol after the number in', () => {
    expect(format(1234.5, { currencyCode: 'eur', locale: 'de' })).toBe('€ 1.234,50');
  });

  it('keeps the minus sign in front of the symbol', () => {
    expect(format(-5, { currencyCode: 'usd', locale: 'en' })).toBe('-$ 5.00');
    expect(format(-5, { currencyCode: 'chf', locale: 'en' })).toBe('-5.00');
  });

  it('leaves a rate unsymbolised', () => {
    expect(formatRate(amount('152.31'), 'en')).toBe('152.31');
  });
});

describe('formatAmount grouping', () => {
  it('groups using the locale separators', () => {
    expect(format(1234.56, { currencyCode: 'usd', locale: 'en' })).toBe('$ 1,234.56');
    expect(format(1234.56, { currencyCode: 'usd', locale: 'de' })).toBe('$ 1.234,56');
    expect(format(1234.56, { currencyCode: 'usd', locale: 'ja' })).toBe('$ 1,234.56');
  });

  it('groups every three digits, however many there are', () => {
    expect(format(1000000, { currencyCode: 'usd', locale: 'en' })).toBe('$ 1,000,000.00');
    expect(format(100, { currencyCode: 'usd', locale: 'en' })).toBe('$ 100.00');
    expect(format(1000, { currencyCode: 'usd', locale: 'en' })).toBe('$ 1,000.00');
  });

  it('groups Indian numerals 2-2-3 rather than 3-3-3', () => {
    expect(format('1234567.5', { currencyCode: 'usd', locale: 'hi' })).toBe('$ 12,34,567.50');
    expect(format('123456789.5', { currencyCode: 'usd', locale: 'hi' })).toBe('$ 12,34,56,789.50');
    expect(format('1234567.5', { currencyCode: 'usd', locale: 'en' })).toBe('$ 1,234,567.50');
    expect(format('123456789.5', { currencyCode: 'usd', locale: 'de' })).toBe('$ 123.456.789,50');
  });

  it('groups locales that CLDR would not group at four digits', () => {
    expect(format(1234.56, { currencyCode: 'usd', locale: 'es' })).toBe('$ 1.234,56');
  });

  it('keeps a value a double could not have held', () => {
    expect(format('12345678901234567890.125', { currencyCode: 'usd', locale: 'en' })).toBe(
      '$ 12,345,678,901,234,567,890.13',
    );

    expect(String(Number('12345678901234567890.125'))).toBe('12345678901234567000');
  });

  it('uses Latin digits in every locale', () => {
    expect(format(1234.56, { currencyCode: 'usd', locale: 'ar' })).toBe('$ 1,234.56');
    expect(format(1234.56, { currencyCode: 'usd', locale: 'fa' })).toBe('$ 1,234.56');
    expect(format(1234.56, { currencyCode: 'usd', locale: 'hi' })).toBe('$ 1,234.56');
  });

  it('formats a negative amount', () => {
    expect(format('-1234.5', { currencyCode: 'usd', locale: 'en' })).toBe('-$ 1,234.50');
    expect(format('-1234.5', { currencyCode: 'usd', locale: 'de' })).toBe('-$ 1.234,50');
  });
});

describe('formatRate', () => {
  it('keeps decimals a zero-minor-unit currency would have rounded away', () => {
    expect(formatRate(amount('152.31'), 'en')).toBe('152.31');
    expect(formatAmount(amount('152.31'), { currencyCode: 'jpy', locale: 'en' })).toBe('¥ 152');
  });

  it('adapts to a rate small enough that two decimals would show zero', () => {
    expect(formatRate(amount('0.000010847'), 'en')).toBe('0.000010847');
  });

  it('trims trailing zeros rather than padding to a fixed width', () => {
    expect(formatRate(amount('1'), 'en')).toBe('1');
    expect(formatRate(amount('1.5000'), 'en')).toBe('1.5');
  });

  it('groups and separates in the locale, like every other number', () => {
    expect(formatRate(amount('1234567.5'), 'de')).toBe('1.234.567,5');
    expect(formatRate(amount('1234567.5'), 'en')).toBe('1,234,567.5');
  });
});
