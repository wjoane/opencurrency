/** Provides hydrated preferences and their update operations. */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createPreferencesStore, type PreferencesStore } from '../data/preferencesStorage';

import {
  normalisePreferences,
  parsePreferences,
  type Preferences,
  serialisePreferences,
} from './preferences';

const PERSIST_DEBOUNCE_MS = 400;

export interface PreferencesContextValue {
  readonly preferences: Preferences;

  readonly updatePreferences: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export interface PreferencesProviderProps {
  readonly children: ReactNode;

  readonly store?: PreferencesStore;
}

export function PreferencesProvider({ children, store }: PreferencesProviderProps) {
  const resolvedStore = useMemo(() => store ?? createPreferencesStore(), [store]);
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    let cancelled = false;

    void resolvedStore.read().then((serialised) => {
      if (!cancelled) {
        setPreferences(parsePreferences(serialised));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedStore]);

  const persisted = useRef<string | null>(null);
  const unwritten = useRef<string | null>(null);

  useEffect(() => {
    if (preferences === null) {
      return;
    }

    const serialised = serialisePreferences(preferences);

    if (persisted.current === null) {
      persisted.current = serialised;

      return;
    }

    if (persisted.current === serialised) {
      return;
    }

    persisted.current = serialised;
    unwritten.current = serialised;

    const timer = setTimeout(() => {
      unwritten.current = null;
      void resolvedStore.write(serialised);
    }, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [preferences, resolvedStore]);

  useEffect(
    () => () => {
      if (unwritten.current !== null) {
        void resolvedStore.write(unwritten.current);
      }
    },
    [resolvedStore],
  );

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((current) =>
      current === null ? current : normalisePreferences({ ...current, ...patch }),
    );
  }, []);

  const value = useMemo<PreferencesContextValue | null>(
    () => (preferences === null ? null : { preferences, updatePreferences }),
    [preferences, updatePreferences],
  );

  if (value === null) {
    return null;
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);

  if (value === null) {
    throw new Error('usePreferences must be used inside a PreferencesProvider');
  }

  return value;
}
