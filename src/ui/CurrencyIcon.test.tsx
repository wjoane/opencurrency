import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ThemeProvider } from '../theme/ThemeContext';

import { CurrencyIcon } from './CurrencyIcon';

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
  it('renders a labelled badge rather than nothing when the currency has no country', async () => {
    await renderIcon('btc', null, '\u20BF');

    expect(screen.getByText('\u20BF', HIDDEN)).toBeOnTheScreen();
  });

  it('sizes the badge label down as the label gets longer', async () => {
    await render(
      <ThemeProvider initialPreference="light">
        <CurrencyIcon currencyCode="btc" countryCode={null} badgeLabel={'\u20BF'} />
        <CurrencyIcon currencyCode="usdt" countryCode={null} badgeLabel="USDT" />
      </ThemeProvider>,
    );

    expect(fontSizeOf('USDT')).toBeLessThan(fontSizeOf('\u20BF'));
  });
});
