import { act } from '@testing-library/react-native';
import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';

/**
 * Replaces the platform app-state stream with one the test drives itself, and returns
 * the function that delivers a new state to everything listening.
 *
 * Install it before rendering: subscriptions are made while the tree mounts.
 */
export function trackAppState() {
  const listeners = new Set<(next: AppStateStatus) => void>();

  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    listeners.add(listener);

    return { remove: () => listeners.delete(listener) } as NativeEventSubscription;
  });

  return async (next: AppStateStatus) => {
    await act(async () => {
      for (const listener of listeners) {
        listener(next);
      }
    });
  };
}
