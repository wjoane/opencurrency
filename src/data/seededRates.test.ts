import { BUNDLED_RATE_SNAPSHOT } from './seededRates';

describe('BUNDLED_RATE_SNAPSHOT', () => {
  it('contains the provider snapshot from 2026-08-01 with EUR as its base', () => {
    expect(BUNDLED_RATE_SNAPSHOT.date).toBe('2026-08-01');
    expect(BUNDLED_RATE_SNAPSHOT.baseCurrencyCode).toBe('eur');
    expect(BUNDLED_RATE_SNAPSHOT.rates).toMatchObject({ eur: 1, usd: 1.15291355 });
  });
});
