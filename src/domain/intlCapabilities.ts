import { baseLocaleTag, lookupByLocaleTag } from './localeTags';

export interface LocaleGroupSizes {
  readonly primary: number;

  readonly secondary: number;
}

interface LocaleSeparators {
  readonly group: string;

  readonly decimal: string;
  readonly groupSizes: LocaleGroupSizes;
}

interface CurrencySymbolPlacement {
  readonly position: 'before' | 'after';
  readonly separator: string;
}

const NON_BREAKING_SPACE = '\u00A0';
const NARROW_NON_BREAKING_SPACE = '\u202F';
const RIGHT_TO_LEFT_MARK = '\u200F';

const WESTERN_GROUP_SIZES: LocaleGroupSizes = { primary: 3, secondary: 3 };
const INDIAN_GROUP_SIZES: LocaleGroupSizes = { primary: 3, secondary: 2 };

function localeSeparators(
  group: string,
  decimal: string,
  groupSizes: LocaleGroupSizes = WESTERN_GROUP_SIZES,
): LocaleSeparators {
  return { group, decimal, groupSizes };
}

const FALLBACK_SEPARATORS: Readonly<Record<string, LocaleSeparators>> = {
  en: localeSeparators(',', '.'),
  de: localeSeparators('.', ','),
  fr: localeSeparators(NARROW_NON_BREAKING_SPACE, ','),
  es: localeSeparators('.', ','),
  'pt-BR': localeSeparators('.', ','),
  it: localeSeparators('.', ','),
  nl: localeSeparators('.', ','),
  pl: localeSeparators(NON_BREAKING_SPACE, ','),
  ru: localeSeparators(NON_BREAKING_SPACE, ','),
  tr: localeSeparators('.', ','),
  uk: localeSeparators(NON_BREAKING_SPACE, ','),
  cs: localeSeparators(NON_BREAKING_SPACE, ','),
  sv: localeSeparators(NON_BREAKING_SPACE, ','),
  da: localeSeparators('.', ','),
  fi: localeSeparators(NON_BREAKING_SPACE, ','),
  el: localeSeparators('.', ','),
  hi: localeSeparators(',', '.', INDIAN_GROUP_SIZES),
  id: localeSeparators('.', ','),
  th: localeSeparators(',', '.'),
  vi: localeSeparators('.', ','),
  ja: localeSeparators(',', '.'),
  ko: localeSeparators(',', '.'),
  'zh-Hans': localeSeparators(',', '.'),
  'zh-Hant': localeSeparators(',', '.'),
  ar: localeSeparators(',', '.'),
  he: localeSeparators(',', '.'),
  fa: localeSeparators(',', '.'),
};

const DEFAULT_SEPARATORS = FALLBACK_SEPARATORS.en;

const BEFORE_WITHOUT_SEPARATOR: CurrencySymbolPlacement = { position: 'before', separator: '' };
const BEFORE_WITH_SPACE: CurrencySymbolPlacement = {
  position: 'before',
  separator: NON_BREAKING_SPACE,
};
const AFTER_WITH_SPACE: CurrencySymbolPlacement = {
  position: 'after',
  separator: NON_BREAKING_SPACE,
};

const FALLBACK_SYMBOL_PLACEMENTS: Readonly<Record<string, CurrencySymbolPlacement>> = {
  en: BEFORE_WITHOUT_SEPARATOR,
  de: AFTER_WITH_SPACE,
  fr: AFTER_WITH_SPACE,
  es: AFTER_WITH_SPACE,
  'pt-BR': BEFORE_WITH_SPACE,
  it: AFTER_WITH_SPACE,
  nl: BEFORE_WITH_SPACE,
  pl: AFTER_WITH_SPACE,
  ru: AFTER_WITH_SPACE,
  tr: BEFORE_WITHOUT_SEPARATOR,
  uk: AFTER_WITH_SPACE,
  cs: AFTER_WITH_SPACE,
  sv: AFTER_WITH_SPACE,
  da: AFTER_WITH_SPACE,
  fi: AFTER_WITH_SPACE,
  el: AFTER_WITH_SPACE,
  hi: BEFORE_WITHOUT_SEPARATOR,
  id: BEFORE_WITHOUT_SEPARATOR,
  th: BEFORE_WITHOUT_SEPARATOR,
  vi: AFTER_WITH_SPACE,
  ja: BEFORE_WITHOUT_SEPARATOR,
  ko: BEFORE_WITHOUT_SEPARATOR,
  'zh-Hans': BEFORE_WITHOUT_SEPARATOR,
  'zh-Hant': BEFORE_WITHOUT_SEPARATOR,
  ar: AFTER_WITH_SPACE,
  he: { position: 'after', separator: `${NON_BREAKING_SPACE}${RIGHT_TO_LEFT_MARK}` },
  fa: BEFORE_WITH_SPACE,
};

const DEFAULT_SYMBOL_PLACEMENT = FALLBACK_SYMBOL_PLACEMENTS.en;

const SYMBOL_PLACEMENT_PROBE_CURRENCY = 'USD';

const SEPARATOR_PROBE_VALUE = 1234567.5;

const ISO_4217_CODE_PATTERN = /^[A-Za-z]{3}$/;

const separatorsByLocale = new Map<string, LocaleSeparators>();
const symbolPlacementsByLocale = new Map<string, CurrencySymbolPlacement>();
const displayNamesByLocale = new Map<string, Intl.DisplayNames | null>();

function latinNumberingTag(locale: string): string {
  return `${baseLocaleTag(locale)}-u-nu-latn`;
}

const MINIMUM_PROBE_INTEGER_CHUNKS = 3;

function readGroupSizesFromParts(parts: readonly Intl.NumberFormatPart[]): LocaleGroupSizes | null {
  const chunkLengths = parts
    .filter((part) => part.type === 'integer')
    .map((part) => part.value.length);

  if (chunkLengths.length < MINIMUM_PROBE_INTEGER_CHUNKS) {
    return null;
  }

  return {
    primary: chunkLengths[chunkLengths.length - 1],
    secondary: chunkLengths[chunkLengths.length - 2],
  };
}

function fallbackGroupSizes(locale: string): LocaleGroupSizes {
  return (lookupByLocaleTag(FALLBACK_SEPARATORS, locale) ?? DEFAULT_SEPARATORS).groupSizes;
}

function readSeparatorsFromIntl(locale: string): LocaleSeparators | null {
  try {
    const parts = new Intl.NumberFormat(latinNumberingTag(locale)).formatToParts(
      SEPARATOR_PROBE_VALUE,
    );
    const group = parts.find((part) => part.type === 'group')?.value;
    const decimal = parts.find((part) => part.type === 'decimal')?.value;

    if (group === undefined || decimal === undefined) {
      return null;
    }

    return {
      group,
      decimal,
      groupSizes: readGroupSizesFromParts(parts) ?? fallbackGroupSizes(locale),
    };
  } catch {
    return null;
  }
}

export function getLocaleSeparators(locale: string): LocaleSeparators {
  const cached = separatorsByLocale.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  const separators =
    readSeparatorsFromIntl(locale) ??
    lookupByLocaleTag(FALLBACK_SEPARATORS, locale) ??
    DEFAULT_SEPARATORS;

  separatorsByLocale.set(locale, separators);

  return separators;
}

function separatorAdjacentTo(
  parts: readonly Intl.NumberFormatPart[],
  currencyIndex: number,
  position: CurrencySymbolPlacement['position'],
): string {
  const step = position === 'before' ? 1 : -1;
  const literals: string[] = [];

  for (let index = currencyIndex + step; index >= 0 && index < parts.length; index += step) {
    if (parts[index].type !== 'literal') {
      break;
    }
    literals.push(parts[index].value);
  }

  return (position === 'before' ? literals : literals.reverse()).join('');
}

function readSymbolPlacementFromIntl(locale: string): CurrencySymbolPlacement | null {
  try {
    const parts = new Intl.NumberFormat(latinNumberingTag(locale), {
      style: 'currency',
      currency: SYMBOL_PLACEMENT_PROBE_CURRENCY,
    }).formatToParts(SEPARATOR_PROBE_VALUE);

    const currencyIndex = parts.findIndex((part) => part.type === 'currency');
    const numberIndex = parts.findIndex((part) => part.type === 'integer');

    if (currencyIndex === -1 || numberIndex === -1) {
      return null;
    }

    const position = currencyIndex < numberIndex ? 'before' : 'after';

    return { position, separator: separatorAdjacentTo(parts, currencyIndex, position) };
  } catch {
    return null;
  }
}

export function getCurrencySymbolPlacement(locale: string): CurrencySymbolPlacement {
  const cached = symbolPlacementsByLocale.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  const placement =
    readSymbolPlacementFromIntl(locale) ??
    lookupByLocaleTag(FALLBACK_SYMBOL_PLACEMENTS, locale) ??
    DEFAULT_SYMBOL_PLACEMENT;

  symbolPlacementsByLocale.set(locale, placement);

  return placement;
}

function createDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([baseLocaleTag(locale)], {
      type: 'currency',
      fallback: 'none',
    });
  } catch {
    return null;
  }
}

function getDisplayNames(locale: string): Intl.DisplayNames | null {
  const cached = displayNamesByLocale.get(locale);
  if (cached !== undefined) {
    return cached;
  }

  const displayNames = createDisplayNames(locale);
  displayNamesByLocale.set(locale, displayNames);

  return displayNames;
}

export function getCurrencyDisplayName(currencyCode: string, locale: string): string | null {
  if (!ISO_4217_CODE_PATTERN.test(currencyCode)) {
    return null;
  }

  const displayNames = getDisplayNames(locale);
  if (displayNames === null) {
    return null;
  }

  try {
    return displayNames.of(currencyCode) ?? null;
  } catch {
    return null;
  }
}
/** Reads locale number-shape information with safe fallbacks. */
