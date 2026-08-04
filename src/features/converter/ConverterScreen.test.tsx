import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { type PreferencesStore } from '../../data/preferencesStorage';
import { type RateRepository, type SnapshotOutcome } from '../../data/rateRepository';
import { type RateSnapshot } from '../../data/rateSchema';
import { I18nProvider } from '../../i18n/I18nContext';
import { PreferencesProvider } from '../../state/PreferencesContext';
import { RatesProvider } from '../../state/RatesContext';
import { ThemeProvider } from '../../theme/ThemeContext';

import { ConverterScreen } from './ConverterScreen';
import { DELETE_ANIMATION_DURATION } from './interactionConstants';

const SNAPSHOT: RateSnapshot = {
  date: '2026-07-27',
  baseCurrencyCode: 'eur',
  rates: { eur: 1, usd: 1.0842, jpy: 165.23 },
};

function storeReturning(serialised: string | null): PreferencesStore {
  return { read: () => Promise.resolve(serialised), write: () => Promise.resolve() };
}

function repositoryReturning(outcome: SnapshotOutcome): RateRepository {
  return { loadLatest: () => Promise.resolve(outcome), loadDate: () => Promise.resolve(outcome) };
}

interface HarnessOptions {
  readonly store?: PreferencesStore;
  readonly repository?: RateRepository;
}

async function renderScreen({
  store = storeReturning(null),
  repository = repositoryReturning({ status: 'ok', snapshot: SNAPSHOT }),
}: HarnessOptions = {}) {
  await render(
    <PreferencesProvider store={store}>
      <ThemeProvider>
        <I18nProvider initialLocale="en">
          <RatesProvider repository={repository}>
            <ConverterScreen />
          </RatesProvider>
        </I18nProvider>
      </ThemeProvider>
    </PreferencesProvider>,
  );

  await act(async () => {});
}

async function pressRemove(label: string) {
  jest.useFakeTimers();

  try {
    await fireEvent.press(screen.getByRole('button', { name: label }));
    await act(async () => {
      jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
    });
  } finally {
    jest.useRealTimers();
  }
}

function activeAmountField(currencyName: string) {
  return screen.getByLabelText(`Amount in ${currencyName}`);
}

function rowLabels(): string[] {
  return screen
    .getAllByRole('button')
    .map((node) => String(node.props.accessibilityLabel ?? ''))
    .filter((label) => /^(Euro|US Dollar|Japanese Yen),/.test(label));
}

describe('ConverterScreen', () => {
  it('shows the date the snapshot itself reports', async () => {
    await renderScreen();

    expect(screen.getByText('Rates from 2026-07-27')).toBeOnTheScreen();
  });

  it('starts on EUR and USD, with EUR active at 1', async () => {
    await renderScreen();

    expect(activeAmountField('Euro').props.value).toBe('');
    expect(activeAmountField('Euro').props.placeholder).toBe('€1.00');
    expect(screen.getByText('$1.08')).toBeOnTheScreen();
  });

  it('converts every other row when the active amount is edited', async () => {
    await renderScreen();

    await fireEvent.changeText(activeAmountField('Euro'), '250');

    expect(screen.getByText('$271.05')).toBeOnTheScreen();
  });

  it('leaves the active row unformatted while it is being typed in', async () => {
    await renderScreen();

    await fireEvent.changeText(activeAmountField('Euro'), '1234567');

    expect(activeAmountField('Euro').props.value).toBe('1234567');
  });

  it('formats the selected amount when editing finishes', async () => {
    await renderScreen();

    await fireEvent.changeText(activeAmountField('Euro'), '1234567.8');
    await fireEvent(activeAmountField('Euro'), 'endEditing');

    expect(activeAmountField('Euro').props.value).toBe('');
    expect(activeAmountField('Euro').props.placeholder).toBe('€1,234,567.80');
  });

  it('moves the input to another row when that row is pressed', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByLabelText(/^US Dollar,/));

    expect(activeAmountField('US Dollar')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Amount in Euro')).toBeNull();
  });

  it('focuses the amount field of the row that was just activated', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByLabelText(/^US Dollar,/));

    expect(activeAmountField('US Dollar')).toHaveProp('autoFocus', true);
  });

  it('leaves a half-typed amount untouched when the active row is pressed', async () => {
    await renderScreen();

    await fireEvent.changeText(activeAmountField('Euro'), '1234567.');
    await fireEvent.press(screen.getByLabelText(/^Euro,/));

    expect(activeAmountField('Euro').props.value).toBe('1234567.');
  });

  it('carries the displayed amount across when the active row changes', async () => {
    await renderScreen();

    await fireEvent.changeText(activeAmountField('Euro'), '250');
    await fireEvent.press(screen.getByLabelText(/^US Dollar,/));

    expect(activeAmountField('US Dollar').props.value).toBe('');
    expect(activeAmountField('US Dollar').props.placeholder).toBe('$271.05');
  });

  it('converts back the other way once another row is active', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByLabelText(/^US Dollar,/));
    await fireEvent.changeText(activeAmountField('US Dollar'), '100');

    expect(screen.getByText('€92.23')).toBeOnTheScreen();
  });

  it('quotes the rate sub-line against whichever row is active', async () => {
    await renderScreen();

    expect(screen.getByText('1 EUR = 1.0842 USD')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText(/^US Dollar,/));

    expect(screen.getByText('1 USD = 0.92233905 EUR')).toBeOnTheScreen();
  });

  it('marks the active row with an accessibility state, not colour alone', async () => {
    await renderScreen();

    expect(screen.getByLabelText(/^Euro,/).props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText(/^US Dollar,/).props.accessibilityState.selected).toBe(false);
  });

  it('restores the persisted currencies, order and amount', async () => {
    await renderScreen({
      store: storeReturning(
        JSON.stringify({
          theme: 'system',
          language: null,
          currencyCodes: ['jpy', 'eur'],
          activeCurrencyCode: 'jpy',
          amountText: '1000',
        }),
      ),
    });

    expect(activeAmountField('Japanese Yen').props.placeholder).toBe('¥1,000');
    expect(screen.getByText('€6.05')).toBeOnTheScreen();
  });

  it('says the rates are stale rather than hiding it', async () => {
    await renderScreen({
      repository: repositoryReturning({
        status: 'stale',
        snapshot: SNAPSHOT,
        reason: 'networkError',
      }),
    });

    expect(screen.getByText('Rates from 2026-07-27')).toBeOnTheScreen();
    expect(screen.getByText('Offline — showing the last rates saved')).toBeOnTheScreen();
  });

  it('keeps converting with the bundled snapshot when the latest snapshot cannot load', async () => {
    await renderScreen({
      repository: repositoryReturning({ status: 'unavailable', reason: 'networkError' }),
    });

    expect(screen.getByText('Rates from 2026-08-01')).toBeOnTheScreen();
    expect(screen.getByText('Could not reach the rate provider')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^US Dollar,/)).toBeOnTheScreen();
    expect(screen.getByText('$1.15')).toBeOnTheScreen();
  });
});

describe('ConverterScreen currency management', () => {
  const THREE_ROWS = JSON.stringify({
    theme: 'system',
    language: null,
    currencyCodes: ['eur', 'usd', 'jpy'],
    activeCurrencyCode: 'eur',
    amountText: '100',
  });

  it('removes a currency and stops converting it', async () => {
    await renderScreen({ store: storeReturning(THREE_ROWS) });

    await pressRemove('Remove US Dollar');

    expect(screen.queryByLabelText(/^US Dollar,/)).toBeNull();
    expect(screen.getByLabelText(/^Japanese Yen,/)).toBeOnTheScreen();
  });

  it('moves the input to a remaining row when the active one is removed', async () => {
    await renderScreen({ store: storeReturning(THREE_ROWS) });

    await pressRemove('Remove Euro');

    expect(screen.queryByLabelText('Amount in Euro')).toBeNull();
    expect(screen.getByLabelText('Amount in US Dollar')).toBeOnTheScreen();
  });

  it('selects the first remaining row after the active bottom row is removed', async () => {
    await renderScreen({
      store: storeReturning(
        JSON.stringify({
          theme: 'system',
          language: null,
          currencyCodes: ['eur', 'usd', 'jpy'],
          activeCurrencyCode: 'jpy',
          amountText: '100',
        }),
      ),
    });

    await pressRemove('Remove Japanese Yen');

    expect(screen.queryByLabelText('Amount in Japanese Yen')).toBeNull();
    expect(screen.getByLabelText('Amount in Euro')).toBeOnTheScreen();
  });

  it('keeps the first remaining row at its converted value after the active row is removed', async () => {
    await renderScreen({
      store: storeReturning(
        JSON.stringify({
          theme: 'system',
          language: null,
          currencyCodes: ['eur', 'usd', 'jpy'],
          activeCurrencyCode: 'jpy',
          amountText: '100',
        }),
      ),
    });

    await pressRemove('Remove Japanese Yen');

    expect(activeAmountField('Euro').props.placeholder).toBe('€0.61');
    expect(screen.getByText('$0.66')).toBeOnTheScreen();
  });

  it('keeps the two-row minimum when three deletion animations are requested together', async () => {
    jest.useFakeTimers();

    try {
      await renderScreen({
        store: storeReturning(
          JSON.stringify({
            theme: 'system',
            language: null,
            currencyCodes: ['eur', 'usd', 'jpy', 'gbp'],
            activeCurrencyCode: 'usd',
            amountText: '100',
          }),
        ),
        repository: repositoryReturning({
          status: 'ok',
          snapshot: {
            ...SNAPSHOT,
            rates: { ...SNAPSHOT.rates, gbp: 0.87 },
          },
        }),
      });

      await fireEvent.press(screen.getByRole('button', { name: 'Remove Euro' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Remove US Dollar' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Remove Japanese Yen' }));
      await act(async () => {
        jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
      });

      expect(screen.queryByLabelText(/^Euro,/)).toBeNull();
      expect(screen.queryByLabelText(/^US Dollar,/)).toBeNull();
      expect(activeAmountField('Japanese Yen')).toBeOnTheScreen();
      expect(screen.getByLabelText(/^British Pound,/)).toBeOnTheScreen();
    } finally {
      await screen.unmount();
      jest.useRealTimers();
    }
  });

  it('reserves the two-row minimum across overlapping deletion animations', async () => {
    jest.useFakeTimers();

    try {
      await renderScreen({ store: storeReturning(THREE_ROWS) });

      await fireEvent.press(screen.getByRole('button', { name: 'Remove Euro' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Remove US Dollar' }));
      await act(async () => {
        jest.advanceTimersByTime(DELETE_ANIMATION_DURATION);
      });

      expect(screen.queryByLabelText(/^Euro,/)).toBeNull();
      expect(activeAmountField('US Dollar')).toBeOnTheScreen();
      expect(screen.getByLabelText(/^Japanese Yen,/)).toBeOnTheScreen();
    } finally {
      await screen.unmount();
      jest.useRealTimers();
    }
  });

  it('does not persist a reserved removal when the screen unmounts during animation', async () => {
    const write = jest.fn(() => Promise.resolve());
    jest.useFakeTimers();

    try {
      await renderScreen({ store: { read: () => Promise.resolve(THREE_ROWS), write } });

      await fireEvent.press(screen.getByRole('button', { name: 'Remove US Dollar' }));
      await screen.unmount();

      expect(write).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('stops offering removal once two rows are left', async () => {
    await renderScreen({ store: storeReturning(THREE_ROWS) });

    await pressRemove('Remove Japanese Yen');

    expect(screen.queryByRole('button', { name: 'Remove Euro' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove US Dollar' })).toBeNull();
  });

  it('moves a currency to a new position through its accessibility action', async () => {
    await renderScreen({ store: storeReturning(THREE_ROWS) });

    await fireEvent(screen.getByLabelText(/^Euro,/), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveDown' },
    });
    await fireEvent(screen.getByLabelText(/^Euro,/), 'accessibilityAction', {
      nativeEvent: { actionName: 'moveDown' },
    });

    expect(rowLabels()).toEqual([
      expect.stringMatching(/^US Dollar,/),
      expect.stringMatching(/^Japanese Yen,/),
      expect.stringMatching(/^Euro,/),
    ]);
  });

  it('persists the dropped currency order', async () => {
    jest.useFakeTimers();
    const store = {
      read: () => Promise.resolve(THREE_ROWS),
      write: jest.fn((_serialised: string) => Promise.resolve()),
    };

    try {
      await renderScreen({ store });

      await fireEvent(screen.getByLabelText(/^Japanese Yen,/), 'accessibilityAction', {
        nativeEvent: { actionName: 'moveUp' },
      });
      await fireEvent(screen.getByLabelText(/^Japanese Yen,/), 'accessibilityAction', {
        nativeEvent: { actionName: 'moveUp' },
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
      });

      expect(store.write).toHaveBeenCalledTimes(1);
      expect(JSON.parse(store.write.mock.calls[0][0])).toMatchObject({
        currencyCodes: ['jpy', 'eur', 'usd'],
      });
    } finally {
      await screen.unmount();
      jest.useRealTimers();
    }
  });

  it('adds a currency from the picker and converts it immediately', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Add currency' }));
    await fireEvent.changeText(screen.getByLabelText('Search currencies'), 'jpy');
    await fireEvent.press(screen.getByLabelText('Japanese Yen, JPY'));

    expect(screen.getByLabelText(/^Japanese Yen,/)).toBeOnTheScreen();

    expect(screen.getByText('¥165')).toBeOnTheScreen();
  });

  it('appends a new currency without changing the existing list order', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Add currency' }));
    await fireEvent.changeText(screen.getByLabelText('Search currencies'), 'jpy');
    await fireEvent.press(screen.getByLabelText('Japanese Yen, JPY'));

    expect(rowLabels()).toEqual([
      expect.stringMatching(/^Euro,/),
      expect.stringMatching(/^US Dollar,/),
      expect.stringMatching(/^Japanese Yen,/),
    ]);
  });
});

describe('ConverterScreen empty and minimum states', () => {
  it('does not show an obsolete no-rates notice when the bundled snapshot is active', async () => {
    await renderScreen({
      repository: repositoryReturning({ status: 'unavailable', reason: 'networkError' }),
    });

    expect(rowLabels()).toEqual([
      expect.stringMatching(/^Euro,/),
      expect.stringMatching(/^US Dollar,/),
    ]);
  });

  it('does not show a note about the two-row minimum', async () => {
    await renderScreen();

    expect(screen.queryByText(/Two currencies is the minimum/)).toBeNull();
  });

  it('says neither once there are rates and room to remove', async () => {
    await renderScreen({
      store: storeReturning(
        JSON.stringify({
          theme: 'system',
          language: null,
          currencyCodes: ['eur', 'usd', 'jpy'],
          activeCurrencyCode: 'eur',
          amountText: '1',
        }),
      ),
    });

    expect(screen.queryByText(/Two currencies is the minimum/)).toBeNull();
    expect(screen.queryByText(/No exchange rates have been downloaded/)).toBeNull();
  });

  it('offers the settings surface from the header', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
  });

  it('keeps the add and rate-information actions in the list footer', async () => {
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Add currency' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'About these rates' })).toBeOnTheScreen();
  });

  it('identifies the app rather than opening on a date', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'OpenCurrency' })).toBeOnTheScreen();
  });

  it('explains the mid-market basis and disclaims it, behind the info button', async () => {
    await renderScreen();

    expect(screen.getByText('Mid-market rates')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'About these rates' }));

    expect(screen.getByText(/midpoint between the buying and the selling price/)).toBeOnTheScreen();
    expect(screen.getByText(/may differ from the rates offered by banks/)).toBeOnTheScreen();
  });

  it('closes the rate information on the acknowledgement button', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'About these rates' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Got it' }));

    expect(screen.queryByText(/may differ from the rates offered by banks/)).toBeNull();
  });
});
