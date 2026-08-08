/** Provides the selected rate snapshot and loading operations. */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  createRateRepository,
  type RateRepository,
  type SnapshotOutcome,
} from '../data/rateRepository';
import { type RateFetchFailure } from '../data/ratesApi';
import { type RateSnapshot } from '../data/rateSchema';
import { BUNDLED_RATE_SNAPSHOT } from '../data/seededRates';

export type RatesStatus = 'loading' | 'ready' | 'stale' | 'error';

interface RatesState {
  readonly status: RatesStatus;
  readonly snapshot: RateSnapshot;
  readonly failure: RateFetchFailure | null;
  readonly latestKnownDate: string;
}

const INITIAL_STATE: RatesState = {
  status: 'loading',
  snapshot: BUNDLED_RATE_SNAPSHOT,
  failure: null,
  latestKnownDate: BUNDLED_RATE_SNAPSHOT.date,
};

type RatesAction =
  | { readonly type: 'requested' }
  | { readonly type: 'resolved'; readonly outcome: SnapshotOutcome; readonly latest: boolean };

function reduce(state: RatesState, action: RatesAction): RatesState {
  if (action.type === 'requested') {
    return { ...state, status: 'loading', failure: null };
  }

  const { outcome } = action;
  const latestKnownDate =
    action.latest && outcome.status !== 'unavailable'
      ? outcome.snapshot.date
      : state.latestKnownDate;

  switch (outcome.status) {
    case 'ok':
      return { status: 'ready', snapshot: outcome.snapshot, failure: null, latestKnownDate };
    case 'stale':
      return {
        status: 'stale',
        snapshot: outcome.snapshot,
        failure: outcome.reason,
        latestKnownDate,
      };
    default:
      return { ...state, status: 'error', failure: outcome.reason };
  }
}

export interface RatesContextValue extends RatesState {
  readonly selectedDate: string | null;
  readonly selectDate: (date: string | null) => void;
  readonly reload: () => void;
}

const RatesContext = createContext<RatesContextValue | null>(null);

export interface RatesProviderProps {
  readonly children: ReactNode;
  readonly repository?: RateRepository;
}

export function RatesProvider({ children, repository }: RatesProviderProps) {
  const resolvedRepository = useMemo(() => repository ?? createRateRepository(), [repository]);
  const [state, dispatch] = useReducer(reduce, INITIAL_STATE);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const latest = selectedDate === null;

    dispatch({ type: 'requested' });

    const request =
      selectedDate === null
        ? resolvedRepository.loadLatest()
        : resolvedRepository.loadDate(selectedDate);

    void request.then((outcome) => {
      if (!cancelled) {
        dispatch({ type: 'resolved', outcome, latest });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedRepository, selectedDate, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active' && selectedDate === null) {
        reload();
      }
    });

    return () => subscription.remove();
  }, [selectedDate, reload]);

  const value = useMemo<RatesContextValue>(
    () => ({ ...state, selectedDate, selectDate: setSelectedDate, reload }),
    [state, selectedDate, reload],
  );

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export function useRates(): RatesContextValue {
  const value = useContext(RatesContext);

  if (value === null) {
    throw new Error('useRates must be used inside a RatesProvider');
  }

  return value;
}
