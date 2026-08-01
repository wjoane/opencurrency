/** Defines and normalizes the preferences persisted between launches. */

import { type ThemePreference } from '../theme/ThemeContext';

export interface Preferences {
  /** The selected appearance mode. */
  readonly theme: ThemePreference;

  readonly language: string | null;

  readonly currencyCodes: readonly string[];

  readonly activeCurrencyCode: string;

  readonly amountText: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  language: null,
  currencyCodes: ['eur', 'usd'],
  activeCurrencyCode: 'eur',
  amountText: '1',
};

const MINIMUM_CURRENCY_ROWS = 2;

const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readOwnProperty(source: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(source, key) ? source[key] : undefined;
}

function readTheme(value: unknown): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? DEFAULT_PREFERENCES.theme;
}

function readLanguage(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function isSameCodeList(value: readonly unknown[], codes: readonly string[]): boolean {
  return value.length === codes.length && value.every((code, index) => code === codes[index]);
}

function readCurrencyCodes(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PREFERENCES.currencyCodes;
  }

  const codes = [
    ...new Set(
      value
        .filter((code): code is string => typeof code === 'string')
        .map((code) => code.trim().toLowerCase())
        .filter((code) => code !== ''),
    ),
  ];

  if (codes.length < MINIMUM_CURRENCY_ROWS) {
    return DEFAULT_PREFERENCES.currencyCodes;
  }

  return isSameCodeList(value, codes) ? (value as readonly string[]) : codes;
}

function readAmountText(value: unknown): string {
  return typeof value === 'string' ? value : DEFAULT_PREFERENCES.amountText;
}

export function normalisePreferences(preferences: Preferences): Preferences {
  const currencyCodes = readCurrencyCodes(preferences.currencyCodes);
  const activeCurrencyCode = preferences.activeCurrencyCode.trim().toLowerCase();

  return {
    theme: readTheme(preferences.theme),
    language: readLanguage(preferences.language),
    currencyCodes,
    activeCurrencyCode: currencyCodes.includes(activeCurrencyCode)
      ? activeCurrencyCode
      : currencyCodes[0],
    amountText: readAmountText(preferences.amountText),
  };
}

export function parsePreferences(serialised: string | null): Preferences {
  if (serialised === null) {
    return DEFAULT_PREFERENCES;
  }

  let document: unknown;

  try {
    document = JSON.parse(serialised);
  } catch {
    return DEFAULT_PREFERENCES;
  }

  if (!isPlainObject(document)) {
    return DEFAULT_PREFERENCES;
  }

  const currencyCodes = readCurrencyCodes(readOwnProperty(document, 'currencyCodes'));
  const activeCurrencyCode = readOwnProperty(document, 'activeCurrencyCode');

  return normalisePreferences({
    theme: readTheme(readOwnProperty(document, 'theme')),
    language: readLanguage(readOwnProperty(document, 'language')),
    currencyCodes,
    activeCurrencyCode:
      typeof activeCurrencyCode === 'string' ? activeCurrencyCode : currencyCodes[0],
    amountText: readAmountText(readOwnProperty(document, 'amountText')),
  });
}

export function serialisePreferences(preferences: Preferences): string {
  return JSON.stringify(preferences);
}
