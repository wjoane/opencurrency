import { type RateTable } from '../../domain/conversion';

import { buildCurrencyOptions, filterCurrencyOptions } from './currencyOptions';

const NO_RATES: RateTable = {};

function codesOf(options: readonly { currencyCode: string }[]): string[] {
  return options.map((option) => option.currencyCode);
}

describe('buildCurrencyOptions', () => {
  it('offers the seeded currencies with no rates at all', () => {
    const options = buildCurrencyOptions({ rates: NO_RATES, locale: 'en' });

    expect(options.length).toBeGreaterThan(150);
    expect(codesOf(options)).toContain('jpy');
  });

  it('offers only currencies the curated universe admits', () => {
    const codes = codesOf(buildCurrencyOptions({ rates: NO_RATES, locale: 'en' }));

    expect(codes).toContain('btc');
    expect(codes).toContain('xau');

    expect(codes).not.toContain('1inch');
    expect(codes).not.toContain('dem');
    expect(codes).not.toContain('jep');
  });

  it('includes a currency the snapshot has but the seed predates', () => {
    const options = buildCurrencyOptions({
      rates: { eur: 1, kpw: 2 },
      locale: 'en',
    });

    expect(codesOf(options)).toContain('kpw');
  });

  it('refuses a key that is not shaped like a currency code', () => {
    const codes = codesOf(
      buildCurrencyOptions({
        rates: {
          eur: 1,
          '': 1,
          x: 1,
          '../../etc': 1,
          'a b': 1,
          thisiswaytoolongforacode: 1,
          ÉUR: 1,
        } as unknown as RateTable,
        locale: 'en',
      }),
    );

    expect(codes).toContain('eur');
    expect(codes).not.toContain('');
    expect(codes).not.toContain('x');
    expect(codes).not.toContain('../../etc');
    expect(codes).not.toContain('a b');
    expect(codes).not.toContain('thisiswaytoolongforacode');
    expect(codes).not.toContain('éur');
  });

  it('lists a currency once even when it is in both the seed and the snapshot', () => {
    const codes = codesOf(buildCurrencyOptions({ rates: { jpy: 165 }, locale: 'en' }));

    expect(codes.filter((code) => code === 'jpy')).toHaveLength(1);
  });

  it('orders by code, so the list does not reshuffle when the language changes', () => {
    const english = codesOf(buildCurrencyOptions({ rates: NO_RATES, locale: 'en' }));
    const german = codesOf(buildCurrencyOptions({ rates: NO_RATES, locale: 'de' }));

    expect(german).toEqual(english);
    expect([...english]).toEqual([...english].sort());
  });

  it('names each currency in the requested locale', () => {
    const [english] = buildCurrencyOptions({ rates: { usd: 1 }, locale: 'en' }).filter(
      (option) => option.currencyCode === 'usd',
    );

    expect(english.currencyName).toBe('US Dollar');
  });

  it('carries the country so the row can draw a flag, and null where there is none', () => {
    const options = buildCurrencyOptions({ rates: { jpy: 1, btc: 1 }, locale: 'en' });
    const byCode = new Map(options.map((option) => [option.currencyCode, option]));

    expect(byCode.get('jpy')?.countryCode).toBe('jp');
    expect(byCode.get('btc')?.countryCode).toBeNull();
  });
});

describe('filterCurrencyOptions', () => {
  const OPTIONS = [
    { currencyCode: 'eur', currencyName: 'Euro', countryCode: 'eu', badgeLabel: '€' },
    { currencyCode: 'jpy', currencyName: 'Japanese Yen', countryCode: 'jp', badgeLabel: '¥' },
    { currencyCode: 'usd', currencyName: 'US Dollar', countryCode: 'us', badgeLabel: '$' },
  ];

  it('matches on the code', () => {
    expect(codesOf(filterCurrencyOptions(OPTIONS, 'jp', []))).toEqual(['jpy']);
  });

  it('matches on the localised name', () => {
    expect(codesOf(filterCurrencyOptions(OPTIONS, 'yen', []))).toEqual(['jpy']);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(codesOf(filterCurrencyOptions(OPTIONS, '  DOLLAR ', []))).toEqual(['usd']);
  });

  it('treats an empty query as no filter rather than as no match', () => {
    expect(filterCurrencyOptions(OPTIONS, '   ', [])).toHaveLength(OPTIONS.length);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterCurrencyOptions(OPTIONS, 'zzz', [])).toEqual([]);
  });

  it('marks an already-added currency rather than removing it', () => {
    const matches = filterCurrencyOptions(OPTIONS, '', ['jpy']);

    expect(codesOf(matches)).toEqual(['eur', 'jpy', 'usd']);
    expect(matches.find((option) => option.currencyCode === 'jpy')?.isAlreadyAdded).toBe(true);
    expect(matches.find((option) => option.currencyCode === 'usd')?.isAlreadyAdded).toBe(false);
  });

  it('recognises an added currency whatever case it is stored in', () => {
    const matches = filterCurrencyOptions(OPTIONS, '', ['JPY']);

    expect(matches.find((option) => option.currencyCode === 'jpy')?.isAlreadyAdded).toBe(true);
  });
});
