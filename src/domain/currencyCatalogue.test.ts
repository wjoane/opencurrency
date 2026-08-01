import { CURRENCY_SEED } from './appData';
import { getCurrencyName } from './currencyCatalogue';

const seed = CURRENCY_SEED;

describe('the bundled currency catalogue', () => {
  it('covers the currencies the app starts with and the ones its tables describe', () => {
    for (const code of ['eur', 'usd', 'jpy', 'kwd', 'btc']) {
      expect(seed[code]).toEqual(expect.any(String));
    }
  });

  it('is keyed by lower-case codes and holds no empty name', () => {
    for (const [code, name] of Object.entries(seed)) {
      expect(code).toBe(code.toLowerCase());
      expect(name.trim()).not.toBe('');
    }
  });
});

describe('getCurrencyName', () => {
  it('prefers the runtime-localised name when there is one', () => {
    expect(getCurrencyName('eur', 'de')).toBe('Euro');
    expect(getCurrencyName('usd', 'de')).toBe('US-Dollar');
  });

  it("falls back to the catalogue's English name for a code Intl cannot name", () => {
    expect(getCurrencyName('aave', 'de')).toBe(seed.aave);
    expect(getCurrencyName('btc', 'de')).toBe(seed.btc);
  });

  it('accepts any case and surrounding whitespace', () => {
    expect(getCurrencyName(' EUR ', 'en')).toBe(getCurrencyName('eur', 'en'));
  });

  it('falls back to the upper-case code for a currency it has never heard of', () => {
    expect(getCurrencyName('zzz', 'en')).toBe('ZZZ');
  });

  it('does not resolve an inherited property as a currency name', () => {
    expect(getCurrencyName('constructor', 'en')).toBe('CONSTRUCTOR');
    expect(getCurrencyName('toString', 'en')).toBe('TOSTRING');
  });
});
