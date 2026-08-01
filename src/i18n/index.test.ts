import { type Catalogue, createTranslator, FALLBACK_LOCALE, resolveLocale } from './index';

const PARTIAL_CATALOGUES: Readonly<Record<string, Catalogue>> = {
  de: { 'settings.title': 'Einstellungen' },
};

describe('resolveLocale', () => {
  it('returns a supported locale unchanged', () => {
    expect(resolveLocale(['en'])).toBe('en');
  });

  it('matches a regional variant to its base catalogue', () => {
    expect(resolveLocale(['en-GB'])).toBe('en');
    expect(resolveLocale(['en-US-u-nu-latn'])).toBe('en');
  });

  it('walks the preference list rather than giving up on the first miss', () => {
    expect(resolveLocale(['kl-GL', 'en-AU'])).toBe('en');
  });

  it('falls back when nothing in the list is supported', () => {
    expect(resolveLocale(['kl-GL'])).toBe(FALLBACK_LOCALE);
    expect(resolveLocale([])).toBe(FALLBACK_LOCALE);
  });
});

describe('createTranslator', () => {
  it('looks a key up in the catalogue', () => {
    expect(createTranslator('en')('settings.title')).toBe('Settings');
  });

  it('falls back to English for an unsupported locale', () => {
    expect(createTranslator('kl')('settings.title')).toBe(createTranslator('en')('settings.title'));
  });

  it('substitutes values into placeholders', () => {
    expect(createTranslator('en')('header.ratesFrom', { date: '2026-07-27' })).toBe(
      'Rates from 2026-07-27',
    );
  });

  it('substitutes numbers as well as strings', () => {
    expect(createTranslator('en')('converter.rowLabel', { currency: 'Euro', amount: 12 })).toBe(
      'Euro, 12',
    );
  });

  it('leaves a placeholder alone when no value is supplied for it', () => {
    expect(createTranslator('en')('header.ratesFrom')).toBe('Rates from {date}');
    expect(createTranslator('en')('converter.rateLine', { base: 'EUR', quote: 'USD' })).toBe(
      '1 EUR = {rate} USD',
    );
  });

  it('ignores values that match no placeholder', () => {
    expect(createTranslator('en')('settings.title', { unused: 'ignored' })).toBe('Settings');
  });

  it('does not substitute inherited object properties into a placeholder', () => {
    const translate = createTranslator('de', {
      de: { 'settings.title': 'Built by {constructor} and {toString}' },
    });

    expect(translate('settings.title', { locale: 'de' })).toBe(
      'Built by {constructor} and {toString}',
    );
  });

  describe('per-key catalogue fallback', () => {
    it('uses the catalogue entry when the locale has one', () => {
      expect(createTranslator('de', PARTIAL_CATALOGUES)('settings.title')).toBe('Einstellungen');
    });

    it('falls back to English for the keys the catalogue is missing', () => {
      const translate = createTranslator('de', PARTIAL_CATALOGUES);

      expect(translate('sheet.close')).toBe(createTranslator('en')('sheet.close'));
      expect(translate('header.ratesFrom', { date: '2026-07-27' })).toBe('Rates from 2026-07-27');
    });

    it('matches a regional variant to its base catalogue', () => {
      expect(createTranslator('de-AT', PARTIAL_CATALOGUES)('settings.title')).toBe('Einstellungen');
    });

    it('falls back to English wholesale for a locale the map has no entry for', () => {
      expect(createTranslator('kl', PARTIAL_CATALOGUES)('settings.title')).toBe('Settings');
    });
  });
});
