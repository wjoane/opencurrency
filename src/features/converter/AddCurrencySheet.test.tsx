import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { I18nProvider } from '../../i18n/I18nContext';
import { ThemeProvider } from '../../theme/ThemeContext';

import { AddCurrencySheet, type AddCurrencySheetProps } from './AddCurrencySheet';
import { buildCurrencyOptions } from './currencyOptions';

jest.mock('./currencyOptions', () => {
  const actual = jest.requireActual<typeof import('./currencyOptions')>('./currencyOptions');

  return { ...actual, buildCurrencyOptions: jest.fn(actual.buildCurrencyOptions) };
});

const BASE_PROPS: AddCurrencySheetProps = {
  visible: true,
  onClose: () => {},
  currencyCodes: ['eur', 'usd'],
  rates: { eur: 1, usd: 1.0842, jpy: 165.23 },
  onAdd: () => {},
};

function sheet(overrides: Partial<AddCurrencySheetProps> = {}) {
  return (
    <ThemeProvider initialPreference="light">
      <I18nProvider initialLocale="en">
        <AddCurrencySheet {...BASE_PROPS} {...overrides} />
      </I18nProvider>
    </ThemeProvider>
  );
}

async function renderSheet(overrides: Partial<AddCurrencySheetProps> = {}) {
  await render(sheet(overrides));
}

async function search(term: string) {
  await fireEvent.changeText(screen.getByLabelText('Search currencies'), term);
}

describe('AddCurrencySheet', () => {
  afterEach(async () => {
    await screen.unmount();
  });

  it('renders nothing while it is closed', async () => {
    await renderSheet({ visible: false });

    expect(screen.queryByLabelText('Search currencies')).toBeNull();
  });

  it('narrows to a currency searched by code', async () => {
    await renderSheet();
    await search('jp');

    expect(screen.getByLabelText('Japanese Yen, JPY')).toBeOnTheScreen();
    expect(screen.queryByLabelText('US Dollar, USD')).toBeNull();
  });

  it('narrows to a currency searched by its localised name', async () => {
    await renderSheet();
    await search('yen');

    expect(screen.getByLabelText('Japanese Yen, JPY')).toBeOnTheScreen();
  });

  it('adds the currency that was chosen, and closes', async () => {
    const onAdd = jest.fn();
    const onClose = jest.fn();

    await renderSheet({ onAdd, onClose });
    await search('jp');
    await fireEvent.press(screen.getByLabelText('Japanese Yen, JPY'));

    expect(onAdd).toHaveBeenCalledWith('jpy');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an already-added currency disabled rather than hiding it', async () => {
    await renderSheet();
    await search('usd');

    const added = screen.getByLabelText('US Dollar, USD');

    expect(added).toBeOnTheScreen();
    expect(added).toBeDisabled();
  });

  it('does not add a currency that is already on the list', async () => {
    const onAdd = jest.fn();

    await renderSheet({ onAdd });
    await search('usd');
    await fireEvent.press(screen.getByLabelText('US Dollar, USD'));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('says so when nothing matches, rather than showing an empty list', async () => {
    await renderSheet();
    await search('zzzznope');

    expect(screen.getByText('No currency matches that search.')).toBeOnTheScreen();
  });

  it('offers a currency with no country, drawing the flag placeholder', async () => {
    await renderSheet();
    await search('btc');

    const option = screen.getByLabelText(/, BTC$/);

    expect(within(option).getByText('₿', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('names no currencies until the sheet is first opened', async () => {
    const build = jest.mocked(buildCurrencyOptions);

    build.mockClear();
    await renderSheet({ visible: false });

    expect(build).not.toHaveBeenCalled();

    await screen.rerender(sheet({ visible: true }));

    expect(build).toHaveBeenCalled();
    expect(screen.getByLabelText('Search currencies')).toBeOnTheScreen();
  });

  it('keeps the names it built when the sheet is closed and reopened', async () => {
    const build = jest.mocked(buildCurrencyOptions);

    await renderSheet();
    build.mockClear();

    await screen.rerender(sheet({ visible: false }));
    await screen.rerender(sheet({ visible: true }));
    await search('jpy');

    expect(build).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Japanese Yen, JPY')).toBeOnTheScreen();
  });

  it('forgets the search term when it is closed and reopened', async () => {
    await renderSheet();
    await search('jp');
    await fireEvent.press(screen.getAllByLabelText('Close')[0]);

    expect(screen.getByLabelText('Search currencies').props.value).toBe('');
  });

  it('offers currencies from the seed when no rates have loaded at all', async () => {
    await renderSheet({ rates: {} });
    await search('jp');

    expect(screen.getByLabelText('Japanese Yen, JPY')).toBeOnTheScreen();
  });
});
