/** Resolves the selected theme and provides its design tokens. */

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { type ColorSchemeName, useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type ThemeTokens } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ColorScheme = 'light' | 'dark';

export interface ThemeContextValue {
  readonly theme: ThemeTokens;
  readonly scheme: ColorScheme;
  readonly preference: ThemePreference;
  readonly setPreference: (preference: ThemePreference) => void;
}

const FALLBACK_SCHEME: ColorScheme = 'light';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorSchemeName | null | undefined,
): ColorScheme {
  if (preference !== 'system') {
    return preference;
  }

  return systemScheme === 'light' || systemScheme === 'dark' ? systemScheme : FALLBACK_SCHEME;
}

export interface ThemeProviderProps {
  readonly children: ReactNode;

  readonly initialPreference?: ThemePreference;

  readonly onPreferenceChange?: (preference: ThemePreference) => void;
}

export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const systemScheme = useColorScheme();

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange],
  );

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveColorScheme(preference, systemScheme);

    return {
      preference,
      setPreference,
      scheme,
      theme: scheme === 'dark' ? darkTheme : lightTheme,
    };
  }, [preference, setPreference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (value === null) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }

  return value;
}
