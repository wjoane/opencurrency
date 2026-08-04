/** Provides the active locale and translator to the component tree. */

import { getLocales } from 'expo-localization';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { createTranslator, FALLBACK_LOCALE, resolveLocale, type Translate } from './index';

export interface I18nContextValue {
  readonly locale: string;
  readonly t: Translate;
  readonly followsDevice: boolean;
  readonly setLocale: (locale: string | null) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectDeviceLocale(): string {
  try {
    return resolveLocale(getLocales().map((locale) => locale.languageTag));
  } catch {
    return FALLBACK_LOCALE;
  }
}

export function resolveInitialLocale(initialLocale?: string): string {
  return resolveLocale([initialLocale ?? detectDeviceLocale()]);
}

export interface I18nProviderProps {
  readonly children: ReactNode;
  readonly initialLocale?: string;
  readonly onLocaleChange?: (locale: string | null) => void;
}

export function I18nProvider({ children, initialLocale, onLocaleChange }: I18nProviderProps) {
  const [deviceLocale] = useState(detectDeviceLocale);
  const [chosenLocale, setChosenLocale] = useState<string | null>(initialLocale ?? null);

  const locale = useMemo(
    () => resolveLocale([chosenLocale ?? deviceLocale]),
    [chosenLocale, deviceLocale],
  );

  const setLocale = useCallback(
    (next: string | null) => {
      const chosen = next === null ? null : resolveLocale([next]);

      setChosenLocale(chosen);
      onLocaleChange?.(chosen);

      return chosen ?? deviceLocale;
    },
    [deviceLocale, onLocaleChange],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: createTranslator(locale),
      followsDevice: chosenLocale === null,
      setLocale,
    }),
    [locale, chosenLocale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);

  if (value === null) {
    throw new Error('useI18n must be used inside an I18nProvider');
  }

  return value;
}
