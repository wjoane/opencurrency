import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { getCountryCode } from '../domain/currencyMetadata';
import { CURRENCIES } from '../domain/appData';
import { isOfferedCurrency } from '../domain/currencyUniverse';
import { ThemeProvider } from '../theme/ThemeContext';

import {
  CURRENCY_BADGE_TEST_ID,
  CurrencyIcon,
  FLAG_IMAGE_TEST_ID,
  METAL_IMAGE_TEST_ID,
} from './CurrencyIcon';
import { FLAG_ASSETS } from './flagAssets';
import { METAL_ASSETS } from './metalAssets';

const HIDDEN = { includeHiddenElements: true } as const;

function fontSizeOf(label: string): number {
  return StyleSheet.flatten(screen.getByText(label, HIDDEN).props.style).fontSize as number;
}

async function renderIcon(currencyCode: string, countryCode: string | null, badgeLabel = 'XAU') {
  await render(
    <ThemeProvider initialPreference="light">
      <CurrencyIcon currencyCode={currencyCode} countryCode={countryCode} badgeLabel={badgeLabel} />
    </ThemeProvider>,
  );
}

describe('CurrencyIcon', () => {
  it('renders the bundled flag for a country that has one', async () => {
    await renderIcon('jpy', 'jp');

    expect(screen.getByTestId(FLAG_IMAGE_TEST_ID, HIDDEN)).toHaveProp('source', FLAG_ASSETS.jp);
    expect(screen.queryByTestId(CURRENCY_BADGE_TEST_ID, HIDDEN)).toBeNull();
  });

  it('renders a labelled badge rather than nothing when the currency has no country', async () => {
    await renderIcon('btc', null, '\u20BF');

    expect(screen.getByTestId(CURRENCY_BADGE_TEST_ID, HIDDEN)).toBeOnTheScreen();
    expect(screen.getByText('\u20BF', HIDDEN)).toBeOnTheScreen();
    expect(screen.queryByTestId(FLAG_IMAGE_TEST_ID, HIDDEN)).toBeNull();
  });

  it.each(['xag', 'xau', 'xpd', 'xpt'])(
    'renders the bundled %s commodity icon rather than a generated badge',
    async (currencyCode) => {
      await renderIcon(currencyCode, null);

      expect(screen.getByTestId(METAL_IMAGE_TEST_ID, HIDDEN)).toHaveProp(
        'source',
        METAL_ASSETS[currencyCode],
      );
      expect(screen.queryByTestId(CURRENCY_BADGE_TEST_ID, HIDDEN)).toBeNull();
    },
  );

  it('sizes the badge label down as the label gets longer', async () => {
    await render(
      <ThemeProvider initialPreference="light">
        <CurrencyIcon currencyCode="btc" countryCode={null} badgeLabel={'\u20BF'} />
        <CurrencyIcon currencyCode="usdt" countryCode={null} badgeLabel="USDT" />
      </ThemeProvider>,
    );

    expect(fontSizeOf('USDT')).toBeLessThan(fontSizeOf('\u20BF'));
  });

  it.each(['zz', 'constructor', '__proto__'])(
    'renders a badge for the unmapped country code %p',
    async (countryCode) => {
      await renderIcon('btc', countryCode);

      expect(screen.getByTestId(CURRENCY_BADGE_TEST_ID, HIDDEN)).toBeOnTheScreen();
      expect(screen.queryByTestId(FLAG_IMAGE_TEST_ID, HIDDEN)).toBeNull();
    },
  );

  it.each(['constructor', '__proto__'])('renders a badge for the unknown code %p', async (code) => {
    await renderIcon(code, null);

    expect(screen.getByTestId(CURRENCY_BADGE_TEST_ID, HIDDEN)).toBeOnTheScreen();
    expect(screen.queryByTestId(METAL_IMAGE_TEST_ID, HIDDEN)).toBeNull();
  });
});

describe('flagAssets coverage', () => {
  const offeredCurrencyCodes = Object.keys(CURRENCIES).filter(isOfferedCurrency);

  it('ships a flag for every country an offered currency can name', () => {
    const missing = offeredCurrencyCodes
      .map(getCountryCode)
      .filter((country): country is string => country !== null)
      .filter((country) => !Object.hasOwn(FLAG_ASSETS, country));

    expect(missing).toEqual([]);
  });

  it('ships no flag that no offered currency can reach', () => {
    const reachable = new Set(offeredCurrencyCodes.map(getCountryCode));
    const unreachable = Object.keys(FLAG_ASSETS).filter((country) => !reachable.has(country));

    expect(unreachable).toEqual([]);
  });
});
