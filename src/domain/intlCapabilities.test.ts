import {
  getCurrencyDisplayName,
  getCurrencySymbolPlacement,
  getLocaleSeparators,
  type LocaleGroupSizes,
} from './intlCapabilities';

type IntlCapabilities = typeof import('./intlCapabilities');

const WESTERN: LocaleGroupSizes = { primary: 3, secondary: 3 };

const INDIAN: LocaleGroupSizes = { primary: 3, secondary: 2 };

const globalWithIntl = globalThis as { Intl?: typeof Intl };
const realIntl = Intl;

const SUPPORTED_LOCALES = [
  'en',
  'de',
  'fr',
  'es',
  'pt-BR',
  'it',
  'nl',
  'pl',
  'ru',
  'tr',
  'uk',
  'cs',
  'sv',
  'da',
  'fi',
  'el',
  'hi',
  'id',
  'th',
  'vi',
  'ja',
  'ko',
  'zh-Hans',
  'zh-Hant',
  'ar',
  'he',
  'fa',
];

function loadWithout(intl: typeof Intl | undefined): IntlCapabilities {
  jest.resetModules();

  if (intl === undefined) {
    delete globalWithIntl.Intl;
  } else {
    globalWithIntl.Intl = intl;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./intlCapabilities');
}

function stubIntl(overrides: Partial<typeof Intl>): typeof Intl {
  return Object.assign(Object.create(realIntl) as typeof Intl, overrides);
}

afterEach(() => {
  globalWithIntl.Intl = realIntl;
  jest.resetModules();
});

describe('getLocaleSeparators with a working Intl', () => {
  it('reads the locale separators from Intl', () => {
    expect(getLocaleSeparators('de-DE')).toEqual({ group: '.', decimal: ',', groupSizes: WESTERN });
    expect(getLocaleSeparators('en-US')).toEqual({ group: ',', decimal: '.', groupSizes: WESTERN });
  });

  it('reads separators for locales that do not group four-digit numbers', () => {
    expect(getLocaleSeparators('es').group).toBe('.');
    expect(getLocaleSeparators('it').group).toBe('.');
    expect(getLocaleSeparators('pl').group).toBe('\u00A0');
  });

  it('reads the Latin separators for locales whose default numbering is not Latin', () => {
    expect(getLocaleSeparators('fa')).toEqual({ group: ',', decimal: '.', groupSizes: WESTERN });
    expect(getLocaleSeparators('ar-EG')).toEqual({ group: ',', decimal: '.', groupSizes: WESTERN });
  });

  it('reads the Indic digit-group pattern rather than assuming three', () => {
    expect(getLocaleSeparators('hi').groupSizes).toEqual(INDIAN);
    expect(getLocaleSeparators('hi-IN').groupSizes).toEqual(INDIAN);
    expect(getLocaleSeparators('en').groupSizes).toEqual(WESTERN);
  });
});

describe('getLocaleSeparators without a usable Intl', () => {
  it('falls back to the shipped table when Intl is absent', () => {
    const { getLocaleSeparators } = loadWithout(undefined);

    expect(getLocaleSeparators('de-DE')).toEqual({ group: '.', decimal: ',', groupSizes: WESTERN });
    expect(getLocaleSeparators('fr')).toEqual({
      group: '\u202F',
      decimal: ',',
      groupSizes: WESTERN,
    });
  });

  it('falls back when NumberFormat has no formatToParts', () => {
    const { getLocaleSeparators } = loadWithout(
      stubIntl({ NumberFormat: function NumberFormat() {} as unknown as typeof Intl.NumberFormat }),
    );

    expect(getLocaleSeparators('ru')).toEqual({
      group: '\u00A0',
      decimal: ',',
      groupSizes: WESTERN,
    });
  });

  it('falls back when formatToParts throws', () => {
    const throwingNumberFormat = function NumberFormat() {
      return {
        formatToParts() {
          throw new RangeError('unsupported');
        },
      };
    } as unknown as typeof Intl.NumberFormat;

    const { getLocaleSeparators } = loadWithout(stubIntl({ NumberFormat: throwingNumberFormat }));

    expect(getLocaleSeparators('ja')).toEqual({ group: ',', decimal: '.', groupSizes: WESTERN });
  });

  it('falls back when formatToParts reports no separators', () => {
    const partsOnlyNumberFormat = function NumberFormat() {
      return {
        formatToParts: () => [{ type: 'integer', value: '1234567' }],
      };
    } as unknown as typeof Intl.NumberFormat;

    const { getLocaleSeparators } = loadWithout(stubIntl({ NumberFormat: partsOnlyNumberFormat }));

    expect(getLocaleSeparators('es')).toEqual({ group: '.', decimal: ',', groupSizes: WESTERN });
  });

  it('serves every supported locale exactly as CLDR does', () => {
    const fromIntl = SUPPORTED_LOCALES.map((locale) => getLocaleSeparators(locale));

    const withoutIntl = loadWithout(undefined);
    const fallbacks = SUPPORTED_LOCALES.map((locale) => withoutIntl.getLocaleSeparators(locale));

    expect(fallbacks).toEqual(fromIntl);
  });

  it('ships the Indic digit-group pattern, not just the Indic separators', () => {
    const { getLocaleSeparators } = loadWithout(undefined);

    expect(getLocaleSeparators('hi')).toEqual({ group: ',', decimal: '.', groupSizes: INDIAN });
  });

  it('falls back to the English defaults for an unlisted locale', () => {
    const { getLocaleSeparators } = loadWithout(undefined);

    expect(getLocaleSeparators('xx-YY')).toEqual({ group: ',', decimal: '.', groupSizes: WESTERN });
  });
});

describe('getCurrencySymbolPlacement', () => {
  it('reads the placement from Intl', () => {
    expect(getCurrencySymbolPlacement('en')).toEqual({ position: 'before', separator: '' });
    expect(getCurrencySymbolPlacement('de')).toEqual({
      position: 'after',
      separator: '\u00A0',
    });
    expect(getCurrencySymbolPlacement('pt-BR')).toEqual({
      position: 'before',
      separator: '\u00A0',
    });
  });

  it('serves every supported locale exactly as CLDR does', () => {
    const fromIntl = SUPPORTED_LOCALES.map((locale) => getCurrencySymbolPlacement(locale));

    const withoutIntl = loadWithout(undefined);
    const fallbacks = SUPPORTED_LOCALES.map((locale) =>
      withoutIntl.getCurrencySymbolPlacement(locale),
    );

    expect(fallbacks).toEqual(fromIntl);
  });

  it('falls back to the English default for an unlisted locale', () => {
    const { getCurrencySymbolPlacement: withoutIntl } = loadWithout(undefined);

    expect(withoutIntl('xx-YY')).toEqual({ position: 'before', separator: '' });
  });

  it('falls back when the currency style is unsupported', () => {
    const throwingNumberFormat = function NumberFormat() {
      throw new RangeError('currency style is not supported');
    } as unknown as typeof Intl.NumberFormat;

    const { getCurrencySymbolPlacement: withoutIntl } = loadWithout(
      stubIntl({ NumberFormat: throwingNumberFormat }),
    );

    expect(withoutIntl('de')).toEqual({ position: 'after', separator: '\u00A0' });
  });

  it('falls back when the parts carry no currency', () => {
    const currencylessNumberFormat = function NumberFormat() {
      return {
        formatToParts: () => [{ type: 'integer', value: '1234567' }],
      };
    } as unknown as typeof Intl.NumberFormat;

    const { getCurrencySymbolPlacement: withoutIntl } = loadWithout(
      stubIntl({ NumberFormat: currencylessNumberFormat }),
    );

    expect(withoutIntl('ja')).toEqual({ position: 'before', separator: '' });
  });
});

describe('getCurrencyDisplayName with a working Intl', () => {
  it('returns a localised name for an ISO-4217 code', () => {
    const name = getCurrencyDisplayName('USD', 'de');

    expect(name).not.toBeNull();
    expect(name).not.toBe('USD');
  });

  it('accepts a lower-case code, as the provider returns them', () => {
    expect(getCurrencyDisplayName('usd', 'ja')).not.toBeNull();
  });

  it('returns null for a code ICU has no name for', () => {
    expect(getCurrencyDisplayName('BTC', 'en')).toBeNull();
  });

  it('returns null rather than throwing for codes that are not three ASCII letters', () => {
    expect(getCurrencyDisplayName('1inch', 'en')).toBeNull();
    expect(getCurrencyDisplayName('US', 'en')).toBeNull();
    expect(getCurrencyDisplayName('USDT', 'en')).toBeNull();
    expect(getCurrencyDisplayName('', 'en')).toBeNull();
    expect(getCurrencyDisplayName('€UR', 'en')).toBeNull();
  });

  it('would have thrown had the code been passed through unguarded', () => {
    expect(() => new Intl.DisplayNames(['en'], { type: 'currency' }).of('1inch')).toThrow(
      RangeError,
    );
  });
});

describe('getCurrencyDisplayName without a usable Intl', () => {
  it('returns null when Intl is absent', () => {
    const { getCurrencyDisplayName } = loadWithout(undefined);

    expect(getCurrencyDisplayName('USD', 'de')).toBeNull();
  });

  it('returns null when Intl.DisplayNames is missing', () => {
    const { getCurrencyDisplayName } = loadWithout(stubIntl({ DisplayNames: undefined }));

    expect(getCurrencyDisplayName('USD', 'de')).toBeNull();
  });

  it('returns null when the DisplayNames constructor throws', () => {
    const throwingDisplayNames = function DisplayNames() {
      throw new RangeError('currency display names are not supported');
    } as unknown as typeof Intl.DisplayNames;

    const { getCurrencyDisplayName } = loadWithout(
      stubIntl({ DisplayNames: throwingDisplayNames }),
    );

    expect(getCurrencyDisplayName('USD', 'de')).toBeNull();
  });

  it('returns null when of() throws for an otherwise valid code', () => {
    const throwingOf = function DisplayNames() {
      return {
        of() {
          throw new RangeError('unsupported');
        },
      };
    } as unknown as typeof Intl.DisplayNames;

    const { getCurrencyDisplayName } = loadWithout(stubIntl({ DisplayNames: throwingOf }));

    expect(getCurrencyDisplayName('USD', 'de')).toBeNull();
  });
});
