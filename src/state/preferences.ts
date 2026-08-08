/** Defines and normalizes the preferences persisted between launches. */

import { normaliseCurrencyCode } from '../domain/currencyCode';
import { isPlainObject } from '../domain/json';
import { type ThemePreference } from '../theme/ThemeContext';

export interface Preferences {
  /** The selected appearance mode. */
  readonly theme: ThemePreference;
  readonly language: string | null;
  readonly currencyCodes: readonly string[];
  readonly activeCurrencyCode: string;
  readonly amountText: string;
  readonly showCurrencySymbols: boolean;
  readonly showConversionRates: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  language: null,
  currencyCodes: ['eur', 'usd'],
  activeCurrencyCode: 'eur',
  amountText: '1',
  showCurrencySymbols: false,
  showConversionRates: false,
};

export const MINIMUM_CURRENCY_ROWS = 2;

const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

function readTheme(value: unknown): ThemePreference {
  return THEME_PREFERENCES.find((preference) => preference === value) ?? DEFAULT_PREFERENCES.theme;
}

function readLanguage(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function normaliseCurrencyCodes(value: readonly string[]): readonly string[] {
  const codes = [...new Set(value.map(normaliseCurrencyCode).filter((code) => code !== ''))];

  return codes.length < MINIMUM_CURRENCY_ROWS ? DEFAULT_PREFERENCES.currencyCodes : codes;
}

function normaliseCurrencySelection(
  currencyCodes: readonly string[],
  activeCurrencyCode: string,
): Pick<Preferences, 'currencyCodes' | 'activeCurrencyCode'> {
  const normalisedCodes = normaliseCurrencyCodes(currencyCodes);
  const normalisedActiveCode = normaliseCurrencyCode(activeCurrencyCode);

  return {
    currencyCodes: normalisedCodes,
    activeCurrencyCode: normalisedCodes.includes(normalisedActiveCode)
      ? normalisedActiveCode
      : normalisedCodes[0],
  };
}

function readAmountText(value: unknown): string {
  return typeof value === 'string' ? value : DEFAULT_PREFERENCES.amountText;
}

function readFlag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalisePreferences(preferences: Preferences): Preferences {
  return {
    theme: preferences.theme,
    language: preferences.language,
    ...normaliseCurrencySelection(preferences.currencyCodes, preferences.activeCurrencyCode),
    amountText: preferences.amountText,
    showCurrencySymbols: preferences.showCurrencySymbols,
    showConversionRates: preferences.showConversionRates,
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

  const storedCodes = Array.isArray(document.currencyCodes)
    ? document.currencyCodes.filter((code): code is string => typeof code === 'string')
    : DEFAULT_PREFERENCES.currencyCodes;
  const activeCurrencyCode =
    typeof document.activeCurrencyCode === 'string'
      ? document.activeCurrencyCode
      : DEFAULT_PREFERENCES.activeCurrencyCode;

  return {
    theme: readTheme(document.theme),
    language: readLanguage(document.language),
    ...normaliseCurrencySelection(storedCodes, activeCurrencyCode),
    amountText: readAmountText(document.amountText),
    showCurrencySymbols: readFlag(
      document.showCurrencySymbols,
      DEFAULT_PREFERENCES.showCurrencySymbols,
    ),
    showConversionRates: readFlag(
      document.showConversionRates,
      DEFAULT_PREFERENCES.showConversionRates,
    ),
  };
}

export function serialisePreferences(preferences: Preferences): string {
  return JSON.stringify(preferences);
}
