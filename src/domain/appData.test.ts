import appData from '../../assets/app-data.json';

import { BUNDLED_RATES_DOCUMENT, CURRENCY_SEED } from './appData';

const CURRENCIES = appData.currencies;

describe('the bundled app data', () => {
  it('ships currency names, metadata and the dated rate snapshot together', () => {
    expect(CURRENCY_SEED).toMatchObject({ eur: 'Euro', usd: 'US Dollar' });
    expect(CURRENCIES).toMatchObject({
      eur: { minorUnits: 2, symbol: '€', countryCode: 'eu' },
      usd: { minorUnits: 2, symbol: '$', countryCode: 'us' },
    });
    expect(BUNDLED_RATES_DOCUMENT).toMatchObject({
      date: '2026-08-01',
      eur: { eur: 1, usd: 1.15291355 },
    });
  });
});
