import AsyncStorage from '@react-native-async-storage/async-storage';

import { type RateSnapshot } from './rateSchema';
import { createSnapshotStore } from './storage';

const MAX_SNAPSHOTS = 180;

function snapshot(date: string, usdRate = 1.17): RateSnapshot {
  return { date, baseCurrencyCode: 'eur', rates: { usd: usdRate } };
}

function dateAt(offset: number): string {
  return new Date(Date.UTC(2024, 2, 2 + offset)).toISOString().slice(0, 10);
}

async function storedIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem('rates:v1:index');

  return raw === null ? [] : (JSON.parse(raw) as string[]);
}

describe('createSnapshotStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a snapshot under a key named for its own date', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27'));

    expect(await store.read('2026-07-27')).toEqual(snapshot('2026-07-27'));
    expect(await AsyncStorage.getItem('rates:v1:2026-07-27')).not.toBeNull();
  });

  it('returns null for a date it has never seen', async () => {
    const store = createSnapshotStore();

    expect(await store.read('2024-03-02')).toBeNull();
    expect(await store.readNewest()).toBeNull();
  });

  it('maintains the index as writes arrive', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-25'));
    await store.write(snapshot('2026-07-26'));
    await store.write(snapshot('2026-07-27'));

    expect(await storedIndex()).toEqual(['2026-07-27', '2026-07-26', '2026-07-25']);
  });

  it('does not duplicate a date that is written twice', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27', 1.17));
    await store.write(snapshot('2026-07-27', 1.19));

    expect(await storedIndex()).toEqual(['2026-07-27']);
    expect(await store.read('2026-07-27')).toEqual(snapshot('2026-07-27', 1.19));
  });

  it('reports the newest cached snapshot by date, not the most recently written', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27', 1.17));
    await store.write(snapshot('2024-03-02', 1.09));

    expect(await store.readNewest()).toEqual(snapshot('2026-07-27', 1.17));
  });

  it('moves a date to the front of the LRU order when it is read', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-25'));
    await store.write(snapshot('2026-07-26'));
    await store.read('2026-07-25');

    expect(await storedIndex()).toEqual(['2026-07-25', '2026-07-26']);
  });

  it('does not rewrite the index when the read does not change the order', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27'));
    const { setItem } = jest.mocked(AsyncStorage);
    setItem.mockClear();

    await store.read('2026-07-27');

    expect(setItem).not.toHaveBeenCalled();
  });

  it('evicts the least recently used snapshot once the cap is exceeded', async () => {
    const store = createSnapshotStore();

    for (let day = 0; day <= MAX_SNAPSHOTS; day += 1) {
      await store.write(snapshot(dateAt(day)));
    }

    const index = await storedIndex();

    expect(index).toHaveLength(MAX_SNAPSHOTS);
    expect(index).not.toContain(dateAt(0));
    expect(await store.read(dateAt(0))).toBeNull();
    expect(await AsyncStorage.getItem(`rates:v1:${dateAt(0)}`)).toBeNull();
  });

  it('keeps the newest snapshot even when it is the least recently used', async () => {
    const store = createSnapshotStore();
    const newest = dateAt(MAX_SNAPSHOTS + 10);

    await store.write(snapshot(newest, 9.99));

    for (let day = 0; day <= MAX_SNAPSHOTS; day += 1) {
      await store.write(snapshot(dateAt(day)));
    }

    const index = await storedIndex();

    expect(index).toHaveLength(MAX_SNAPSHOTS);
    expect(index).toContain(newest);
    expect(await store.readNewest()).toEqual(snapshot(newest, 9.99));
  });

  it('treats a corrupt stored snapshot as absent and forgets it', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27'));
    await AsyncStorage.setItem('rates:v1:2026-07-27', 'not json');

    expect(await store.read('2026-07-27')).toBeNull();
    expect(await storedIndex()).toEqual([]);
  });

  it('falls through to the next-newest snapshot when the newest is corrupt', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-26', 1.09));
    await store.write(snapshot('2026-07-27', 1.17));
    await AsyncStorage.setItem('rates:v1:2026-07-27', '{"date":"2026-07-27"}');

    expect(await store.readNewest()).toEqual(snapshot('2026-07-26', 1.09));
  });

  it('treats a corrupt index as empty rather than failing every read', async () => {
    const store = createSnapshotStore();

    await store.write(snapshot('2026-07-27'));
    await AsyncStorage.setItem('rates:v1:index', '{ not an array');

    expect(await store.read('2026-07-27')).toBeNull();

    await store.write(snapshot('2026-07-27'));

    expect(await store.read('2026-07-27')).toEqual(snapshot('2026-07-27'));
  });

  it('does not propagate a storage write failure', async () => {
    const store = createSnapshotStore();

    jest.mocked(AsyncStorage).setItem.mockRejectedValueOnce(new Error('QuotaExceededError'));

    await expect(store.write(snapshot('2026-07-27'))).resolves.toBeUndefined();
    expect(await store.read('2026-07-27')).toBeNull();
  });
});
