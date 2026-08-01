import { type RateTable } from '../../domain/conversion';
import { createTranslator } from '../../i18n';

import { buildCurrencyRows, type CurrencyRowsInput } from './rowModels';

const RATES: RateTable = { eur: 1, usd: 1.0842, jpy: 165.23, btc: 0.0000094 };

const t = createTranslator('en');

function build(overrides: Partial<CurrencyRowsInput> = {}) {
  return buildCurrencyRows({
    currencyCodes: ['eur', 'usd', 'jpy'],
    activeCurrencyCode: 'eur',
    amountText: '100',
    formatActiveAmount: false,
    rates: RATES,
    locale: 'en',
    t,
    ...overrides,
  });
}

function row(rows: readonly { currencyCode: string }[], currencyCode: string) {
  const found = rows.find((candidate) => candidate.currencyCode === currencyCode);

  if (found === undefined) {
    throw new Error(`no row for ${currencyCode}`);
  }

  return found as ReturnType<typeof build>[number];
}

describe('buildCurrencyRows', () => {
  it('produces one row per code, in the configured order', () => {
    expect(build().map((model) => model.currencyCode)).toEqual(['eur', 'usd', 'jpy']);
  });

  it('converts every inactive row from the active one', () => {
    const rows = build();

    expect(row(rows, 'usd').amountText).toBe('$ 108.42');
    expect(row(rows, 'jpy').amountText).toBe('¥ 16,523');
  });

  it('rounds each row to its own currency precision', () => {
    expect(row(build(), 'jpy').amountText).not.toContain('.');
  });

  it('shows the active row its raw text rather than a formatted amount', () => {
    const rows = build({ amountText: '1234567.8' });

    expect(row(rows, 'eur').amountText).toBe('1234567.8');
    expect(row(rows, 'usd').amountText).toBe('$ 1,338,518.41');
  });

  it('quotes the sub-line against the active currency', () => {
    const rows = build({ activeCurrencyCode: 'usd' });

    expect(row(rows, 'jpy').rateText).toBe('1 USD = 152.39808 JPY');
    expect(row(rows, 'eur').rateText).toBe('1 USD = 0.92233905 EUR');
  });

  it('says nothing on the active row, whichever currency it is', () => {
    expect(row(build({ activeCurrencyCode: 'usd' }), 'usd').rateText).toBeNull();
    expect(row(build(), 'eur').rateText).toBeNull();
  });

  it('keeps rate precision adaptive rather than rounding to the quote currency', () => {
    const rows = build({ currencyCodes: ['eur', 'btc'] });

    expect(row(rows, 'btc').rateText).toBe('1 EUR = 0.0000094 BTC');
  });

  it('marks exactly one row active', () => {
    expect(build().filter((model) => model.isActive)).toHaveLength(1);
  });

  it('hands the next active row an ungrouped, re-parseable amount', () => {
    const rows = build({ amountText: '1000000' });

    expect(row(rows, 'jpy').amountText).toBe('¥ 165,230,000');
    expect(row(rows, 'jpy').editableAmountText).toBe('165230000');
  });

  it('renders a placeholder rather than a wrong number when the amount is unparseable', () => {
    const rows = build({ amountText: 'abc' });

    expect(row(rows, 'usd').amountText).toBe('—');
    expect(row(rows, 'usd').editableAmountText).toBe('');
  });

  it('renders a placeholder for a currency the snapshot has no rate for', () => {
    const rows = build({ currencyCodes: ['eur', 'zwl'] });

    expect(row(rows, 'zwl').amountText).toBe('—');
    expect(row(rows, 'zwl').rateText).toBeNull();
  });

  it('survives an empty amount without throwing', () => {
    expect(() => build({ amountText: '' })).not.toThrow();
    expect(row(build({ amountText: '' }), 'usd').amountText).toBe('—');
  });

  it('announces the currency by name and by amount, not by raw code', () => {
    expect(row(build(), 'usd').accessibilityLabel).toContain('$ 108.42');
    expect(row(build(), 'usd').accessibilityLabel).not.toMatch(/^usd/);
  });

  it('formats through the locale rather than assuming English separators', () => {
    const rows = build({ amountText: '1000000', locale: 'de' });

    expect(row(rows, 'usd').amountText).toBe('$ 1.084.200,00');
  });

  it('carries a formatted placeholder alongside the active row’s raw text', () => {
    const rows = build({ amountText: '1234567.8' });

    expect(row(rows, 'eur').amountText).toBe('1234567.8');
    expect(row(rows, 'eur').placeholderAmountText).toBe('€ 1,234,567.80');
  });

  it('marks and announces only the active row in formatted presentation mode', () => {
    const rows = build({ formatActiveAmount: true });

    expect(row(rows, 'eur').isAmountFormatted).toBe(true);
    expect(row(rows, 'eur').amountText).toBe('€ 100.00');
    expect(row(rows, 'eur').accessibilityLabel).toContain('€ 100.00');
    expect(row(rows, 'usd').isAmountFormatted).toBe(false);
  });

  it('supplies the badge label an icon falls back to when there is no flag', () => {
    const rows = build({ currencyCodes: ['eur', 'btc'] });

    expect(row(rows, 'btc').badgeLabel).toBe('₿');
    expect(row(rows, 'btc').countryCode).toBeNull();
  });
});
