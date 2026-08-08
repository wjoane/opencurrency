/**
 * Coordinates cached and remote rate snapshots.
 *
 * It deduplicates concurrent requests, persists successful snapshots, and
 * returns the newest cached snapshot when the latest request is unavailable.
 */

import {
  fetchRateSnapshot,
  LATEST_DATE_SPEC,
  type RateFetchFailure,
  type RateFetchResult,
} from './ratesApi';
import { type RateSnapshot } from './rateSchema';
import { BUNDLED_RATE_SNAPSHOT } from './seededRates';
import { createSnapshotStore, type SnapshotStore } from './storage';

export type SnapshotOutcome =
  | { readonly status: 'ok'; readonly snapshot: RateSnapshot }
  | { readonly status: 'stale'; readonly snapshot: RateSnapshot; readonly reason: RateFetchFailure }
  | { readonly status: 'unavailable'; readonly reason: RateFetchFailure };

export interface RateRepository {
  /** Loads the latest available snapshot. */
  readonly loadLatest: () => Promise<SnapshotOutcome>;
  /** Loads a snapshot for an explicit date. */
  readonly loadDate: (date: string) => Promise<SnapshotOutcome>;
}

export interface RateRepositoryOptions {
  readonly store?: SnapshotStore;
  readonly fetchSnapshot?: (dateSpec: string) => Promise<RateFetchResult>;
  readonly now?: () => Date;
  /** Snapshot used when no persisted rate is available after a failed latest fetch. */
  readonly fallbackSnapshot?: RateSnapshot | null;
}

/** Returns the current date in UTC. */
function currentUtcDate(now: () => Date): string {
  return now().toISOString().slice(0, 10);
}

export function createRateRepository(options: RateRepositoryOptions = {}): RateRepository {
  const store = options.store ?? createSnapshotStore();
  const fetchSnapshot = options.fetchSnapshot ?? fetchRateSnapshot;
  const now = options.now ?? (() => new Date());
  const fallbackSnapshot =
    options.fallbackSnapshot === undefined ? BUNDLED_RATE_SNAPSHOT : options.fallbackSnapshot;

  const inFlight = new Map<string, Promise<SnapshotOutcome>>();

  function deduplicate(key: string, run: () => Promise<SnapshotOutcome>): Promise<SnapshotOutcome> {
    const existing = inFlight.get(key);

    if (existing !== undefined) {
      return existing;
    }

    const pending = run().finally(() => inFlight.delete(key));

    inFlight.set(key, pending);

    return pending;
  }

  async function persist(snapshot: RateSnapshot): Promise<SnapshotOutcome> {
    await store.write(snapshot);

    return { status: 'ok', snapshot };
  }

  async function loadLatest(): Promise<SnapshotOutcome> {
    return deduplicate(LATEST_DATE_SPEC, async () => {
      const cached = await store.read(currentUtcDate(now));

      if (cached !== null) {
        return { status: 'ok', snapshot: cached };
      }

      const result = await fetchSnapshot(LATEST_DATE_SPEC);

      if (result.ok) {
        const newestCached = await store.readNewest();

        return newestCached !== null && newestCached.date > result.snapshot.date
          ? { status: 'ok', snapshot: newestCached }
          : persist(result.snapshot);
      }

      const newest = (await store.readNewest()) ?? fallbackSnapshot;

      return newest === null
        ? { status: 'unavailable', reason: result.reason }
        : { status: 'stale', snapshot: newest, reason: result.reason };
    });
  }

  async function loadDate(date: string): Promise<SnapshotOutcome> {
    if (date === currentUtcDate(now)) {
      return loadLatest();
    }

    return deduplicate(date, async () => {
      const cached = await store.read(date);

      if (cached !== null) {
        return { status: 'ok', snapshot: cached };
      }

      const result = await fetchSnapshot(date);

      return result.ok
        ? persist(result.snapshot)
        : { status: 'unavailable', reason: result.reason };
    });
  }

  return { loadLatest, loadDate };
}
