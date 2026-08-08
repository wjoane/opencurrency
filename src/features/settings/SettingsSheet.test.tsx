import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';

import { type PreferencesStore } from '../../data/preferencesStorage';
import { I18nProvider } from '../../i18n/I18nContext';
import * as direction from '../../i18n/direction';
import { PreferencesProvider } from '../../state/PreferencesContext';
import { ThemeProvider } from '../../theme/ThemeContext';

import { SettingsSheet } from './SettingsSheet';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'en-GB' }] }));

function storeReturning(serialised: string | null): PreferencesStore {
  return { read: () => Promise.resolve(serialised), write: () => Promise.resolve() };
}

async function renderSheet(
  initialLocale: string | null = 'en',
  onLocaleChange?: (locale: string | null) => void,
  store: PreferencesStore = storeReturning(null),
) {
  await render(
    <PreferencesProvider store={store}>
      <ThemeProvider initialPreference="system">
        <I18nProvider initialLocale={initialLocale ?? undefined} onLocaleChange={onLocaleChange}>
          <SettingsSheet visible onClose={() => {}} />
        </I18nProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );

  await act(async () => {});
}

function toggle(name: string) {
  return screen.getByRole('switch', { name });
}

function option(name: string) {
  return screen.getByRole('radio', { name });
}

function appearance(name: string) {
  return screen.getByRole('radio', { name });
}

function languageDropdown(name = 'Language') {
  return screen.getByRole('combobox', { name });
}

async function openLanguageDropdown(name = 'Language') {
  await fireEvent.press(languageDropdown(name));
}

describe('SettingsSheet', () => {
  it('offers appearance as one three-way selection', async () => {
    await renderSheet();

    expect(appearance('System')).toBeChecked();
    expect(appearance('Light')).not.toBeChecked();
    expect(appearance('Dark')).not.toBeChecked();
    expect(screen.queryByRole('switch', { name: 'System' })).toBeNull();
  });

  it('offers the display choices off, as switches rather than a further mode list', async () => {
    await renderSheet();

    expect(toggle('Currency symbols')).not.toBeChecked();
    expect(toggle('Conversion rates')).not.toBeChecked();
    expect(screen.queryByRole('radio', { name: 'Currency symbols' })).toBeNull();
  });

  it('switches each display choice independently of the other', async () => {
    await renderSheet();

    await fireEvent(toggle('Currency symbols'), 'valueChange', true);

    expect(toggle('Currency symbols')).toBeChecked();
    expect(toggle('Conversion rates')).not.toBeChecked();

    await fireEvent(toggle('Conversion rates'), 'valueChange', true);
    await fireEvent(toggle('Currency symbols'), 'valueChange', false);

    expect(toggle('Currency symbols')).not.toBeChecked();
    expect(toggle('Conversion rates')).toBeChecked();
  });

  it('restores the switches from what was persisted', async () => {
    await renderSheet(
      'en',
      undefined,
      storeReturning(JSON.stringify({ showConversionRates: true })),
    );

    expect(toggle('Currency symbols')).not.toBeChecked();
    expect(toggle('Conversion rates')).toBeChecked();
  });

  it('translates the display switches with the rest of the sheet', async () => {
    await renderSheet();
    await openLanguageDropdown();
    await fireEvent.press(option('Français'));

    expect(toggle('Symboles monétaires')).toBeOnTheScreen();
    expect(toggle('Taux de conversion')).toBeOnTheScreen();
  });

  it('changes the appearance directly from the three-way selection', async () => {
    await renderSheet();

    await fireEvent.press(appearance('Dark'));

    expect(appearance('Dark')).toBeChecked();
    expect(appearance('System')).not.toBeChecked();

    await fireEvent.press(appearance('Light'));

    expect(appearance('Light')).toBeChecked();
    expect(appearance('Dark')).not.toBeChecked();
  });

  it('keeps language choices collapsed until the dropdown is opened', async () => {
    await renderSheet();

    expect(languageDropdown().props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByRole('radio', { name: 'Deutsch' })).toBeNull();

    await openLanguageDropdown();

    expect(languageDropdown().props.accessibilityState.expanded).toBe(true);
    expect(option('Deutsch')).toBeOnTheScreen();
    expect(option('日本語')).toBeOnTheScreen();
    expect(option('العربية')).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'German' })).toBeNull();
  });

  it('offers the device as a choice, and marks it while it is the one in use', async () => {
    await renderSheet(null);
    await openLanguageDropdown();

    expect(option('Follow the device')).toBeChecked();
    expect(option('English')).not.toBeChecked();
  });

  it('distinguishes following the device from choosing the language it is set to', async () => {
    await renderSheet('en');
    await openLanguageDropdown();

    expect(option('English')).toBeChecked();
    expect(option('Follow the device')).not.toBeChecked();

    await fireEvent.press(option('Follow the device'));

    expect(screen.queryByRole('radio', { name: 'Follow the device' })).toBeNull();
    expect(languageDropdown()).toHaveAccessibilityValue({ text: 'Follow the device' });
  });

  it('applies a same-direction language immediately and asks nothing', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await renderSheet();
    await openLanguageDropdown();
    await fireEvent.press(option('Deutsch'));

    expect(screen.getByRole('header', { name: 'Einstellungen' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Deutsch' })).toBeNull();
    expect(alert).not.toHaveBeenCalled();

    alert.mockRestore();
  });

  it('translates the whole sheet, not only the option that was chosen', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await renderSheet();
    await openLanguageDropdown();
    await fireEvent.press(option('Français'));

    expect(screen.getByRole('header', { name: 'Apparence' })).toBeOnTheScreen();
    expect(appearance('Système')).toBeOnTheScreen();

    alert.mockRestore();
  });

  it('applies a right-to-left direction live without asking or restarting', async () => {
    const reconcile = jest.spyOn(direction, 'reconcileDirection').mockImplementation(() => {});
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await renderSheet();
    await openLanguageDropdown();
    await fireEvent.press(option('العربية'));

    await waitFor(() => expect(reconcile).toHaveBeenCalledWith('rtl'));
    expect(alert).not.toHaveBeenCalled();
    expect(screen.getByRole('header', { name: 'الإعدادات' })).toBeOnTheScreen();

    reconcile.mockRestore();
    alert.mockRestore();
  });

  it('applies a left-to-right direction live without asking or restarting', async () => {
    const reconcile = jest.spyOn(direction, 'reconcileDirection').mockImplementation(() => {});
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await renderSheet('ar');
    await openLanguageDropdown('اللغة');
    await fireEvent.press(option('English'));

    await waitFor(() => expect(reconcile).toHaveBeenCalledWith('ltr'));
    expect(alert).not.toHaveBeenCalled();

    reconcile.mockRestore();
    alert.mockRestore();
  });

  it('opens an About message naming the product and its licence', async () => {
    await renderSheet();

    expect(screen.queryByText(/Lesser General Public License/)).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'About OpenCurrency' }));

    expect(screen.getByText('Simple converter, nothing more.')).toBeOnTheScreen();
    expect(screen.getByText(/GNU General Public License v3/)).toBeOnTheScreen();
  });

  it('closes the About message on the acknowledgement button', async () => {
    await renderSheet();

    await fireEvent.press(screen.getByRole('button', { name: 'About OpenCurrency' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Got it' }));

    expect(screen.queryByText(/Lesser General Public License/)).toBeNull();
  });

  it('opens the GitHub and Buy Me a Coffee links from the About message', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await renderSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'About OpenCurrency' }));
    await fireEvent.press(
      screen.getByRole('link', {
        name: 'https://github.com/wjoane/opencurrency',
      }),
    );
    await fireEvent.press(
      screen.getByRole('link', {
        name: 'https://buymeacoffee.com/wjoane',
      }),
    );

    expect(openUrl).toHaveBeenNthCalledWith(1, 'https://github.com/wjoane/opencurrency');
    expect(openUrl).toHaveBeenNthCalledWith(2, 'https://buymeacoffee.com/wjoane');

    openUrl.mockRestore();
  });

  it('keeps the About message usable when an external link cannot open', async () => {
    const openUrl = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));

    await renderSheet();
    await fireEvent.press(screen.getByRole('button', { name: 'About OpenCurrency' }));
    await fireEvent.press(
      screen.getByRole('link', {
        name: 'https://github.com/wjoane/opencurrency',
      }),
    );

    await waitFor(() => expect(openUrl).toHaveBeenCalled());
    expect(screen.getByText('Simple converter, nothing more.')).toBeOnTheScreen();

    openUrl.mockRestore();
  });
});
