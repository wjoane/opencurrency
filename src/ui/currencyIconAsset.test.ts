import appData from '../../assets/app-data.json';

import { isOfferedCurrency } from '../domain/appData';
import { getCountryCode } from '../domain/currencyMetadata';

import { resolveCurrencyIconAsset } from './currencyIconAsset';
import { FLAG_ASSETS } from './flagAssets';
import { METAL_ASSETS } from './metalAssets';

const CURRENCIES = appData.currencies;

describe('resolveCurrencyIconAsset', () => {
  it('resolves a bundled country flag', () => {
    expect(resolveCurrencyIconAsset('jpy', 'jp')).toBe(FLAG_ASSETS.jp);
  });

  it.each(['xag', 'xau', 'xpd', 'xpt'])('prefers the bundled %s commodity icon', (currencyCode) => {
    expect(resolveCurrencyIconAsset(currencyCode, null)).toBe(METAL_ASSETS[currencyCode]);
  });

  it.each(['zz', 'constructor', '__proto__'])(
    'returns no asset for the unmapped country code %p',
    (countryCode) => {
      expect(resolveCurrencyIconAsset('btc', countryCode)).toBeUndefined();
    },
  );

  it.each(['constructor', '__proto__'])('returns no asset for the unknown code %p', (code) => {
    expect(resolveCurrencyIconAsset(code, null)).toBeUndefined();
  });
});

describe('flagAssets coverage', () => {
  const offeredCurrencyCodes = Object.keys(CURRENCIES).filter(isOfferedCurrency);

  it('ships a flag for every country an offered currency can name', () => {
    const missing = offeredCurrencyCodes
      .map(getCountryCode)
      .filter((country): country is string => country !== null)
      .filter((country) => !Object.hasOwn(FLAG_ASSETS, country));

    expect(missing).toEqual([]);
  });

  it('ships no flag that no offered currency can reach', () => {
    const reachable = new Set(offeredCurrencyCodes.map(getCountryCode));
    const unreachable = Object.keys(FLAG_ASSETS).filter((country) => !reachable.has(country));

    expect(unreachable).toEqual([]);
  });
});
