import AsyncStorage from '@react-native-async-storage/async-storage';

import { createRateRepository, type RateRepositoryOptions } from './rateRepository';
import { type RateFetchResult } from './ratesApi';
import { type RateSnapshot } from './rateSchema';
import { createSnapshotStore } from './storage';

const TODAY = '2026-07-27';
const YESTERDAY = '2026-07-26';

function snapshot(date: string, usdRate = 1.17): RateSnapshot {
  return { date, baseCurrencyCode: 'eur', rates: { usd: usdRate } };
}

function clockAt(date: string): () => Date {
  return () => new Date(`${date}T12:00:00.000Z`);
}

function repositoryWith(
  fetchSnapshot: jest.Mock<Promise<RateFetchResult>, [string]>,
  overrides: RateRepositoryOptions = {},
) {
  return createRateRepository({
    store: createSnapshotStore(),
    now: clockAt(TODAY),
    fetchSnapshot,
    ...overrides,
    fallbackSnapshot: overrides.fallbackSnapshot ?? null,
  });
}

function respondWith(result: RateFetchResult): jest.Mock<Promise<RateFetchResult>, [string]> {
  return jest.fn((_dateSpec: string) => Promise.resolve(result));
}

describe('createRateRepository', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('loadLatest', () => {
    it('requests `latest` and stores the snapshot under the date the response reports', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(YESTERDAY) });
      const store = createSnapshotStore();
      const repository = repositoryWith(fetchSnapshot, { store });

      const outcome = await repository.loadLatest();

      expect(fetchSnapshot).toHaveBeenCalledWith('latest');
      expect(outcome).toEqual({ status: 'ok', snapshot: snapshot(YESTERDAY) });
      expect(await store.read(YESTERDAY)).toEqual(snapshot(YESTERDAY));
      expect(await store.read(TODAY)).toBeNull();
    });

    it('performs zero fetches when a snapshot for today is already cached', async () => {
      const store = createSnapshotStore();
      await store.write(snapshot(TODAY));

      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });
      const outcome = await repositoryWith(fetchSnapshot, { store }).loadLatest();

      expect(fetchSnapshot).not.toHaveBeenCalled();
      expect(outcome).toEqual({ status: 'ok', snapshot: snapshot(TODAY) });
    });

    it('still fetches when the only cached snapshot is from an earlier date', async () => {
      const store = createSnapshotStore();
      await store.write(snapshot(YESTERDAY));

      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(TODAY, 1.19) });
      const outcome = await repositoryWith(fetchSnapshot, { store }).loadLatest();

      expect(fetchSnapshot).toHaveBeenCalledTimes(1);
      expect(outcome).toEqual({ status: 'ok', snapshot: snapshot(TODAY, 1.19) });
    });

    it('causes exactly one fetch when two callers ask at the same time', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(TODAY) });
      const repository = repositoryWith(fetchSnapshot);

      const [first, second] = await Promise.all([repository.loadLatest(), repository.loadLatest()]);

      expect(fetchSnapshot).toHaveBeenCalledTimes(1);
      expect(first).toEqual(second);
    });

    it('does not fetch a second time once the date is cached', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(TODAY) });
      const repository = repositoryWith(fetchSnapshot);

      await repository.loadLatest();
      await repository.loadLatest();

      expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    });

    it('returns the newest cached snapshot, marked stale, when the network fails', async () => {
      const store = createSnapshotStore();
      await store.write(snapshot('2024-03-02', 1.09));
      await store.write(snapshot(YESTERDAY, 1.15));

      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });
      const outcome = await repositoryWith(fetchSnapshot, { store }).loadLatest();

      expect(outcome).toEqual({
        status: 'stale',
        snapshot: snapshot(YESTERDAY, 1.15),
        reason: 'networkError',
      });
    });

    it('uses the bundled snapshot when the network fails before any snapshot is cached', async () => {
      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });

      const outcome = await createRateRepository({
        store: createSnapshotStore(),
        now: clockAt(TODAY),
        fetchSnapshot,
      }).loadLatest();

      expect(outcome).toMatchObject({
        status: 'stale',
        reason: 'networkError',
        snapshot: { date: '2026-08-01', baseCurrencyCode: 'eur' },
      });
    });

    it('reports unavailable when the network fails and nothing is cached', async () => {
      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });

      expect(await repositoryWith(fetchSnapshot).loadLatest()).toEqual({
        status: 'unavailable',
        reason: 'networkError',
      });
    });

    it('retries after a failure rather than remembering it', async () => {
      const fetchSnapshot = jest
        .fn<Promise<RateFetchResult>, [string]>()
        .mockResolvedValueOnce({ ok: false, reason: 'networkError' })
        .mockResolvedValueOnce({ ok: true, snapshot: snapshot(TODAY) });
      const repository = repositoryWith(fetchSnapshot);

      expect((await repository.loadLatest()).status).toBe('unavailable');
      expect((await repository.loadLatest()).status).toBe('ok');
      expect(fetchSnapshot).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadDate', () => {
    it('requests the explicit date and caches it', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot('2024-03-02', 1.09) });
      const repository = repositoryWith(fetchSnapshot);

      const outcome = await repository.loadDate('2024-03-02');

      expect(fetchSnapshot).toHaveBeenCalledWith('2024-03-02');
      expect(outcome).toEqual({ status: 'ok', snapshot: snapshot('2024-03-02', 1.09) });
    });

    it('performs zero fetches on a cache hit', async () => {
      const store = createSnapshotStore();
      await store.write(snapshot('2024-03-02', 1.09));

      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });
      const outcome = await repositoryWith(fetchSnapshot, { store }).loadDate('2024-03-02');

      expect(fetchSnapshot).not.toHaveBeenCalled();
      expect(outcome).toEqual({ status: 'ok', snapshot: snapshot('2024-03-02', 1.09) });
    });

    it('causes exactly one fetch when two callers ask for the same date at once', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot('2024-03-02') });
      const repository = repositoryWith(fetchSnapshot);

      await Promise.all([repository.loadDate('2024-03-02'), repository.loadDate('2024-03-02')]);

      expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    });

    it('never substitutes another date when the fetch fails', async () => {
      const store = createSnapshotStore();
      await store.write(snapshot(TODAY, 1.19));

      const fetchSnapshot = respondWith({ ok: false, reason: 'networkError' });
      const outcome = await repositoryWith(fetchSnapshot, { store }).loadDate('2024-03-02');

      expect(outcome).toEqual({ status: 'unavailable', reason: 'networkError' });
    });

    it('surfaces a date the provider does not publish as notFound', async () => {
      const fetchSnapshot = respondWith({ ok: false, reason: 'notFound' });

      expect(await repositoryWith(fetchSnapshot).loadDate('2024-03-01')).toEqual({
        status: 'unavailable',
        reason: 'notFound',
      });
    });

    it("routes today's own date through `latest`", async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(TODAY) });
      const repository = repositoryWith(fetchSnapshot);

      await repository.loadDate(TODAY);

      expect(fetchSnapshot).toHaveBeenCalledWith('latest');
    });

    it('shares the in-flight request between loadDate(today) and loadLatest', async () => {
      const fetchSnapshot = respondWith({ ok: true, snapshot: snapshot(TODAY) });
      const repository = repositoryWith(fetchSnapshot);

      await Promise.all([repository.loadDate(TODAY), repository.loadLatest()]);

      expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    });
  });
});
