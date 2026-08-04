/** Persists rate snapshots and maintains their recency index. */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseStoredSnapshot, type RateSnapshot } from './rateSchema';

const KEY_PREFIX = 'rates:v1:';
const INDEX_KEY = `${KEY_PREFIX}index`;

const MAX_SNAPSHOTS = 180;

export interface SnapshotStore {
  /** Reads a snapshot for a date, or returns `null`. */
  readonly read: (date: string) => Promise<RateSnapshot | null>;
  /** Reads the newest cached snapshot, or returns `null`. */
  readonly readNewest: () => Promise<RateSnapshot | null>;
  /** Writes a snapshot and evicts old entries when necessary. */
  readonly write: (snapshot: RateSnapshot) => Promise<void>;
}

function snapshotKey(date: string): string {
  return `${KEY_PREFIX}${date}`;
}

function newestDate(dates: readonly string[]): string | null {
  return dates.reduce<string | null>(
    (newest, date) => (newest === null || date > newest ? date : newest),
    null,
  );
}

async function readIndex(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter((date) => typeof date === 'string') : [];
  } catch {
    return [];
  }
}

async function writeIndex(dates: readonly string[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(dates));
}

function evictOverflow(dates: readonly string[]): { kept: string[]; evicted: string[] } {
  if (dates.length <= MAX_SNAPSHOTS) {
    return { kept: [...dates], evicted: [] };
  }

  const pinned = newestDate(dates);

  const capacityForOthers = pinned === null ? MAX_SNAPSHOTS : MAX_SNAPSHOTS - 1;
  const kept: string[] = [];
  const evicted: string[] = [];
  let others = 0;

  for (const date of dates) {
    if (date === pinned) {
      kept.push(date);
    } else if (others < capacityForOthers) {
      kept.push(date);
      others += 1;
    } else {
      evicted.push(date);
    }
  }

  return { kept, evicted };
}

export function createSnapshotStore(): SnapshotStore {
  async function forget(dates: readonly string[], date: string): Promise<void> {
    await AsyncStorage.removeItem(snapshotKey(date));
    await writeIndex(dates.filter((entry) => entry !== date));
  }

  async function readAt(dates: readonly string[], date: string): Promise<RateSnapshot | null> {
    const raw = await AsyncStorage.getItem(snapshotKey(date));
    const snapshot = raw === null ? null : parseStoredSnapshot(raw);

    if (snapshot === null) {
      await forget(dates, date);

      return null;
    }

    return snapshot;
  }

  return {
    async read(date) {
      try {
        const dates = await readIndex();

        return dates.includes(date) ? await readAt(dates, date) : null;
      } catch {
        return null;
      }
    },

    async readNewest() {
      try {
        let dates = await readIndex();
        let candidate = newestDate(dates);

        while (candidate !== null) {
          const snapshot = await readAt(dates, candidate);

          if (snapshot !== null) {
            return snapshot;
          }

          dates = dates.filter((date) => date !== candidate);
          candidate = newestDate(dates);
        }

        return null;
      } catch {
        return null;
      }
    },

    async write(snapshot) {
      try {
        await AsyncStorage.setItem(snapshotKey(snapshot.date), JSON.stringify(snapshot));

        const dates = await readIndex();
        const { kept, evicted } = evictOverflow([
          snapshot.date,
          ...dates.filter((date) => date !== snapshot.date),
        ]);

        if (evicted.length > 0) {
          await AsyncStorage.multiRemove(evicted.map(snapshotKey));
        }

        await writeIndex(kept);
      } catch {
        // Rate caching is best-effort; reads and network fallback keep the app usable.
      }
    },
  };
}
