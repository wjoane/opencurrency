import { normalisePreferences, parsePreferences, serialisePreferences } from './preferences';

const DEFAULT_PREFERENCES = parsePreferences(null);

describe('parsePreferences', () => {
  it('falls back to the defaults when nothing is stored', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('falls back to the defaults for a body that is not an object', () => {
    expect(parsePreferences('not json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('[]')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('null')).toEqual(DEFAULT_PREFERENCES);
  });

  it('round-trips what it wrote', () => {
    const preferences = {
      theme: 'dark',
      language: 'de',
      currencyCodes: ['eur', 'usd', 'jpy'],
      activeCurrencyCode: 'jpy',
      amountText: '12,5',
    } as const;

    expect(parsePreferences(serialisePreferences(preferences))).toEqual(preferences);
  });

  it('falls back field by field rather than discarding the lot', () => {
    const stored = JSON.stringify({
      theme: 'sepia',
      language: '   ',
      currencyCodes: ['eur', 'gbp'],
      activeCurrencyCode: 'gbp',
      amountText: 42,
    });

    expect(parsePreferences(stored)).toEqual({
      theme: 'system',
      language: null,
      currencyCodes: ['eur', 'gbp'],
      activeCurrencyCode: 'gbp',
      amountText: DEFAULT_PREFERENCES.amountText,
    });
  });

  it('does not read an inherited property as a preference', () => {
    expect(parsePreferences('{"__proto__":{"theme":"dark"}}').theme).toBe('system');
  });

  it('normalises currency codes to lower case and drops duplicates', () => {
    const stored = JSON.stringify({ currencyCodes: ['EUR', ' usd ', 'eur', '', 7] });

    expect(parsePreferences(stored).currencyCodes).toEqual(['eur', 'usd']);
  });

  it('rejects a currency list too short to be a converter', () => {
    expect(parsePreferences(JSON.stringify({ currencyCodes: ['eur'] })).currencyCodes).toEqual(
      DEFAULT_PREFERENCES.currencyCodes,
    );
  });

  it('repairs an active currency that is not one of the rows', () => {
    const stored = JSON.stringify({
      currencyCodes: ['gbp', 'chf'],
      activeCurrencyCode: 'jpy',
    });

    expect(parsePreferences(stored).activeCurrencyCode).toBe('gbp');
  });
});

describe('normalisePreferences', () => {
  it('keeps the active currency when it is still a row', () => {
    const next = normalisePreferences({
      ...DEFAULT_PREFERENCES,
      currencyCodes: ['eur', 'usd'],
      activeCurrencyCode: 'USD',
    });

    expect(next.activeCurrencyCode).toBe('usd');
  });

  it('moves the active currency to the first row when its own row is gone', () => {
    const next = normalisePreferences({
      ...DEFAULT_PREFERENCES,
      currencyCodes: ['gbp', 'chf'],
      activeCurrencyCode: 'usd',
    });

    expect(next.activeCurrencyCode).toBe('gbp');
  });

  it('returns a normalized currency array when nothing about it changed', () => {
    const currencyCodes = ['eur', 'usd', 'jpy'];
    const preferences = { ...DEFAULT_PREFERENCES, currencyCodes };

    expect(normalisePreferences(preferences).currencyCodes).toEqual(currencyCodes);
    expect(normalisePreferences(preferences).currencyCodes).not.toBe(currencyCodes);
  });

  it('still returns a normalised array when the stored one needed correcting', () => {
    const currencyCodes = [' EUR ', 'usd', 'usd', ''];

    expect(normalisePreferences({ ...DEFAULT_PREFERENCES, currencyCodes }).currencyCodes).toEqual([
      'eur',
      'usd',
    ]);
  });

  it('carries no selected date', () => {
    expect(Object.keys(DEFAULT_PREFERENCES).sort()).toEqual([
      'activeCurrencyCode',
      'amountText',
      'currencyCodes',
      'language',
      'theme',
    ]);
  });
});
