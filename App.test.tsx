import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { I18nManager, StyleSheet, Text } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import App, { PersistedProviders } from './App';
import { createPreferencesStore, type PreferencesStore } from './src/data/preferencesStorage';
import { SettingsSheet } from './src/features/settings/SettingsSheet';
import { type Translate } from './src/i18n';
import { useI18n } from './src/i18n/I18nContext';
import { PreferencesProvider, usePreferences } from './src/state/PreferencesContext';
import { outermostCompositeProps } from './src/testing/compositeProps';
import { type ThemeContextValue, useTheme } from './src/theme/ThemeContext';

const RESPONSE_BODY = JSON.stringify({
  date: '2026-07-27',
  eur: { eur: 1, usd: 1.0842 },
});

const originalFetch = globalThis.fetch;

function storeHolding(serialised: string): PreferencesStore {
  return { read: () => Promise.resolve(serialised), write: () => Promise.resolve() };
}

function renderedLayoutDirection(element: ReturnType<typeof screen.getByText>): string | undefined {
  const props = outermostCompositeProps<{ readonly style: unknown }>(
    element,
    (candidate) =>
      candidate.style !== undefined &&
      (StyleSheet.flatten(candidate.style) as { readonly direction?: string }).direction !==
        undefined,
    'layout-direction container',
  );

  return (StyleSheet.flatten(props.style) as { readonly direction?: string }).direction;
}

beforeEach(() => {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve(new Response(RESPONSE_BODY, { status: 200 })),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('App', () => {
  it('composes the providers and renders the converter', async () => {
    await render(<App />);

    expect(await screen.findByText('Rates from 2026-07-27')).toBeOnTheScreen();
    expect(screen.getByLabelText('Amount in Euro')).toBeOnTheScreen();
  });

  it('gives the brand wordmark greater visual emphasis', async () => {
    await render(<App />);

    const wordmark = screen.getByRole('header', { name: 'OpenCurrency' });
    const style = StyleSheet.flatten(wordmark.props.style);

    expect(style.fontSize).toBe(24);
    expect(style.lineHeight).toBe(30);
  });

  it('converts through the real domain layer, not a test double', async () => {
    await render(<App />);

    await screen.findByText('Rates from 2026-07-27');

    expect(screen.getByText('$\u00a01.08')).toBeOnTheScreen();
    expect(screen.getByText('1 EUR = 1.0842 USD')).toBeOnTheScreen();
  });

  it('persists a theme change made in settings', async () => {
    await render(<App />);

    await screen.findByText('Rates from 2026-07-27');
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));

    await expectPersisted({ theme: 'dark' });
  });

  it('persists a language change made in settings', async () => {
    await render(<App />);

    await screen.findByText('Rates from 2026-07-27');
    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
    await fireEvent.press(screen.getByRole('combobox', { name: 'Language' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Deutsch' }));

    await expectPersisted({ language: 'de' });
  });
});

async function expectPersisted(expected: Record<string, unknown>): Promise<void> {
  await waitFor(async () => {
    const serialised = await createPreferencesStore().read();

    expect(JSON.parse(serialised ?? 'null')).toMatchObject(expected);
  });
}

interface SeenIdentities {
  readonly themes: Set<ThemeContextValue>;
  readonly translators: Set<Translate>;
}

function ContextIdentityProbe({ seen }: { readonly seen: SeenIdentities }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { preferences, updatePreferences } = usePreferences();

  seen.themes.add(theme);
  seen.translators.add(t);

  return (
    <Text
      accessibilityRole="button"
      onPress={() => updatePreferences({ amountText: `${preferences.amountText}1` })}
    >
      keystroke
    </Text>
  );
}

describe('PersistedProviders', () => {
  async function renderProbe(): Promise<SeenIdentities> {
    const seen: SeenIdentities = { themes: new Set(), translators: new Set() };

    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PreferencesProvider>
          <PersistedProviders>
            <ContextIdentityProbe seen={seen} />
          </PersistedProviders>
        </PreferencesProvider>
      </SafeAreaProvider>,
    );

    return seen;
  }

  it('keeps the theme and the translator stable while the amount is typed', async () => {
    const seen = await renderProbe();
    const keystroke = screen.getByRole('button', { name: 'keystroke' });

    await fireEvent.press(keystroke);
    await fireEvent.press(keystroke);
    await fireEvent.press(keystroke);

    expect(seen.themes.size).toBe(1);
    expect(seen.translators.size).toBe(1);
  });
});

describe('layout direction at startup', () => {
  async function mountWithLanguage(language: string) {
    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PreferencesProvider store={storeHolding(JSON.stringify({ language }))}>
          <PersistedProviders>
            <Text>ready</Text>
          </PersistedProviders>
        </PreferencesProvider>
      </SafeAreaProvider>,
    );

    await screen.findByText('ready');
  }

  it('mirrors for a persisted right-to-left language without requiring a restart', async () => {
    const allowRTL = jest.spyOn(I18nManager, 'allowRTL').mockImplementation(() => {});
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});

    await mountWithLanguage('ar');

    expect(allowRTL).toHaveBeenCalledWith(true);
    expect(forceRTL).toHaveBeenCalledWith(true);

    allowRTL.mockRestore();
    forceRTL.mockRestore();
  });

  it('applies Arabic direction to the rendered application tree', async () => {
    await mountWithLanguage('ar');

    expect(renderedLayoutDirection(screen.getByText('ready'))).toBe('rtl');
  });

  it('changes the rendered direction both ways without remounting', async () => {
    await render(
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <PreferencesProvider store={storeHolding(JSON.stringify({ language: 'en' }))}>
          <PersistedProviders>
            <SettingsSheet visible onClose={() => {}} />
          </PersistedProviders>
        </PreferencesProvider>
      </SafeAreaProvider>,
    );

    const englishHeading = await screen.findByRole('header', { name: 'Settings' });

    expect(renderedLayoutDirection(englishHeading)).toBe('ltr');

    await fireEvent.press(screen.getByRole('combobox', { name: 'Language' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'العربية' }));

    const arabicHeading = screen.getByRole('header', { name: 'الإعدادات' });

    expect(renderedLayoutDirection(arabicHeading)).toBe('rtl');

    await fireEvent.press(screen.getByRole('combobox', { name: 'اللغة' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    expect(renderedLayoutDirection(screen.getByRole('header', { name: 'Settings' }))).toBe('ltr');
  });
});
