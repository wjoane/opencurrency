import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { type RateRepository, type SnapshotOutcome } from '../data/rateRepository';
import { type RateSnapshot } from '../data/rateSchema';

import { RatesProvider, useRates } from './RatesContext';

const TODAY = '2026-07-27';

function snapshot(date: string, usdRate = 1.17): RateSnapshot {
  return { date, baseCurrencyCode: 'eur', rates: { usd: usdRate } };
}

function Probe() {
  const { status, snapshot: current, failure, selectedDate, selectDate, reload } = useRates();

  return (
    <>
      <Text>{`status:${status}`}</Text>
      <Text>{`date:${current?.date ?? 'none'}`}</Text>
      <Text>{`failure:${failure ?? 'none'}`}</Text>
      <Text>{`selected:${selectedDate ?? 'latest'}`}</Text>
      <Text accessibilityRole="button" onPress={() => selectDate('2024-03-02')}>
        pick
      </Text>
      <Text accessibilityRole="button" onPress={reload}>
        reload
      </Text>
    </>
  );
}

function stubRepository(
  latest: SnapshotOutcome,
  byDate: SnapshotOutcome = latest,
): RateRepository & { loadLatest: jest.Mock; loadDate: jest.Mock } {
  return {
    loadLatest: jest.fn(() => Promise.resolve(latest)),
    loadDate: jest.fn((_date: string) => Promise.resolve(byDate)),
  };
}

async function renderProbe(repository: RateRepository) {
  await render(
    <RatesProvider repository={repository}>
      <Probe />
    </RatesProvider>,
  );
}

describe('RatesProvider', () => {
  it('ignores a request that resolves after unmount', async () => {
    let resolveLatest!: (outcome: SnapshotOutcome) => void;
    const repository: RateRepository = {
      loadLatest: () => new Promise((resolve) => (resolveLatest = resolve)),
      loadDate: () => new Promise(() => {}),
    };

    await renderProbe(repository);
    await screen.unmount();
    await act(async () => resolveLatest({ status: 'ok', snapshot: snapshot(TODAY) }));

    expect(screen.queryByText('status:ready')).toBeNull();
  });

  it('asks for the latest snapshot on mount and reports it ready', async () => {
    const repository = stubRepository({ status: 'ok', snapshot: snapshot(TODAY) });

    await renderProbe(repository);

    expect(repository.loadLatest).toHaveBeenCalledTimes(1);
    expect(repository.loadDate).not.toHaveBeenCalled();
    expect(screen.getByText('status:ready')).toBeOnTheScreen();
    expect(screen.getByText(`date:${TODAY}`)).toBeOnTheScreen();
    expect(screen.getByText('selected:latest')).toBeOnTheScreen();
  });

  it('surfaces a stale snapshot as stale, with the reason and the snapshot it fell back to', async () => {
    await renderProbe(
      stubRepository({ status: 'stale', snapshot: snapshot('2026-07-20'), reason: 'networkError' }),
    );

    expect(screen.getByText('status:stale')).toBeOnTheScreen();
    expect(screen.getByText('date:2026-07-20')).toBeOnTheScreen();
    expect(screen.getByText('failure:networkError')).toBeOnTheScreen();
  });

  it('keeps the bundled snapshot when the repository reports no available snapshot', async () => {
    await renderProbe(stubRepository({ status: 'unavailable', reason: 'networkError' }));

    expect(screen.getByText('status:error')).toBeOnTheScreen();
    expect(screen.getByText('date:2026-08-01')).toBeOnTheScreen();
  });

  it('loads the picked date instead of the latest one', async () => {
    const repository = stubRepository(
      { status: 'ok', snapshot: snapshot(TODAY) },
      { status: 'ok', snapshot: snapshot('2024-03-02', 1.09) },
    );

    await renderProbe(repository);
    await fireEvent.press(screen.getByRole('button', { name: 'pick' }));

    expect(repository.loadDate).toHaveBeenCalledWith('2024-03-02');
    expect(screen.getByText('date:2024-03-02')).toBeOnTheScreen();
    expect(screen.getByText('selected:2024-03-02')).toBeOnTheScreen();
  });

  it('keeps the snapshot it was already showing when the picked date fails', async () => {
    const repository = stubRepository(
      { status: 'ok', snapshot: snapshot(TODAY) },
      { status: 'unavailable', reason: 'notFound' },
    );

    await renderProbe(repository);
    await fireEvent.press(screen.getByRole('button', { name: 'pick' }));

    expect(screen.getByText('status:error')).toBeOnTheScreen();
    expect(screen.getByText(`date:${TODAY}`)).toBeOnTheScreen();
    expect(screen.getByText('failure:notFound')).toBeOnTheScreen();
  });

  it('asks again on reload', async () => {
    const repository = stubRepository({ status: 'ok', snapshot: snapshot(TODAY) });

    await renderProbe(repository);
    await fireEvent.press(screen.getByRole('button', { name: 'reload' }));

    expect(repository.loadLatest).toHaveBeenCalledTimes(2);
  });
});

describe('useRates', () => {
  it('refuses to run outside a provider rather than rendering an empty rate table', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(render(<Probe />)).rejects.toThrow('useRates must be used inside');

    consoleError.mockRestore();
  });
});
