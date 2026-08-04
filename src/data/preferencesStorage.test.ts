import AsyncStorage from '@react-native-async-storage/async-storage';

import { createPreferencesStore } from './preferencesStorage';

describe('createPreferencesStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips serialized preferences', async () => {
    const store = createPreferencesStore();

    await store.write('{"theme":"dark"}');

    expect(await store.read()).toBe('{"theme":"dark"}');
  });

  it('treats unavailable storage as empty and best-effort', async () => {
    const store = createPreferencesStore();
    jest.mocked(AsyncStorage).getItem.mockRejectedValueOnce(new Error('storage unavailable'));
    jest.mocked(AsyncStorage).setItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(store.read()).resolves.toBeNull();
    await expect(store.write('{"theme":"dark"}')).resolves.toBeUndefined();
  });
});
