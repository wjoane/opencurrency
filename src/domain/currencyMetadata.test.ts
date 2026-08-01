import { getCountryCode, getMinorUnits, getSymbol } from './currencyMetadata';
import { CURRENCIES } from './appData';

describe('getMinorUnits', () => {
  it('returns the ISO-4217 minor unit', () => {
    expect(getMinorUnits('usd')).toBe(2);
    expect(getMinorUnits('eur')).toBe(2);
    expect(getMinorUnits('jpy')).toBe(0);
    expect(getMinorUnits('krw')).toBe(0);
    expect(getMinorUnits('kwd')).toBe(3);
    expect(getMinorUnits('bhd')).toBe(3);
    expect(getMinorUnits('omr')).toBe(3);
    expect(getMinorUnits('mad')).toBe(2);
    expect(getMinorUnits('xcg')).toBe(2);
  });

  it('returns null for ISO codes that define no minor unit', () => {
    expect(getMinorUnits('xau')).toBeNull();
    expect(getMinorUnits('xag')).toBeNull();
    expect(getMinorUnits('xdr')).toBeNull();
  });

  it('returns null for codes outside ISO-4217, so they format adaptively', () => {
    expect(getMinorUnits('btc')).toBeNull();
    expect(getMinorUnits('eth')).toBeNull();
    expect(getMinorUnits('1inch')).toBeNull();
    expect(getMinorUnits('clf')).toBeNull();
    expect(getMinorUnits('')).toBeNull();
  });

  it('normalises case and surrounding whitespace', () => {
    expect(getMinorUnits('JPY')).toBe(0);
    expect(getMinorUnits(' Kwd ')).toBe(3);
  });

  it('does not resolve inherited object properties', () => {
    expect(getMinorUnits('constructor')).toBeNull();
    expect(getMinorUnits('valueOf')).toBeNull();
  });
});

describe('getSymbol', () => {
  it('returns the shipped symbol', () => {
    expect(getSymbol('usd')).toBe('$');
    expect(getSymbol('cad')).toBe('$');
    expect(getSymbol('egp')).toBe('£');
    expect(getSymbol('tnd')).toBe('د.ت');
    expect(getSymbol('aed')).toBe('د.إ');
    expect(getSymbol('mad')).toBe('د.م');
    expect(getSymbol('eur')).toBe('€');
    expect(getSymbol('jpy')).toBe('¥');
    expect(getSymbol('btc')).toBe('₿');
    expect(getSymbol('ada')).toBe('₳');
    expect(getSymbol('usdc')).toBe('$');
    expect(getSymbol('usdt')).toBe('₮');
    expect(getSymbol('xtz')).toBe('ꜩ');
  });

  it('returns null when no shipped symbol exists', () => {
    expect(getSymbol('1inch')).toBeNull();
    expect(getSymbol('unknown')).toBeNull();
  });

  it('does not resolve inherited object properties', () => {
    expect(getSymbol('constructor')).toBeNull();
  });
});

describe('getCountryCode', () => {
  it('derives the country from an ISO-4217 code', () => {
    expect(getCountryCode('usd')).toBe('us');
    expect(getCountryCode('jpy')).toBe('jp');
    expect(getCountryCode('chf')).toBe('ch');
    expect(getCountryCode('zar')).toBe('za');
  });

  it('lets the override table win over the two-letter rule', () => {
    expect(getCountryCode('eur')).toBe('eu');
    expect(getCountryCode('ang')).toBe('cw');
  });

  it('returns null for currencies no single country issues', () => {
    expect(getCountryCode('xaf')).toBeNull();
    expect(getCountryCode('xof')).toBeNull();
    expect(getCountryCode('xcd')).toBeNull();
    expect(getCountryCode('xpf')).toBeNull();
    expect(getCountryCode('xau')).toBeNull();
    expect(getCountryCode('xag')).toBeNull();
    expect(getCountryCode('xpt')).toBeNull();
    expect(getCountryCode('xpd')).toBeNull();
    expect(getCountryCode('xdr')).toBeNull();
  });

  it('never applies the two-letter rule to a non-ISO code', () => {
    expect(getCountryCode('btc')).toBeNull();
    expect(getCountryCode('eth')).toBeNull();
    expect(getCountryCode('sol')).toBeNull();
    expect(getCountryCode('ada')).toBeNull();
    expect(getCountryCode('dot')).toBeNull();
    expect(getCountryCode('usdt')).toBeNull();
    expect(getCountryCode('1inch')).toBeNull();
  });

  it('resolves the country override for an offered currency', () => {
    expect(getCountryCode('xcg')).toBe('cw');
  });

  it('does not retain excluded provider and special-purpose codes', () => {
    expect(getCountryCode('dem')).toBeNull();
    expect(getCountryCode('clf')).toBeNull();
  });

  it('normalises case and surrounding whitespace', () => {
    expect(getCountryCode('USD')).toBe('us');
    expect(getCountryCode(' EUR ')).toBe('eu');
  });

  it('does not resolve inherited object properties', () => {
    expect(getCountryCode('constructor')).toBeNull();
    expect(getCountryCode('toString')).toBeNull();
  });
});

describe('the bundled currency data', () => {
  it('uses lower-case currency codes and valid country codes', () => {
    for (const [code, currency] of Object.entries(CURRENCIES)) {
      expect(code).toBe(code.toLowerCase());

      if (currency.countryCode !== null) {
        expect(currency.countryCode).toMatch(/^[a-z]{2}$/);
      }
    }
  });

  it('records the currencies without a shipped short symbol', () => {
    const codesMissingSymbols = Object.entries(CURRENCIES)
      .filter(([, currency]) => currency.symbol === null)
      .map(([currencyCode]) => currencyCode)
      .sort();

    expect(codesMissingSymbols).toEqual([
      'aave',
      'algo',
      'apt',
      'arb',
      'atom',
      'avax',
      'bch',
      'bnb',
      'chf',
      'dai',
      'dot',
      'etc',
      'fil',
      'hbar',
      'icp',
      'link',
      'near',
      'op',
      'pol',
      'shib',
      'sol',
      'sui',
      'trx',
      'uni',
      'vet',
      'xlm',
      'xmr',
      'xrp',
    ]);
  });
});
