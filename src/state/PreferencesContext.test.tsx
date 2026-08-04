import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { type PreferencesStore } from '../data/preferencesStorage';

import { parsePreferences, type Preferences } from './preferences';
import { PreferencesProvider, usePreferences } from './PreferencesContext';

const PERSIST_DEBOUNCE_MS = 400;
const DEFAULT_PREFERENCES = parsePreferences(null);

function stubStore(stored: string | null): PreferencesStore & { write: jest.Mock } {
  return {
    read: () => Promise.resolve(stored),
    write: jest.fn(() => Promise.resolve()),
  };
}

interface ProbeProps {
  readonly patch?: Partial<Preferences>;
  readonly seenThemes?: string[];
}

function Probe({ patch, seenThemes }: ProbeProps) {
  const { preferences, updatePreferences } = usePreferences();

  seenThemes?.push(preferences.theme);

  return (
    <>
      <Text>{`theme:${preferences.theme}`}</Text>
      <Text>{`amount:${preferences.amountText}`}</Text>
      <Text>{`active:${preferences.activeCurrencyCode}`}</Text>
      <Text>{`codes:${preferences.currencyCodes.join(',')}`}</Text>
      <Text accessibilityRole="button" onPress={() => updatePreferences(patch ?? {})}>
        apply
      </Text>
    </>
  );
}

async function renderProbe(
  store: PreferencesStore,
  patch?: Partial<Preferences>,
  seenThemes?: string[],
) {
  await render(
    <PreferencesProvider store={store}>
      <Probe patch={patch} seenThemes={seenThemes} />
    </PreferencesProvider>,
  );
}

describe('PreferencesProvider', () => {
  it('ignores hydration that finishes after unmount', async () => {
    let resolveRead!: (value: string | null) => void;
    const store: PreferencesStore = {
      read: () => new Promise((resolve) => (resolveRead = resolve)),
      write: () => Promise.resolve(),
    };

    await renderProbe(store);
    await screen.unmount();
    await act(async () => resolveRead(null));

    expect(screen.queryByText('theme:system')).toBeNull();
  });

  it('hydrates from storage before rendering anything below it', async () => {
    const stored = JSON.stringify({ ...DEFAULT_PREFERENCES, theme: 'dark', amountText: '250' });
    const seenThemes: string[] = [];

    await renderProbe(stubStore(stored), undefined, seenThemes);

    expect(screen.getByText('theme:dark')).toBeOnTheScreen();
    expect(screen.getByText('amount:250')).toBeOnTheScreen();

    expect(seenThemes).toEqual(['dark']);
  });

  it('starts from the defaults when storage is empty', async () => {
    await renderProbe(stubStore(null));

    expect(screen.getByText('theme:system')).toBeOnTheScreen();
    expect(screen.getByText('codes:eur,usd')).toBeOnTheScreen();
    expect(screen.getByText('active:eur')).toBeOnTheScreen();
  });

  it('applies a partial change and leaves the rest alone', async () => {
    await renderProbe(stubStore(null), { amountText: '99' });

    await fireEvent.press(screen.getByRole('button', { name: 'apply' }));

    expect(screen.getByText('amount:99')).toBeOnTheScreen();
    expect(screen.getByText('theme:system')).toBeOnTheScreen();
  });

  it('normalises what it is given rather than trusting the caller', async () => {
    await renderProbe(stubStore(null), { currencyCodes: ['GBP', 'chf'] });

    await fireEvent.press(screen.getByRole('button', { name: 'apply' }));

    expect(screen.getByText('codes:gbp,chf')).toBeOnTheScreen();

    expect(screen.getByText('active:gbp')).toBeOnTheScreen();
  });

  describe('persistence', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('does not write the value it has just read back', async () => {
      const store = stubStore(JSON.stringify(DEFAULT_PREFERENCES));

      await renderProbe(store);
      await act(async () => {
        jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS * 2);
      });

      expect(store.write).not.toHaveBeenCalled();
    });

    it('debounces a burst of changes into one write', async () => {
      const store = stubStore(null);

      await renderProbe(store, { amountText: '7' });

      const apply = screen.getByRole('button', { name: 'apply' });

      await fireEvent.press(apply);
      await act(async () => {
        jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS - 1);
      });

      expect(store.write).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1);
      });

      expect(store.write).toHaveBeenCalledTimes(1);
      expect(JSON.parse(store.write.mock.calls[0][0] as string)).toMatchObject({ amountText: '7' });
    });

    it('does not write when the change leaves the value identical', async () => {
      const store = stubStore(null);

      await renderProbe(store, { theme: 'system' });

      await fireEvent.press(screen.getByRole('button', { name: 'apply' }));
      await act(async () => {
        jest.advanceTimersByTime(PERSIST_DEBOUNCE_MS * 2);
      });

      expect(store.write).not.toHaveBeenCalled();
    });

    it('flushes a pending write when it unmounts', async () => {
      const store = stubStore(null);

      await renderProbe(store, { amountText: '13' });

      await fireEvent.press(screen.getByRole('button', { name: 'apply' }));

      expect(store.write).not.toHaveBeenCalled();

      await screen.unmount();

      expect(store.write).toHaveBeenCalledTimes(1);
      expect(JSON.parse(store.write.mock.calls[0][0] as string)).toMatchObject({
        amountText: '13',
      });
    });
  });
});

describe('usePreferences', () => {
  it('refuses to run outside a provider rather than editing defaults nobody stores', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Probe />)).rejects.toThrow('usePreferences must be used inside');

    consoleError.mockRestore();
  });
});
