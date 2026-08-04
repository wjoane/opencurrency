/** Stores the serialized user preferences. */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'preferences:v1';

export interface PreferencesStore {
  readonly read: () => Promise<string | null>;
  readonly write: (serialised: string) => Promise<void>;
}

export function createPreferencesStore(): PreferencesStore {
  return {
    async read() {
      try {
        return await AsyncStorage.getItem(PREFERENCES_KEY);
      } catch {
        return null;
      }
    },

    async write(serialised) {
      try {
        await AsyncStorage.setItem(PREFERENCES_KEY, serialised);
      } catch {
        // Preferences persistence is best-effort; the in-memory selection remains usable.
      }
    },
  };
}
