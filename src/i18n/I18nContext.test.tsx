import { act, render, screen } from '@testing-library/react-native';
import { getLocales } from 'expo-localization';
import { Text } from 'react-native';

import { I18nProvider, useI18n } from './I18nContext';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedGetLocales = jest.mocked(getLocales);

function locales(...tags: string[]) {
  return tags.map((languageTag) => ({ languageTag })) as ReturnType<typeof getLocales>;
}

function LocaleReadout() {
  const { locale, followsDevice, t, setLocale } = useI18n();

  return (
    <>
      <Text>{`locale: ${locale}`}</Text>
      <Text>{`follows device: ${followsDevice}`}</Text>
      <Text>{t('settings.title')}</Text>
      <Text onPress={() => setLocale('kl-GL')}>choose greenlandic</Text>
      <Text onPress={() => setLocale('de')}>choose german</Text>
      <Text onPress={() => setLocale(null)}>follow the device</Text>
    </>
  );
}

async function press(label: string) {
  await act(async () => {
    screen.getByText(label).props.onPress();
  });
}

beforeEach(() => {
  mockedGetLocales.mockReturnValue(locales('en-US'));
});

describe('device locale detection', () => {
  it('resolves the device preference list in order', async () => {
    mockedGetLocales.mockReturnValue(locales('kl-GL', 'en-GB'));

    await render(
      <I18nProvider>
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
  });

  it('falls back when the device reports no locale at all', async () => {
    mockedGetLocales.mockReturnValue(locales());

    await render(
      <I18nProvider>
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
  });

  it('falls back when reading the OS preference throws', async () => {
    mockedGetLocales.mockImplementation(() => {
      throw new Error('native module unavailable');
    });

    await render(
      <I18nProvider>
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
  });
});

describe('I18nProvider', () => {
  it('starts from the device locale', async () => {
    await render(
      <I18nProvider>
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
    expect(screen.getByText('follows device: true')).toBeOnTheScreen();
    expect(screen.getByText('Settings')).toBeOnTheScreen();
  });

  it('prefers an explicit initial locale over the device', async () => {
    mockedGetLocales.mockReturnValue(locales('kl-GL'));

    await render(
      <I18nProvider initialLocale="en-AU">
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
    expect(screen.getByText('follows device: false')).toBeOnTheScreen();
  });

  it('resolves an unsupported selection instead of leaving the app stringless', async () => {
    await render(
      <I18nProvider>
        <LocaleReadout />
      </I18nProvider>,
    );

    await press('choose greenlandic');

    expect(screen.getByText('locale: en')).toBeOnTheScreen();
    expect(screen.getByText('Settings')).toBeOnTheScreen();
  });

  it('goes back to following the device, and stops persisting a choice', async () => {
    const onLocaleChange = jest.fn();

    mockedGetLocales.mockReturnValue(locales('fr-FR'));

    await render(
      <I18nProvider initialLocale="de" onLocaleChange={onLocaleChange}>
        <LocaleReadout />
      </I18nProvider>,
    );

    expect(screen.getByText('locale: de')).toBeOnTheScreen();

    await press('follow the device');

    expect(screen.getByText('locale: fr')).toBeOnTheScreen();
    expect(screen.getByText('follows device: true')).toBeOnTheScreen();
    expect(onLocaleChange).toHaveBeenCalledWith(null);
  });

  it('reports the resolved tag to its caller, which cannot wait for a re-render', async () => {
    const onLocaleChange = jest.fn();

    await render(
      <I18nProvider onLocaleChange={onLocaleChange}>
        <LocaleReadout />
      </I18nProvider>,
    );

    await press('choose german');

    expect(onLocaleChange).toHaveBeenCalledWith('de');
    expect(screen.getByText('follows device: false')).toBeOnTheScreen();
  });
});

describe('useI18n', () => {
  it('refuses to render outside a provider', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<LocaleReadout />)).rejects.toThrow('useI18n must be used inside');

    consoleError.mockRestore();
  });
});
