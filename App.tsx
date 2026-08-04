/** Composes the providers and the converter screen. */

import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { ConverterScreen } from './src/features/converter/ConverterScreen';
import { I18nProvider, resolveInitialLocale, useI18n } from './src/i18n/I18nContext';
import { reconcileDirection } from './src/i18n/direction';
import { getLayoutDirection } from './src/i18n/locales';
import { PreferencesProvider, usePreferences } from './src/state/PreferencesContext';
import { RatesProvider } from './src/state/RatesContext';
import { type ThemePreference, ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { getDirectionProps, getDirectionStyle } from './src/ui/layoutDirection';

/** Renders the status bar using the resolved theme. */
function ThemedStatusBar() {
  const { scheme } = useTheme();

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

/** Applies the selected locale's direction live to the mounted application tree. */
function LayoutDirectionContainer({ children }: { readonly children: ReactNode }) {
  const { locale } = useI18n();
  const direction = getLayoutDirection(locale);

  return (
    <View
      {...getDirectionProps(direction)}
      style={[styles.direction, getDirectionStyle(direction)]}
    >
      {children}
    </View>
  );
}

/** Connects persisted preferences to the theme and language providers. */
export function PersistedProviders({ children }: { readonly children: ReactNode }) {
  const { preferences, updatePreferences } = usePreferences();

  // Set the direction before the first child render.
  useState(() =>
    reconcileDirection(getLayoutDirection(resolveInitialLocale(preferences.language ?? undefined))),
  );

  const persistTheme = useCallback(
    (theme: ThemePreference) => updatePreferences({ theme }),
    [updatePreferences],
  );

  const persistLanguage = useCallback(
    (language: string | null) => updatePreferences({ language }),
    [updatePreferences],
  );

  return (
    <ThemeProvider initialPreference={preferences.theme} onPreferenceChange={persistTheme}>
      <I18nProvider
        initialLocale={preferences.language ?? undefined}
        onLocaleChange={persistLanguage}
      >
        <LayoutDirectionContainer>
          <ThemedStatusBar />
          <RatesProvider>{children}</RatesProvider>
        </LayoutDirectionContainer>
      </I18nProvider>
    </ThemeProvider>
  );
}

/** Renders the application inside its required providers. */
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PreferencesProvider>
          <PersistedProviders>
            <ConverterScreen />
          </PersistedProviders>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  direction: {
    flex: 1,
  },
});
